"""
支出視圖
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from django.utils import timezone
from decimal import Decimal
from .models import Expense, ExpenseSplit, SplitType
from .serializers import ExpenseSerializer, ExpenseSplitSerializer
from apps.events.models import ActivityLog, ActionType


class ExpenseViewSet(viewsets.ModelViewSet):
    """支出管理視圖集"""
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """根據用戶權限過濾查詢集"""
        queryset = Expense.objects.select_related(
            'user', 'category', 'event', 'group'
        ).prefetch_related('splits__participant')
        
        # 如果不是系統管理員，只顯示相關的支出
        if self.request.user.role != 'ADMIN':
            queryset = queryset.filter(
                models.Q(user=self.request.user) |
                models.Q(event__participants__user=self.request.user) |
                models.Q(event__managers=self.request.user) |
                models.Q(group__managers=self.request.user) |
                models.Q(group__members__user=self.request.user)
            ).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        """創建支出時設置用戶並創建分攤記錄"""
        # 檢查創建權限
        event_id = serializer.validated_data.get('event_id')
        event = None
        if event_id:
            from apps.events.models import Event
            try:
                event = Event.objects.get(id=event_id)
            except Event.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'event_id': '指定的活動不存在'})
        
        if event:
            # 如果活動已完成或取消，只有活動管理者可以新增
            if event.status in ['COMPLETED', 'CANCELLED']:
                if not event.can_user_manage(self.request.user):
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied('只有活動管理者可以在已結束的活動中新增支出')
            else:
                # 活動進行中時，必須是參與者才能新增
                if not event.participants.filter(user=self.request.user, is_active=True).exists():
                    if not event.can_user_manage(self.request.user):
                        from rest_framework.exceptions import PermissionDenied
                        raise PermissionDenied('您不是此活動的參與者，無法新增支出')
        
        # 获取分帐数据
        split_type = serializer.validated_data.pop('split_type', None)
        split_participants_data = serializer.validated_data.pop('split_participants', [])
        
        expense = serializer.save(user=self.request.user)
        
        # 如果有分帐数据，创建自定义分攤記錄
        if split_type and split_participants_data and expense.event:
            self._create_custom_splits(expense, split_type, split_participants_data)
        # 否则如果有關聯活動，自動創建默認分攤記錄
        elif expense.event:
            self._create_default_splits(expense)
            
        # 記錄活動日誌
        if expense.event:
            ActivityLog.objects.create(
                activity=expense.event,
                action_type=ActionType.EXPENSE_ADD,
                description=f"新增支出「{expense.description}」NT${expense.amount}",
                operator=self.request.user,
                metadata={'expense_id': expense.id, 'amount': str(expense.amount)}
            )
    
    def _create_default_splits(self, expense):
        """為支出創建默認的平均分攤記錄"""
        if not expense.event:
            return
        
        participants = expense.get_participants_for_split()
        if not participants:
            return
        
        # 計算平均分攤金額
        participant_count = len(participants)
        amount_per_person = expense.amount / participant_count
        
        # 創建分攤記錄
        splits = []
        for participant in participants:
            splits.append(ExpenseSplit(
                expense=expense,
                participant=participant,
                split_type=SplitType.AVERAGE,
                split_value=Decimal('1.0') / participant_count,
                calculated_amount=amount_per_person
            ))
        
        ExpenseSplit.objects.bulk_create(splits)
    
    def _create_custom_splits(self, expense, split_type, split_participants_data):
        """为支出创建自定义分攤記錄"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        splits = []
        total_calculated = Decimal('0')
        
        # 将字符串映射为枚举值
        split_type_map = {
            'AVERAGE': SplitType.AVERAGE,
            'RATIO': SplitType.RATIO,
            'FIXED': SplitType.FIXED,
            'SELECTIVE': SplitType.SELECTIVE
        }
        
        split_type_enum = split_type_map.get(split_type, SplitType.AVERAGE)
        
        for participant_data in split_participants_data:
            user_id = participant_data.get('user_id')
            split_value = Decimal(str(participant_data.get('split_value', 0)))
            calculated_amount = Decimal(str(participant_data.get('calculated_amount', 0)))
            
            try:
                participant = User.objects.get(id=user_id)
            except User.DoesNotExist:
                continue
            
            splits.append(ExpenseSplit(
                expense=expense,
                participant=participant,
                split_type=split_type_enum,
                split_value=split_value,
                calculated_amount=calculated_amount,
                is_adjusted=True,
                adjusted_by=self.request.user,
                adjusted_at=timezone.now()
            ))
            total_calculated += calculated_amount
        
        # 检查总金额是否合理 (允许小数误差)
        if splits and abs(total_calculated - expense.amount) <= Decimal('0.01'):
            ExpenseSplit.objects.bulk_create(splits)
    
    @action(detail=True, methods=['post'])
    def adjust_splits(self, request, pk=None):
        """調整支出分攤"""
        expense = self.get_object()
        user = request.user
        splits_data = request.data.get('splits', [])
        
        # 檢查權限
        if not expense.can_user_edit(user):
            return Response(
                {'error': '您沒有權限調整此支出的分攤'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        with transaction.atomic():
            # 刪除現有分攤記錄
            expense.splits.all().delete()
            
            # 創建新的分攤記錄
            total_amount = Decimal('0')
            new_splits = []
            
            for split_data in splits_data:
                participant_id = split_data.get('participant_id')
                split_type = split_data.get('split_type', SplitType.AVERAGE)
                split_value = Decimal(str(split_data.get('split_value', 0)))
                
                try:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    participant = User.objects.get(id=participant_id)
                except User.DoesNotExist:
                    return Response(
                        {'error': f'參與者 {participant_id} 不存在'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # 計算實際金額
                if split_type == SplitType.AVERAGE:
                    calculated_amount = expense.amount * split_value
                elif split_type == SplitType.RATIO:
                    calculated_amount = expense.amount * split_value
                elif split_type == SplitType.FIXED:
                    calculated_amount = split_value
                else:
                    calculated_amount = split_value
                
                total_amount += calculated_amount
                
                new_splits.append(ExpenseSplit(
                    expense=expense,
                    participant=participant,
                    split_type=split_type,
                    split_value=split_value,
                    calculated_amount=calculated_amount,
                    is_adjusted=True,
                    adjusted_by=user,
                    adjusted_at=timezone.now()
                ))
            
            # 檢查總金額是否合理（允許一些小數誤差）
            if abs(total_amount - expense.amount) > Decimal('0.01'):
                return Response(
                    {'error': f'分攤總金額 {total_amount} 與支出金額 {expense.amount} 不符'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            ExpenseSplit.objects.bulk_create(new_splits)
            
            # 記錄活動日誌
            if expense.event:
                ActivityLog.objects.create(
                    activity=expense.event,
                    action_type=ActionType.SPLIT_ADJUST,
                    description=f"調整支出「{expense.description}」的分攤方式",
                    operator=user,
                    metadata={'expense_id': expense.id, 'splits_count': len(new_splits)}
                )
        
        # 返回更新後的支出資料
        serializer = self.get_serializer(expense)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def splits(self, request, pk=None):
        """獲取支出分攤詳情"""
        expense = self.get_object()
        splits = expense.splits.all()
        serializer = ExpenseSplitSerializer(splits, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def auto_split(self, request, pk=None):
        """自動重新計算分攤"""
        expense = self.get_object()
        user = request.user
        split_type = request.data.get('split_type', 'AVERAGE')
        
        # 檢查權限
        if not expense.can_user_edit(user):
            return Response(
                {'error': '您沒有權限調整此支出的分攤'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not expense.event:
            return Response(
                {'error': '此支出未關聯活動，無法自動分攤'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # 刪除現有分攤記錄
            expense.splits.all().delete()
            
            # 重新創建分攤記錄
            participants = expense.get_participants_for_split()
            if not participants:
                return Response(
                    {'error': '找不到可分攤的參與者'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            participant_count = len(participants)
            amount_per_person = expense.amount / participant_count
            
            splits = []
            for participant in participants:
                splits.append(ExpenseSplit(
                    expense=expense,
                    participant=participant,
                    split_type=SplitType.AVERAGE,
                    split_value=Decimal('1.0') / participant_count,
                    calculated_amount=amount_per_person
                ))
            
            ExpenseSplit.objects.bulk_create(splits)
            
            # 記錄活動日誌
            ActivityLog.objects.create(
                activity=expense.event,
                action_type=ActionType.SPLIT_ADJUST,
                description=f"重新計算支出「{expense.description}」的平均分攤",
                operator=user,
                metadata={'expense_id': expense.id, 'participants_count': participant_count}
            )
        
        # 返回更新後的支出資料
        serializer = self.get_serializer(expense)
        return Response(serializer.data)
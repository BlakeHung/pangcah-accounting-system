"""
儀表板 API 視圖
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal

from .models import DashboardConfig, AlertNotification, FinancialGoal
from .serializers import (
    DashboardConfigSerializer, AlertNotificationSerializer,
    AlertNotificationUpdateSerializer, FinancialGoalSerializer,
    FinancialGoalUpdateSerializer, DashboardStatsSerializer,
    ChartDataSerializer
)
from apps.expenses.models import Expense
from apps.categories.models import Category


class DashboardConfigViewSet(viewsets.ModelViewSet):
    """儀表板配置管理 ViewSet"""
    
    serializer_class = DashboardConfigSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return DashboardConfig.objects.filter(user=self.request.user)
    
    def get_object(self):
        """獲取或創建用戶的儀表板配置"""
        config, created = DashboardConfig.objects.get_or_create(
            user=self.request.user
        )
        return config
    
    @action(detail=False, methods=['get'])
    def my_config(self, request):
        """獲取當前用戶的儀表板配置"""
        config = self.get_object()
        serializer = self.get_serializer(config)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post', 'put', 'patch'])
    def update_config(self, request):
        """更新當前用戶的儀表板配置"""
        config = self.get_object()
        serializer = self.get_serializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AlertNotificationViewSet(viewsets.ModelViewSet):
    """警報通知管理 ViewSet"""
    
    serializer_class = AlertNotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AlertNotification.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return AlertNotificationUpdateSerializer
        return super().get_serializer_class()
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """獲取未讀通知"""
        notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """標記所有通知為已讀"""
        updated_count = self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({
            'message': f'已標記 {updated_count} 條通知為已讀',
            'updated_count': updated_count
        })
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """標記單個通知為已讀"""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """清除所有通知"""
        deleted_count = self.get_queryset().count()
        self.get_queryset().delete()
        return Response({
            'message': f'已清除 {deleted_count} 條通知',
            'deleted_count': deleted_count
        })


class FinancialGoalViewSet(viewsets.ModelViewSet):
    """財務目標管理 ViewSet"""
    
    serializer_class = FinancialGoalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return FinancialGoal.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return FinancialGoalUpdateSerializer
        return super().get_serializer_class()
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """獲取活躍的財務目標"""
        goals = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(goals, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def completed(self, request):
        """獲取已完成的財務目標"""
        goals = self.get_queryset().filter(current_amount__gte=models.F('target_amount'))
        serializer = self.get_serializer(goals, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """更新目標進度"""
        goal = self.get_object()
        amount = request.data.get('amount')
        
        if amount is None:
            return Response(
                {'error': '請提供 amount 參數'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = Decimal(str(amount))
            goal.current_amount = amount
            goal.save(update_fields=['current_amount', 'updated_at'])
            
            # 檢查是否達到里程碑
            self._check_milestones(goal)
            
            serializer = self.get_serializer(goal)
            return Response(serializer.data)
            
        except (ValueError, TypeError):
            return Response(
                {'error': '無效的金額格式'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _check_milestones(self, goal):
        """檢查並發送里程碑通知"""
        if not goal.notify_on_progress or not goal.notify_milestones:
            return
        
        progress = goal.progress_percentage
        
        for milestone in goal.notify_milestones:
            if progress >= milestone:
                # 檢查是否已經發送過此里程碑通知
                existing_notification = AlertNotification.objects.filter(
                    user=goal.user,
                    alert_type='income_goal',
                    data__goal_id=goal.id,
                    data__milestone=milestone
                ).exists()
                
                if not existing_notification:
                    AlertNotification.objects.create(
                        user=goal.user,
                        alert_type='income_goal',
                        severity='success' if milestone == 100 else 'info',
                        title=f'目標進度達成 {milestone}%',
                        message=f'恭喜！您的目標「{goal.title}」已達成 {milestone}%',
                        data={
                            'goal_id': goal.id,
                            'milestone': milestone,
                            'current_amount': float(goal.current_amount),
                            'target_amount': float(goal.target_amount)
                        }
                    )


class DashboardAPIView(viewsets.ViewSet):
    """儀表板統合 API"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """獲取儀表板統計資料"""
        user = request.user
        now = timezone.now()
        
        # 計算時間範圍
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # 獲取用戶的支出資料
        user_expenses = Expense.objects.filter(user=user)
        
        # 計算統計資料
        total_expenses = user_expenses.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        monthly_expenses = user_expenses.filter(
            date__gte=month_start
        ).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        today_expenses = user_expenses.filter(
            date__gte=today_start
        ).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        # 財務目標統計
        active_goals_count = FinancialGoal.objects.filter(
            user=user, is_active=True
        ).count()
        
        # 未讀通知統計
        unread_notifications_count = AlertNotification.objects.filter(
            user=user, is_read=False
        ).count()
        
        data = {
            'total_expenses': total_expenses,
            'total_income': Decimal('0'),  # 暫時固定為 0，可根據需求調整
            'monthly_expenses': monthly_expenses,
            'monthly_income': Decimal('0'),  # 暫時固定為 0
            'today_expenses': today_expenses,
            'today_income': Decimal('0'),  # 暫時固定為 0
            'active_goals_count': active_goals_count,
            'unread_notifications_count': unread_notifications_count,
            'last_updated': now
        }
        
        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def chart_data(self, request):
        """獲取圖表資料"""
        user = request.user
        now = timezone.now()
        
        # 獲取時間範圍參數
        days = int(request.query_params.get('days', 30))
        start_date = now - timedelta(days=days)
        
        # 收支趨勢資料
        income_expense_trend = self._get_income_expense_trend(user, start_date, now)
        
        # 分類分布資料
        category_distribution = self._get_category_distribution(user, start_date, now)
        
        # 群組對比資料
        group_comparison = self._get_group_comparison(user, start_date, now)
        
        # 月度對比資料
        monthly_comparison = self._get_monthly_comparison(user)
        
        data = {
            'income_expense_trend': income_expense_trend,
            'category_distribution': category_distribution,
            'group_comparison': group_comparison,
            'monthly_comparison': monthly_comparison
        }
        
        serializer = ChartDataSerializer(data)
        return Response(serializer.data)
    
    def _get_income_expense_trend(self, user, start_date, end_date):
        """獲取收支趨勢資料"""
        expenses = Expense.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=end_date
        ).values('date').annotate(
            expense=Sum('amount')
        ).order_by('date')
        
        return [
            {
                'date': exp['date'].strftime('%Y-%m-%d'),
                'income': 0,  # 暫時固定為 0
                'expense': float(exp['expense'])
            }
            for exp in expenses
        ]
    
    def _get_category_distribution(self, user, start_date, end_date):
        """獲取分類分布資料"""
        category_data = Expense.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=end_date
        ).values('category__name').annotate(
            value=Sum('amount')
        ).order_by('-value')
        
        return [
            {
                'name': cat['category__name'] or '未分類',
                'value': float(cat['value'])
            }
            for cat in category_data
        ]
    
    def _get_group_comparison(self, user, start_date, end_date):
        """獲取群組對比資料"""
        # 簡化版本，返回用戶所屬群組的比較
        group_data = Expense.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=end_date,
            event__group__isnull=False
        ).values('event__group__name').annotate(
            value=Sum('amount')
        ).order_by('-value')
        
        return [
            {
                'name': group['event__group__name'] or '個人支出',
                'value': float(group['value'])
            }
            for group in group_data
        ]
    
    def _get_monthly_comparison(self, user):
        """獲取月度對比資料"""
        now = timezone.now()
        months_data = []
        
        for i in range(6):  # 最近 6 個月
            month_start = (now.replace(day=1) - timedelta(days=i*30)).replace(day=1)
            month_end = month_start.replace(day=28) + timedelta(days=4)
            month_end = month_end - timedelta(days=month_end.day)
            
            month_expense = Expense.objects.filter(
                user=user,
                date__gte=month_start,
                date__lte=month_end
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            months_data.append({
                'month': month_start.strftime('%Y-%m'),
                'expense': float(month_expense),
                'income': 0  # 暫時固定為 0
            })
        
        return list(reversed(months_data))
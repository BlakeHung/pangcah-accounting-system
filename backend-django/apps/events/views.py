"""
活動視圖
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db import models
from .models import Event, ActivityParticipant, ActivityLog, ActionType
from .serializers import EventSerializer, ActivityParticipantSerializer, ActivityLogSerializer


class EventViewSet(viewsets.ModelViewSet):
    """活動管理視圖集"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """根據用戶權限過濾查詢集"""
        queryset = Event.objects.select_related('group', 'created_by').prefetch_related(
            'managers', 'participants__user', 'logs__operator'
        )
        
        # 如果不是系統管理員，只顯示相關的活動
        if self.request.user.role != 'ADMIN':
            queryset = queryset.filter(
                models.Q(participants__user=self.request.user) |
                models.Q(managers=self.request.user) |
                models.Q(group__managers=self.request.user) |
                models.Q(group__members__user=self.request.user)
            ).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        """創建活動時設置創建者"""
        serializer.save(created_by=self.request.user)
        
        # 記錄操作日誌
        ActivityLog.objects.create(
            activity=serializer.instance,
            action_type=ActionType.ACTIVITY_EDIT,
            description=f"創建活動「{serializer.instance.name}」",
            operator=self.request.user
        )
    
    def update(self, request, *args, **kwargs):
        """更新活動並檢查權限"""
        instance = self.get_object()
        
        # 檢查用戶是否有管理權限
        if not instance.can_user_manage(request.user):
            return Response(
                {'error': '您沒有權限編輯此活動'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """部分更新活動並檢查權限"""
        instance = self.get_object()
        
        # 檢查用戶是否有管理權限
        if not instance.can_user_manage(request.user):
            return Response(
                {'error': '您沒有權限編輯此活動'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().partial_update(request, *args, **kwargs)

    def perform_update(self, serializer):
        """更新活動時記錄日誌"""
        old_name = self.get_object().name
        serializer.save()
        
        # 記錄操作日誌
        ActivityLog.objects.create(
            activity=serializer.instance,
            action_type=ActionType.ACTIVITY_EDIT,
            description=f"編輯活動「{old_name}」→「{serializer.instance.name}」",
            operator=self.request.user,
            metadata={'old_name': old_name, 'new_name': serializer.instance.name}
        )
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """用戶加入活動"""
        activity = self.get_object()
        user = request.user
        
        # 檢查權限
        if activity.is_in_progress and not activity.can_user_manage(user):
            return Response(
                {'error': '活動已開始，只有管理者可以添加新參與者'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 檢查是否已經參與
        if activity.participants.filter(user=user, is_active=True).exists():
            return Response(
                {'error': '您已經是此活動的參與者'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 檢查是否是已經是管理者但不是參與者（重新加入的情況）
        is_manager = activity.managers.filter(id=user.id).exists()
        
        with transaction.atomic():
            # 創建參與記錄
            split_option = request.data.get('split_option', 'FULL_SPLIT')
            participant = ActivityParticipant.objects.create(
                activity=activity,
                user=user,
                split_option=split_option,
                partial_split_expenses=request.data.get('partial_split_expenses', [])
            )
            
            # 如果用戶是 ADMIN 且不是管理者，自動設為管理者
            if user.role == 'ADMIN' and not is_manager:
                activity.managers.add(user)
                log_description = f"系統管理員「{user.username}」加入活動並自動成為管理者"
                metadata = {'split_option': split_option, 'auto_manager': True}
            else:
                log_description = f"用戶「{user.username}」加入活動"
                metadata = {'split_option': split_option}
            
            # 記錄操作日誌
            ActivityLog.objects.create(
                activity=activity,
                action_type=ActionType.USER_JOIN,
                description=log_description,
                operator=request.user,
                metadata=metadata
            )
        
        serializer = ActivityParticipantSerializer(participant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """用戶離開活動"""
        activity = self.get_object()
        user = request.user
        
        # 檢查是否是活動管理者
        is_manager = activity.managers.filter(id=user.id).exists()
        
        try:
            participant = activity.participants.get(user=user, is_active=True)
        except ActivityParticipant.DoesNotExist:
            # 如果用戶不是參與者但是管理者，允許他們"離開"（移除管理者權限）
            if is_manager:
                with transaction.atomic():
                    # 確保至少保留一位管理者
                    if activity.managers.count() <= 1:
                        return Response(
                            {'error': '活動必須保留至少一位管理者'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # 移除管理者權限
                    activity.managers.remove(user)
                    
                    # 記錄操作日誌
                    ActivityLog.objects.create(
                        activity=activity,
                        action_type=ActionType.USER_LEAVE,
                        description=f"管理者「{user.username}」離開活動並移除管理權限",
                        operator=user
                    )
                
                return Response({'message': '已移除管理者權限並離開活動'})
            else:
                return Response(
                    {'error': '您不是此活動的參與者'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        with transaction.atomic():
            # 設置為非活躍狀態
            participant.is_active = False
            participant.save()
            
            # 如果用戶是管理者，檢查是否需要保留管理權限
            if is_manager:
                # 檢查是否還有其他管理者
                if activity.managers.count() <= 1:
                    return Response(
                        {'error': '您是唯一的管理者，無法離開活動'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # 移除管理者權限
                activity.managers.remove(user)
                message = '已離開活動並移除管理者權限'
                log_description = f"用戶「{user.username}」離開活動並移除管理權限"
            else:
                message = '成功離開活動'
                log_description = f"用戶「{user.username}」離開活動"
            
            # 記錄操作日誌
            ActivityLog.objects.create(
                activity=activity,
                action_type=ActionType.USER_LEAVE,
                description=log_description,
                operator=user
            )
        
        return Response({'message': message})
    
    @action(detail=True, methods=['post'])
    def settlement(self, request, pk=None):
        """執行活動結算"""
        activity = self.get_object()
        user = request.user
        
        try:
            with transaction.atomic():
                activity.perform_settlement(user)
                
                # 記錄操作日誌
                ActivityLog.objects.create(
                    activity=activity,
                    action_type=ActionType.SETTLEMENT,
                    description=f"活動結算完成",
                    operator=user,
                    metadata={'settlement_date': activity.settlement_date.isoformat()}
                )
        except PermissionError as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(activity)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """獲取活動記錄"""
        activity = self.get_object()
        logs = activity.logs.all()
        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """獲取活動參與者"""
        activity = self.get_object()
        participants = activity.participants.filter(is_active=True)
        serializer = ActivityParticipantSerializer(participants, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_manager(self, request, pk=None):
        """將參與者升級為活動管理者"""
        activity = self.get_object()
        
        # 檢查權限：只有超級管理員或現有活動管理者可以指派新管理者
        if not activity.can_user_manage(request.user):
            return Response(
                {'error': '您沒有權限管理此活動的管理者'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': '必須提供 user_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)
            
            # 檢查用戶是否已經是管理者
            if activity.managers.filter(id=user_id).exists():
                return Response(
                    {'error': f'{user.name} 已經是此活動的管理者'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 檢查用戶是否是活動參與者（系統管理員例外）
            if user.role != 'ADMIN' and not activity.participants.filter(user_id=user_id, is_active=True).exists():
                return Response(
                    {'error': f'{user.name} 必須先是活動參與者才能成為管理者'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                # 添加為管理者
                activity.managers.add(user)
                
                # 記錄操作日誌
                ActivityLog.objects.create(
                    activity=activity,
                    action_type=ActionType.MANAGER_ADDED,
                    description=f"將 {user.name} 指派為活動管理者",
                    operator=request.user,
                    metadata={'new_manager_id': user_id, 'new_manager_name': user.name}
                )
            
            return Response({
                'message': f'已將 {user.name} 指派為活動管理者',
                'manager': {
                    'id': user.id,
                    'username': user.username,
                    'name': user.name
                }
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': '找不到指定的用戶'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def invite_participant(self, request, pk=None):
        """管理員邀請用戶加入活動"""
        activity = self.get_object()
        
        # 檢查權限：只有活動管理者可以邀請參與者
        if not activity.can_user_manage(request.user):
            return Response(
                {'error': '您沒有權限管理此活動的參與者'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': '必須提供 user_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)
            
            # 檢查用戶是否已經參與
            if activity.participants.filter(user=user, is_active=True).exists():
                return Response(
                    {'error': f'{user.name} 已經是此活動的參與者'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 允許管理員邀請任何用戶，不限制群組成員身份
            # 這使得活動可以跨群組邀請參與者
            
            with transaction.atomic():
                # 創建參與記錄
                split_option = request.data.get('split_option', 'FULL_SPLIT')
                participant = ActivityParticipant.objects.create(
                    activity=activity,
                    user=user,
                    split_option=split_option,
                    partial_split_expenses=request.data.get('partial_split_expenses', [])
                )
                
                # 記錄操作日誌
                ActivityLog.objects.create(
                    activity=activity,
                    action_type=ActionType.USER_JOIN,
                    description=f"管理員邀請「{user.name}」加入活動",
                    operator=request.user,
                    metadata={'invited_user_id': user_id, 'invited_by': request.user.id}
                )
            
            return Response({
                'message': f'已成功邀請 {user.name} 加入活動',
                'participant': {
                    'id': participant.id,
                    'user_id': user.id,
                    'username': user.username,
                    'name': user.name,
                    'split_option': split_option
                }
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': '找不到指定的用戶'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def remove_manager(self, request, pk=None):
        """移除活動管理者"""
        activity = self.get_object()
        
        # 檢查權限：只有超級管理員或現有活動管理者可以移除管理者
        if not activity.can_user_manage(request.user):
            return Response(
                {'error': '您沒有權限管理此活動的管理者'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': '必須提供 user_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)
            
            # 檢查用戶是否是管理者
            if not activity.managers.filter(id=user_id).exists():
                return Response(
                    {'error': f'{user.name} 不是此活動的管理者'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 確保至少保留一位管理者
            if activity.managers.count() <= 1:
                return Response(
                    {'error': '活動必須保留至少一位管理者'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 防止非超級管理員移除自己
            if user_id == request.user.id and request.user.role != 'ADMIN':
                return Response(
                    {'error': '您不能移除自己的管理者權限'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                # 移除管理者
                activity.managers.remove(user)
                
                # 記錄操作日誌
                ActivityLog.objects.create(
                    activity=activity,
                    action_type=ActionType.MANAGER_REMOVED,
                    description=f"移除 {user.name} 的活動管理者權限",
                    operator=request.user,
                    metadata={'removed_manager_id': user_id, 'removed_manager_name': user.name}
                )
            
            return Response({
                'message': f'已移除 {user.name} 的活動管理者權限'
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': '找不到指定的用戶'},
                status=status.HTTP_404_NOT_FOUND
            )
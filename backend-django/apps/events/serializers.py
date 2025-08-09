"""
活動序列化器
"""

from rest_framework import serializers
from .models import Event, EDM, ActivityParticipant, ActivityLog
from apps.users.serializers import UserSerializer


class ActivityParticipantSerializer(serializers.ModelSerializer):
    """活動參與者序列化器"""
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ActivityParticipant
        fields = [
            'id', 'user', 'user_id', 'joined_at', 'split_option', 'is_active',
            'partial_split_expenses', 'can_adjust_splits', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'joined_at', 'created_at', 'updated_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    """活動記錄序列化器"""
    operator = UserSerializer(read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'action_type', 'description', 'operator', 'timestamp', 'metadata'
        ]
        read_only_fields = ['id', 'timestamp']


class EventSerializer(serializers.ModelSerializer):
    """活動序列化器"""
    managers = UserSerializer(many=True, read_only=True)
    manager_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    participants = ActivityParticipantSerializer(many=True, read_only=True)
    logs = ActivityLogSerializer(many=True, read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    # 計算字段
    participant_count = serializers.SerializerMethodField()
    total_expenses = serializers.SerializerMethodField()
    is_user_manager = serializers.SerializerMethodField()
    is_user_participant = serializers.SerializerMethodField()
    can_user_view_finances = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'description', 'start_date', 'end_date', 'status', 'enabled',
            'group', 'group_name', 'created_by', 'created_by_name', 'managers', 'manager_ids',
            'participant_ids', 'is_locked', 'settlement_date', 'allow_split', 'budget', 'participants', 'logs',
            'participant_count', 'total_expenses', 'is_user_manager', 'is_user_participant',
            'can_user_view_finances', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'settlement_date', 'created_at', 'updated_at']
    
    def __init__(self, *args, **kwargs):
        # 從上下文中獲取用戶
        self.current_user = kwargs.get('context', {}).get('request', {}).user
        super().__init__(*args, **kwargs)
    
    def get_participant_count(self, obj):
        """獲取活躍參與者數量"""
        return obj.participants.filter(is_active=True).count()
    
    def get_total_expenses(self, obj):
        """獲取活動總支出"""
        return obj.expenses.filter(type='EXPENSE').aggregate(
            total=serializers.models.Sum('amount')
        )['total'] or 0
    
    def get_is_user_manager(self, obj):
        """檢查當前用戶是否為活動管理者"""
        if not self.current_user or not self.current_user.is_authenticated:
            return False
        return obj.can_user_manage(self.current_user)
    
    def get_is_user_participant(self, obj):
        """檢查當前用戶是否為活動參與者"""
        if not self.current_user or not self.current_user.is_authenticated:
            return False
        return obj.participants.filter(user=self.current_user, is_active=True).exists()
    
    def get_can_user_view_finances(self, obj):
        """檢查當前用戶是否可以查看活動財務狀況"""
        if not self.current_user or not self.current_user.is_authenticated:
            return False
        return obj.can_user_view_finances(self.current_user)
    
    def create(self, validated_data):
        """創建活動時處理管理者和參與者"""
        manager_ids = validated_data.pop('manager_ids', [])
        participant_ids = validated_data.pop('participant_ids', [])
        instance = super().create(validated_data)
        
        # 設置管理者
        if manager_ids:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            managers = User.objects.filter(id__in=manager_ids)
            instance.managers.set(managers)
        
        # 添加參與者
        if participant_ids:
            from django.contrib.auth import get_user_model
            from .models import ActivityParticipant
            User = get_user_model()
            users = User.objects.filter(id__in=participant_ids)
            for user in users:
                ActivityParticipant.objects.create(
                    activity=instance,
                    user=user,
                    split_option='FULL_SPLIT'  # 預設分攤選項
                )
        
        return instance
    
    def update(self, instance, validated_data):
        """更新活動時處理管理者"""
        manager_ids = validated_data.pop('manager_ids', None)
        instance = super().update(instance, validated_data)
        
        if manager_ids is not None:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            managers = User.objects.filter(id__in=manager_ids)
            instance.managers.set(managers)
        
        return instance


class EDMSerializer(serializers.ModelSerializer):
    """EDM 序列化器"""
    
    class Meta:
        model = EDM
        fields = ['id', 'event', 'title', 'content', 'images', 'contact_info', 'registration_link', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
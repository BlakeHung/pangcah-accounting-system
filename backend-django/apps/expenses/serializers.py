"""
支出序列化器
"""

from rest_framework import serializers
from .models import Expense, ExpenseSplit
from apps.users.serializers import UserSerializer
from apps.categories.serializers import CategorySerializer


class ExpenseSplitSerializer(serializers.ModelSerializer):
    """費用分攤序列化器"""
    participant = UserSerializer(read_only=True)
    participant_id = serializers.IntegerField(write_only=True)
    adjusted_by = UserSerializer(read_only=True)
    can_user_adjust = serializers.SerializerMethodField()
    
    class Meta:
        model = ExpenseSplit
        fields = [
            'id', 'participant', 'participant_id', 'split_type', 'split_value',
            'calculated_amount', 'is_adjusted', 'adjusted_by', 'adjusted_at',
            'can_user_adjust', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'adjusted_by', 'adjusted_at', 'created_at', 'updated_at']
    
    def get_can_user_adjust(self, obj):
        """檢查當前用戶是否可以調整此分攤"""
        request = self.context.get('request')
        if not request or not request.user:
            return False
        return obj.can_user_adjust(request.user)


class ExpenseSerializer(serializers.ModelSerializer):
    """支出序列化器"""
    user = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    splits = ExpenseSplitSerializer(many=True, read_only=True)
    
    # 分帐相关字段 (write-only，用于创建时)
    split_type = serializers.CharField(write_only=True, required=False)
    split_participants = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    
    # 計算字段
    split_participants_list = serializers.SerializerMethodField()
    can_user_edit = serializers.SerializerMethodField()
    split_total = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = [
            'id', 'amount', 'type', 'date', 'description', 'images',
            'category', 'category_name', 'user', 'event', 'event_name',
            'group', 'group_name',
            'splits', 'split_participants_list', 'can_user_edit', 'split_total',
            'split_type', 'split_participants',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_split_participants_list(self, obj):
        """獲取參與分攤的用戶列表"""
        participants = obj.get_participants_for_split()
        return UserSerializer(participants, many=True).data
    
    def get_can_user_edit(self, obj):
        """檢查當前用戶是否可以編輯此支出"""
        request = self.context.get('request')
        if not request or not request.user:
            return False
        return obj.can_user_edit(request.user)
    
    def get_split_total(self, obj):
        """獲取分攤總金額"""
        return obj.splits.aggregate(
            total=serializers.models.Sum('calculated_amount')
        )['total'] or 0
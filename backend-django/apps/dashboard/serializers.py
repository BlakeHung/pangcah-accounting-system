"""
儀表板序列化器
"""

from rest_framework import serializers
from .models import DashboardConfig, AlertNotification, FinancialGoal


class DashboardConfigSerializer(serializers.ModelSerializer):
    """儀表板配置序列化器"""
    
    chart_visibility = serializers.ReadOnlyField()
    alert_settings = serializers.ReadOnlyField()
    
    class Meta:
        model = DashboardConfig
        fields = [
            'id', 'theme', 'primary_color', 'secondary_color',
            'show_income_expense_trend', 'show_category_pie', 
            'show_group_comparison', 'show_monthly_comparison',
            'enable_expense_alerts', 'expense_limit_daily', 'expense_limit_monthly',
            'enable_income_goals', 'income_goal_monthly',
            'enable_unusual_spending_alerts', 'custom_settings',
            'chart_visibility', 'alert_settings',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # 自動設定當前用戶
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AlertNotificationSerializer(serializers.ModelSerializer):
    """警報通知序列化器"""
    
    class Meta:
        model = AlertNotification
        fields = [
            'id', 'alert_type', 'severity', 'title', 'message', 'data',
            'is_read', 'created_at', 'read_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        # 自動設定當前用戶
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AlertNotificationUpdateSerializer(serializers.ModelSerializer):
    """警報通知更新序列化器"""
    
    class Meta:
        model = AlertNotification
        fields = ['is_read']


class FinancialGoalSerializer(serializers.ModelSerializer):
    """財務目標序列化器"""
    
    progress_percentage = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    
    class Meta:
        model = FinancialGoal
        fields = [
            'id', 'goal_type', 'title', 'description',
            'target_amount', 'current_amount', 'period',
            'start_date', 'end_date', 'category', 'is_active',
            'notify_on_progress', 'notify_milestones',
            'progress_percentage', 'is_completed', 'remaining_amount',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # 自動設定當前用戶
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class FinancialGoalUpdateSerializer(serializers.ModelSerializer):
    """財務目標更新序列化器"""
    
    class Meta:
        model = FinancialGoal
        fields = [
            'title', 'description', 'target_amount', 'current_amount',
            'end_date', 'is_active', 'notify_on_progress', 'notify_milestones'
        ]


class DashboardStatsSerializer(serializers.Serializer):
    """儀表板統計資料序列化器"""
    
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    monthly_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    monthly_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    today_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    today_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    active_goals_count = serializers.IntegerField()
    unread_notifications_count = serializers.IntegerField()
    last_updated = serializers.DateTimeField()


class ChartDataSerializer(serializers.Serializer):
    """圖表資料序列化器"""
    
    # 收支趨勢資料
    income_expense_trend = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=True
    )
    
    # 分類分布資料
    category_distribution = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=True
    )
    
    # 群組對比資料
    group_comparison = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=True
    )
    
    # 月度對比資料
    monthly_comparison = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=True
    )
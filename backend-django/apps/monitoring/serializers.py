"""
監控管理序列化器
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import SystemMetric, UserActivity, APIMetric, Alert, PerformanceBaseline

User = get_user_model()


class SystemMetricSerializer(serializers.ModelSerializer):
    """系統指標序列化器"""
    metric_type_display = serializers.CharField(source='get_metric_type_display', read_only=True)

    class Meta:
        model = SystemMetric
        fields = [
            'id', 'metric_type', 'metric_type_display', 'value', 'unit',
            'metadata', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class UserActivitySerializer(serializers.ModelSerializer):
    """用戶活動序列化器"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = UserActivity
        fields = [
            'id', 'user', 'user_name', 'action', 'action_display',
            'object_type', 'object_id', 'ip_address', 'user_agent',
            'details', 'success', 'error_message', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class APIMetricSerializer(serializers.ModelSerializer):
    """API 指標序列化器"""
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = APIMetric
        fields = [
            'id', 'method', 'path', 'user', 'user_name', 'status_code',
            'response_time', 'request_size', 'response_size', 'ip_address',
            'user_agent', 'metadata', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class AlertSerializer(serializers.ModelSerializer):
    """系統告警序列化器"""
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    acknowledged_by_name = serializers.CharField(source='acknowledged_by.name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.name', read_only=True)
    age = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = [
            'id', 'title', 'description', 'severity', 'severity_display',
            'status', 'status_display', 'source_type', 'source_id',
            'condition', 'current_value', 'acknowledged_by', 'acknowledged_by_name',
            'acknowledged_at', 'resolved_by', 'resolved_by_name', 'resolved_at',
            'resolution_notes', 'age', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'acknowledged_by', 'acknowledged_at', 'resolved_by', 
            'resolved_at', 'created_at', 'updated_at'
        ]

    def get_age(self, obj):
        """計算告警存在時間"""
        now = timezone.now()
        if obj.resolved_at:
            duration = obj.resolved_at - obj.created_at
        else:
            duration = now - obj.created_at
        
        days = duration.days
        seconds = duration.seconds
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        
        if days > 0:
            return f"{days} 天 {hours} 小時"
        elif hours > 0:
            return f"{hours} 小時 {minutes} 分鐘"
        else:
            return f"{minutes} 分鐘"


class PerformanceBaselineSerializer(serializers.ModelSerializer):
    """效能基準線序列化器"""
    
    class Meta:
        model = PerformanceBaseline
        fields = [
            'id', 'metric_name', 'baseline_value', 'min_value', 'max_value',
            'avg_value', 'std_deviation', 'period_start', 'period_end',
            'sample_count', 'warning_threshold', 'error_threshold',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """驗證基準線資料"""
        if data['period_start'] >= data['period_end']:
            raise serializers.ValidationError(
                "統計開始時間必須早於結束時間"
            )
        
        if data['min_value'] > data['max_value']:
            raise serializers.ValidationError(
                "最小值不能大於最大值"
            )
        
        return data


# 監控統計相關序列化器
class SystemHealthSerializer(serializers.Serializer):
    """系統健康狀態序列化器"""
    cpu_usage = serializers.FloatField()
    memory_usage = serializers.FloatField()
    disk_usage = serializers.FloatField()
    database_connections = serializers.IntegerField()
    active_users = serializers.IntegerField()
    status = serializers.CharField()
    last_updated = serializers.DateTimeField()


class ActivitySummarySerializer(serializers.Serializer):
    """活動摘要序列化器"""
    date = serializers.DateField()
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    total_actions = serializers.IntegerField()
    login_count = serializers.IntegerField()
    expense_actions = serializers.IntegerField()
    event_actions = serializers.IntegerField()


class APIUsageSerializer(serializers.Serializer):
    """API 使用統計序列化器"""
    path = serializers.CharField()
    method = serializers.CharField()
    total_calls = serializers.IntegerField()
    avg_response_time = serializers.FloatField()
    error_rate = serializers.FloatField()
    last_called = serializers.DateTimeField()


class AlertSummarySerializer(serializers.Serializer):
    """告警摘要序列化器"""
    total_alerts = serializers.IntegerField()
    active_alerts = serializers.IntegerField()
    critical_alerts = serializers.IntegerField()
    warning_alerts = serializers.IntegerField()
    resolved_today = serializers.IntegerField()


class PerformanceTrendSerializer(serializers.Serializer):
    """效能趨勢序列化器"""
    metric_name = serializers.CharField()
    timestamp = serializers.DateTimeField()
    value = serializers.FloatField()
    baseline_value = serializers.FloatField()
    deviation_percentage = serializers.FloatField()


class UserBehaviorSerializer(serializers.Serializer):
    """用戶行為分析序列化器"""
    user_id = serializers.UUIDField()
    user_name = serializers.CharField()
    total_sessions = serializers.IntegerField()
    avg_session_duration = serializers.FloatField()
    most_used_features = serializers.ListField(
        child=serializers.CharField()
    )
    last_activity = serializers.DateTimeField()
    activity_score = serializers.FloatField()


class SimpleAlertSerializer(serializers.ModelSerializer):
    """簡化的告警序列化器（用於儀表板）"""
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    age_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = ['id', 'title', 'severity', 'severity_display', 'age_minutes', 'created_at']

    def get_age_minutes(self, obj):
        """計算告警存在分鐘數"""
        now = timezone.now()
        return int((now - obj.created_at).total_seconds() / 60)
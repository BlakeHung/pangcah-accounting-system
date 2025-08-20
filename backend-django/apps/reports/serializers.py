"""
報表管理序列化器
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ReportTemplate, ReportConfig, ReportGeneration, ReportShare

User = get_user_model()


class ReportTemplateSerializer(serializers.ModelSerializer):
    """報表模板序列化器"""
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'category', 'category_display', 'description', 'icon',
            'default_config', 'required_fields', 'is_system', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class ReportConfigSerializer(serializers.ModelSerializer):
    """報表配置序列化器"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    date_range_preset_display = serializers.CharField(source='get_date_range_preset_display', read_only=True)

    class Meta:
        model = ReportConfig
        fields = [
            'id', 'user', 'user_name', 'name', 'description', 'report_type', 'report_type_display',
            'date_range_preset', 'date_range_preset_display', 'start_date', 'end_date',
            'filters', 'group_by', 'metrics', 'chart_config', 'export_formats', 'schedule',
            'is_active', 'template', 'template_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate(self, data):
        """驗證報表配置"""
        # 如果是自定義日期範圍，必須提供開始和結束日期
        if data.get('date_range_preset') == 'custom':
            if not data.get('start_date') or not data.get('end_date'):
                raise serializers.ValidationError(
                    "自定義日期範圍必須提供開始日期和結束日期"
                )
            
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError(
                    "開始日期不能晚於結束日期"
                )

        # 驗證圖表配置
        if data.get('report_type') == 'chart':
            chart_config = data.get('chart_config', {})
            if not chart_config.get('chart_type'):
                raise serializers.ValidationError(
                    "圖表類型報表必須指定圖表類型"
                )

        # 驗證匯出格式
        export_formats = data.get('export_formats', [])
        valid_formats = [choice[0] for choice in ReportConfig.EXPORT_FORMATS]
        for format_type in export_formats:
            if format_type not in valid_formats:
                raise serializers.ValidationError(
                    f"不支援的匯出格式: {format_type}"
                )

        return data


class ReportGenerationSerializer(serializers.ModelSerializer):
    """報表生成記錄序列化器"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    config_name = serializers.CharField(source='config.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    export_format_display = serializers.CharField(source='get_export_format_display', read_only=True)
    duration = serializers.SerializerMethodField()
    has_share_setting = serializers.SerializerMethodField()

    class Meta:
        model = ReportGeneration
        fields = [
            'id', 'user', 'user_name', 'config', 'config_name', 'status', 'status_display',
            'parameters', 'export_format', 'export_format_display', 'result_data',
            'file_path', 'execution_time', 'row_count', 'error_message', 'duration',
            'has_share_setting', 'created_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'user', 'created_at', 'completed_at', 'execution_time', 
            'row_count', 'result_data', 'file_path'
        ]

    def get_duration(self, obj):
        """計算處理時間"""
        if obj.completed_at and obj.created_at:
            duration = obj.completed_at - obj.created_at
            return duration.total_seconds()
        return None

    def get_has_share_setting(self, obj):
        """檢查是否有分享設定"""
        return hasattr(obj, 'share_setting') and obj.share_setting is not None


class ReportShareSerializer(serializers.ModelSerializer):
    """報表分享序列化器"""
    generation_name = serializers.CharField(source='generation.config.name', read_only=True)
    owner_name = serializers.CharField(source='generation.user.name', read_only=True)
    allowed_users_names = serializers.SerializerMethodField()
    share_url = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = ReportShare
        fields = [
            'id', 'generation', 'generation_name', 'owner_name', 'is_public', 
            'share_token', 'expires_at', 'allowed_users', 'allowed_users_names',
            'access_count', 'last_accessed_at', 'share_url', 'is_expired',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'share_token', 'access_count', 'last_accessed_at',
            'created_at', 'updated_at'
        ]

    def get_allowed_users_names(self, obj):
        """取得允許存取用戶的名稱列表"""
        return [user.name for user in obj.allowed_users.all()]

    def get_share_url(self, obj):
        """生成分享網址"""
        # 實際環境中會根據網域設定完整的 URL
        return f"/reports/shared?token={obj.share_token}"

    def get_is_expired(self, obj):
        """檢查是否過期"""
        from django.utils import timezone
        if obj.expires_at:
            return obj.expires_at < timezone.now()
        return False


class SimpleReportTemplateSerializer(serializers.ModelSerializer):
    """簡化的報表模板序列化器（用於下拉選單）"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = ReportTemplate
        fields = ['id', 'name', 'category', 'category_display', 'icon', 'description']


class SimpleUserSerializer(serializers.ModelSerializer):
    """簡化的用戶序列化器（用於分享設定）"""
    
    class Meta:
        model = User
        fields = ['id', 'name', 'username', 'email']
        read_only_fields = ['id', 'name', 'username', 'email']
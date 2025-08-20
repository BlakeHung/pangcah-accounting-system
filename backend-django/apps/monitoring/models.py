"""
監控管理模型
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import json
import uuid

User = get_user_model()


class SystemMetric(models.Model):
    """系統指標監控"""
    METRIC_TYPES = [
        ('cpu_usage', 'CPU 使用率'),
        ('memory_usage', '記憶體使用率'),
        ('disk_usage', '磁碟使用率'),
        ('database_connections', '資料庫連線數'),
        ('active_users', '活躍用戶數'),
        ('request_count', '請求次數'),
        ('response_time', '回應時間'),
        ('error_rate', '錯誤率'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    metric_type = models.CharField(
        max_length=30,
        choices=METRIC_TYPES,
        verbose_name='指標類型'
    )
    
    value = models.FloatField(verbose_name='指標值')
    unit = models.CharField(max_length=10, default='%', verbose_name='單位')
    
    # 額外的元數據
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='元數據',
        help_text='額外的監控資訊 JSON'
    )
    
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='記錄時間')
    
    class Meta:
        verbose_name = '系統指標'
        verbose_name_plural = '系統指標'
        db_table = 'system_metrics'
        indexes = [
            models.Index(fields=['metric_type', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.get_metric_type_display()}: {self.value}{self.unit} ({self.timestamp})"


class UserActivity(models.Model):
    """用戶活動監控"""
    ACTION_TYPES = [
        ('login', '登入'),
        ('logout', '登出'),
        ('create_expense', '新增支出'),
        ('edit_expense', '編輯支出'),
        ('delete_expense', '刪除支出'),
        ('create_event', '新增活動'),
        ('join_event', '加入活動'),
        ('create_group', '新增群組'),
        ('join_group', '加入群組'),
        ('view_report', '檢視報表'),
        ('export_data', '匯出資料'),
        ('change_settings', '變更設定'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='activities',
        verbose_name='用戶'
    )
    
    action = models.CharField(
        max_length=20,
        choices=ACTION_TYPES,
        verbose_name='操作類型'
    )
    
    # 操作的相關物件資訊
    object_type = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='物件類型',
        help_text='如: expense, event, group'
    )
    
    object_id = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='物件 ID'
    )
    
    # IP 位址和用戶代理
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='IP 位址'
    )
    
    user_agent = models.TextField(
        blank=True,
        verbose_name='用戶代理'
    )
    
    # 額外的操作詳情
    details = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='操作詳情',
        help_text='操作相關的詳細資訊 JSON'
    )
    
    # 操作結果
    success = models.BooleanField(default=True, verbose_name='操作成功')
    error_message = models.TextField(blank=True, verbose_name='錯誤訊息')
    
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='操作時間')
    
    class Meta:
        verbose_name = '用戶活動'
        verbose_name_plural = '用戶活動'
        db_table = 'user_activities'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.name} - {self.get_action_display()} ({self.timestamp})"


class APIMetric(models.Model):
    """API 呼叫監控"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # 請求資訊
    method = models.CharField(max_length=10, verbose_name='HTTP 方法')
    path = models.CharField(max_length=255, verbose_name='請求路徑')
    
    # 用戶資訊 (可能為匿名)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='api_calls',
        verbose_name='用戶'
    )
    
    # 回應資訊
    status_code = models.IntegerField(verbose_name='狀態碼')
    response_time = models.FloatField(verbose_name='回應時間(毫秒)')
    
    # 請求/回應大小
    request_size = models.IntegerField(default=0, verbose_name='請求大小(bytes)')
    response_size = models.IntegerField(default=0, verbose_name='回應大小(bytes)')
    
    # 客戶端資訊
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='IP 位址'
    )
    
    user_agent = models.TextField(
        blank=True,
        verbose_name='用戶代理'
    )
    
    # 額外資訊
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='額外資訊'
    )
    
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='請求時間')
    
    class Meta:
        verbose_name = 'API 指標'
        verbose_name_plural = 'API 指標'
        db_table = 'api_metrics'
        indexes = [
            models.Index(fields=['path', 'timestamp']),
            models.Index(fields=['status_code', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.method} {self.path} - {self.status_code} ({self.timestamp})"


class Alert(models.Model):
    """系統告警"""
    SEVERITY_LEVELS = [
        ('info', '資訊'),
        ('warning', '警告'),
        ('error', '錯誤'),
        ('critical', '嚴重'),
    ]
    
    STATUS_CHOICES = [
        ('active', '活躍'),
        ('acknowledged', '已確認'),
        ('resolved', '已解決'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    title = models.CharField(max_length=200, verbose_name='告警標題')
    description = models.TextField(verbose_name='告警描述')
    
    severity = models.CharField(
        max_length=10,
        choices=SEVERITY_LEVELS,
        default='info',
        verbose_name='嚴重程度'
    )
    
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='狀態'
    )
    
    # 告警來源
    source_type = models.CharField(
        max_length=20,
        verbose_name='來源類型',
        help_text='如: system, api, user_activity'
    )
    
    source_id = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='來源 ID'
    )
    
    # 告警條件和觸發值
    condition = models.JSONField(
        default=dict,
        verbose_name='告警條件',
        help_text='觸發告警的條件設定'
    )
    
    current_value = models.JSONField(
        default=dict,
        verbose_name='當前值',
        help_text='觸發告警時的實際值'
    )
    
    # 處理資訊
    acknowledged_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acknowledged_alerts',
        verbose_name='確認者'
    )
    
    acknowledged_at = models.DateTimeField(null=True, blank=True, verbose_name='確認時間')
    
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_alerts',
        verbose_name='解決者'
    )
    
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='解決時間')
    resolution_notes = models.TextField(blank=True, verbose_name='解決備註')
    
    # 時間戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '系統告警'
        verbose_name_plural = '系統告警'
        db_table = 'alerts'
        indexes = [
            models.Index(fields=['severity', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_severity_display()}] {self.title} - {self.get_status_display()}"

    def acknowledge(self, user):
        """確認告警"""
        self.acknowledged_by = user
        self.acknowledged_at = timezone.now()
        if self.status == 'active':
            self.status = 'acknowledged'
        self.save()

    def resolve(self, user, notes=''):
        """解決告警"""
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.resolution_notes = notes
        self.status = 'resolved'
        self.save()


class PerformanceBaseline(models.Model):
    """效能基準線"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    metric_name = models.CharField(max_length=50, verbose_name='指標名稱')
    
    # 基準值統計
    baseline_value = models.FloatField(verbose_name='基準值')
    min_value = models.FloatField(verbose_name='最小值')
    max_value = models.FloatField(verbose_name='最大值')
    avg_value = models.FloatField(verbose_name='平均值')
    std_deviation = models.FloatField(verbose_name='標準差')
    
    # 統計期間
    period_start = models.DateTimeField(verbose_name='統計開始時間')
    period_end = models.DateTimeField(verbose_name='統計結束時間')
    sample_count = models.IntegerField(verbose_name='樣本數量')
    
    # 告警閾值
    warning_threshold = models.FloatField(
        null=True,
        blank=True,
        verbose_name='警告閾值'
    )
    
    error_threshold = models.FloatField(
        null=True,
        blank=True,
        verbose_name='錯誤閾值'
    )
    
    is_active = models.BooleanField(default=True, verbose_name='是否啟用')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '效能基準線'
        verbose_name_plural = '效能基準線'
        db_table = 'performance_baselines'
        unique_together = ['metric_name', 'period_start', 'period_end']
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.metric_name} 基準線 ({self.period_start.date()} - {self.period_end.date()})"
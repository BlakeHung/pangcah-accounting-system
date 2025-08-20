"""
報表管理模型
"""

from django.db import models
from django.contrib.auth import get_user_model
import json
import uuid

User = get_user_model()


class ReportTemplate(models.Model):
    """
    報表模板
    """
    CATEGORY_CHOICES = [
        ('financial', '財務分析'),
        ('user_activity', '用戶活動'),
        ('budget', '預算管理'),
        ('custom', '自定義'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name='模板名稱')
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        verbose_name='模板分類'
    )
    description = models.TextField(verbose_name='模板描述')
    icon = models.CharField(max_length=10, default='📊', verbose_name='圖標')
    
    # 預設配置 (JSON 格式)
    default_config = models.JSONField(
        default=dict,
        verbose_name='預設配置',
        help_text='報表的預設配置 JSON'
    )
    
    # 必要欄位
    required_fields = models.JSONField(
        default=list,
        verbose_name='必要欄位',
        help_text='產生報表所需的欄位清單'
    )
    
    is_system = models.BooleanField(
        default=False,
        verbose_name='系統模板',
        help_text='是否為系統內建模板'
    )
    
    is_active = models.BooleanField(default=True, verbose_name='是否啟用')
    
    # 創建者 (可為空，系統模板沒有創建者)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='created_templates',
        verbose_name='創建者'
    )
    
    # 時間戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '報表模板'
        verbose_name_plural = '報表模板'
        db_table = 'report_templates'
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class ReportConfig(models.Model):
    """
    報表配置
    """
    REPORT_TYPES = [
        ('table', '表格'),
        ('chart', '圖表'),
        ('summary', '摘要'),
    ]
    
    EXPORT_FORMATS = [
        ('PDF', 'PDF'),
        ('Excel', 'Excel'),
        ('CSV', 'CSV'),
        ('PNG', 'PNG'),
        ('JSON', 'JSON'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='report_configs',
        verbose_name='用戶'
    )
    
    name = models.CharField(max_length=100, verbose_name='報表名稱')
    description = models.TextField(blank=True, verbose_name='報表描述')
    
    report_type = models.CharField(
        max_length=10,
        choices=REPORT_TYPES,
        default='table',
        verbose_name='報表類型'
    )
    
    # 日期範圍設定
    date_range_preset = models.CharField(
        max_length=10,
        choices=[
            ('today', '今天'),
            ('week', '本週'),
            ('month', '本月'),
            ('quarter', '本季'),
            ('year', '本年'),
            ('custom', '自定義'),
        ],
        default='month',
        verbose_name='日期範圍預設'
    )
    
    start_date = models.DateField(null=True, blank=True, verbose_name='開始日期')
    end_date = models.DateField(null=True, blank=True, verbose_name='結束日期')
    
    # 篩選條件 (JSON 格式)
    filters = models.JSONField(
        default=list,
        verbose_name='篩選條件',
        help_text='報表篩選條件的 JSON 陣列'
    )
    
    # 分組欄位
    group_by = models.JSONField(
        default=list,
        verbose_name='分組欄位',
        help_text='報表分組欄位的清單'
    )
    
    # 指標設定 (JSON 格式)
    metrics = models.JSONField(
        default=list,
        verbose_name='指標設定',
        help_text='報表指標配置的 JSON 陣列'
    )
    
    # 圖表配置 (JSON 格式，僅圖表類型使用)
    chart_config = models.JSONField(
        default=dict,
        verbose_name='圖表配置',
        help_text='圖表相關配置的 JSON'
    )
    
    # 匯出格式
    export_formats = models.JSONField(
        default=list,
        verbose_name='匯出格式',
        help_text='支援的匯出格式清單'
    )
    
    # 排程設定 (JSON 格式)
    schedule = models.JSONField(
        default=dict,
        verbose_name='排程設定',
        help_text='報表自動生成排程配置'
    )
    
    is_active = models.BooleanField(default=True, verbose_name='是否啟用')
    
    # 基於的模板 (可選)
    template = models.ForeignKey(
        ReportTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='report_configs',
        verbose_name='基於模板'
    )
    
    # 時間戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '報表配置'
        verbose_name_plural = '報表配置'
        db_table = 'report_configs'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.name} - {self.name}"


class ReportGeneration(models.Model):
    """
    報表生成記錄
    """
    STATUS_CHOICES = [
        ('pending', '等待中'),
        ('processing', '生成中'),
        ('completed', '已完成'),
        ('failed', '失敗'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='report_generations',
        verbose_name='用戶'
    )
    
    config = models.ForeignKey(
        ReportConfig,
        on_delete=models.CASCADE,
        related_name='generations',
        verbose_name='報表配置'
    )
    
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='生成狀態'
    )
    
    # 生成參數 (JSON 格式)
    parameters = models.JSONField(
        default=dict,
        verbose_name='生成參數',
        help_text='報表生成時的參數設定'
    )
    
    # 匯出格式
    export_format = models.CharField(
        max_length=10,
        choices=ReportConfig.EXPORT_FORMATS,
        default='JSON',
        verbose_name='匯出格式'
    )
    
    # 生成結果
    result_data = models.JSONField(
        default=dict,
        verbose_name='結果資料',
        help_text='報表生成的結果資料'
    )
    
    # 檔案儲存路徑 (匯出檔案)
    file_path = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='檔案路徑'
    )
    
    # 執行資訊
    execution_time = models.FloatField(
        null=True,
        blank=True,
        verbose_name='執行時間(秒)'
    )
    
    row_count = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='資料筆數'
    )
    
    error_message = models.TextField(
        blank=True,
        verbose_name='錯誤訊息'
    )
    
    # 時間戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成時間')
    
    class Meta:
        verbose_name = '報表生成記錄'
        verbose_name_plural = '報表生成記錄'
        db_table = 'report_generations'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.config.name} - {self.get_status_display()}"


class ReportShare(models.Model):
    """
    報表分享設定
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    generation = models.OneToOneField(
        ReportGeneration,
        on_delete=models.CASCADE,
        related_name='share_setting',
        verbose_name='報表生成記錄'
    )
    
    # 分享設定
    is_public = models.BooleanField(
        default=False,
        verbose_name='公開分享'
    )
    
    share_token = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='分享令牌'
    )
    
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='過期時間'
    )
    
    # 存取控制
    allowed_users = models.ManyToManyField(
        User,
        blank=True,
        related_name='accessible_reports',
        verbose_name='允許存取的用戶'
    )
    
    # 統計資訊
    access_count = models.IntegerField(
        default=0,
        verbose_name='存取次數'
    )
    
    last_accessed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='最後存取時間'
    )
    
    # 時間戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '報表分享設定'
        verbose_name_plural = '報表分享設定'
        db_table = 'report_shares'
    
    def __str__(self):
        return f"{self.generation.config.name} - 分享設定"
    
    def generate_share_token(self):
        """生成分享令牌"""
        import secrets
        self.share_token = secrets.token_urlsafe(32)
        self.save(update_fields=['share_token'])
        return self.share_token
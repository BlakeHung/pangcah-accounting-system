"""
儀表板配置管理模型
"""

from django.db import models
from django.contrib.auth import get_user_model
import json

User = get_user_model()


class DashboardConfig(models.Model):
    """
    用戶儀表板配置
    """
    THEME_CHOICES = [
        ('light', '淺色主題'),
        ('dark', '深色主題'),
        ('auto', '自動主題'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='dashboard_config',
        verbose_name='用戶'
    )
    
    # 主題設定
    theme = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='light',
        verbose_name='主題'
    )
    
    primary_color = models.CharField(
        max_length=7,
        default='#4F46E5',
        verbose_name='主要顏色',
        help_text='十六進制顏色碼'
    )
    
    secondary_color = models.CharField(
        max_length=7,
        default='#10B981',
        verbose_name='次要顏色',
        help_text='十六進制顏色碼'
    )
    
    # 圖表可見性設定
    show_income_expense_trend = models.BooleanField(
        default=True,
        verbose_name='顯示收支趨勢圖'
    )
    
    show_category_pie = models.BooleanField(
        default=True,
        verbose_name='顯示分類圓餅圖'
    )
    
    show_group_comparison = models.BooleanField(
        default=True,
        verbose_name='顯示群組對比圖'
    )
    
    show_monthly_comparison = models.BooleanField(
        default=True,
        verbose_name='顯示月度對比圖'
    )
    
    # 警報設定
    enable_expense_alerts = models.BooleanField(
        default=True,
        verbose_name='啟用支出警報'
    )
    
    expense_limit_daily = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='每日支出限額'
    )
    
    expense_limit_monthly = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='每月支出限額'
    )
    
    enable_income_goals = models.BooleanField(
        default=False,
        verbose_name='啟用收入目標'
    )
    
    income_goal_monthly = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='每月收入目標'
    )
    
    enable_unusual_spending_alerts = models.BooleanField(
        default=True,
        verbose_name='啟用異常支出警報'
    )
    
    # 其他設定 (JSON 格式儲存)
    custom_settings = models.JSONField(
        default=dict,
        verbose_name='自定義設定',
        help_text='其他客製化設定的 JSON 資料'
    )
    
    # 時間戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '儀表板配置'
        verbose_name_plural = '儀表板配置'
        db_table = 'dashboard_configs'
    
    def __str__(self):
        return f"{self.user.name} 的儀表板配置"
    
    @property
    def chart_visibility(self):
        """返回圖表可見性設定"""
        return {
            'incomeExpenseTrend': self.show_income_expense_trend,
            'categoryPie': self.show_category_pie,
            'groupComparison': self.show_group_comparison,
            'monthlyComparison': self.show_monthly_comparison,
        }
    
    @property
    def alert_settings(self):
        """返回警報設定"""
        return {
            'enableExpenseAlerts': self.enable_expense_alerts,
            'expenseLimits': {
                'daily': float(self.expense_limit_daily) if self.expense_limit_daily else None,
                'monthly': float(self.expense_limit_monthly) if self.expense_limit_monthly else None,
            },
            'enableIncomeGoals': self.enable_income_goals,
            'incomeGoals': {
                'monthly': float(self.income_goal_monthly) if self.income_goal_monthly else None,
            },
            'enableUnusualSpendingAlerts': self.enable_unusual_spending_alerts,
        }


class AlertNotification(models.Model):
    """
    警報通知記錄
    """
    ALERT_TYPES = [
        ('expense_limit', '支出限額警報'),
        ('income_goal', '收入目標警報'),
        ('unusual_spending', '異常支出警報'),
        ('budget_exceeded', '預算超支警報'),
        ('system', '系統通知'),
    ]
    
    SEVERITY_LEVELS = [
        ('info', '資訊'),
        ('warning', '警告'),
        ('error', '錯誤'),
        ('success', '成功'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='alert_notifications',
        verbose_name='用戶'
    )
    
    alert_type = models.CharField(
        max_length=20,
        choices=ALERT_TYPES,
        verbose_name='警報類型'
    )
    
    severity = models.CharField(
        max_length=10,
        choices=SEVERITY_LEVELS,
        default='info',
        verbose_name='嚴重程度'
    )
    
    title = models.CharField(
        max_length=100,
        verbose_name='標題'
    )
    
    message = models.TextField(
        verbose_name='訊息內容'
    )
    
    # 相關資料 (JSON 格式)
    data = models.JSONField(
        default=dict,
        verbose_name='相關資料',
        help_text='警報相關的額外資料'
    )
    
    is_read = models.BooleanField(
        default=False,
        verbose_name='已讀狀態'
    )
    
    # 時間戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='閱讀時間')
    
    class Meta:
        verbose_name = '警報通知'
        verbose_name_plural = '警報通知'
        db_table = 'alert_notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.name} - {self.title}"
    
    def mark_as_read(self):
        """標記為已讀"""
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read', 'read_at'])


class FinancialGoal(models.Model):
    """
    財務目標設定
    """
    GOAL_TYPES = [
        ('saving', '儲蓄目標'),
        ('income', '收入目標'),
        ('expense_limit', '支出限制'),
        ('category_limit', '分類支出限制'),
    ]
    
    PERIODS = [
        ('daily', '每日'),
        ('weekly', '每週'),
        ('monthly', '每月'),
        ('quarterly', '每季'),
        ('yearly', '每年'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='financial_goals',
        verbose_name='用戶'
    )
    
    goal_type = models.CharField(
        max_length=20,
        choices=GOAL_TYPES,
        verbose_name='目標類型'
    )
    
    title = models.CharField(
        max_length=100,
        verbose_name='目標標題'
    )
    
    description = models.TextField(
        blank=True,
        verbose_name='目標描述'
    )
    
    target_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='目標金額'
    )
    
    current_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='當前金額'
    )
    
    period = models.CharField(
        max_length=10,
        choices=PERIODS,
        default='monthly',
        verbose_name='週期'
    )
    
    # 目標期間
    start_date = models.DateField(verbose_name='開始日期')
    end_date = models.DateField(verbose_name='結束日期')
    
    # 分類限制 (僅 category_limit 類型使用)
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='相關分類'
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='是否啟用'
    )
    
    # 設定
    notify_on_progress = models.BooleanField(
        default=True,
        verbose_name='進度通知'
    )
    
    notify_milestones = models.JSONField(
        default=list,
        verbose_name='里程碑通知',
        help_text='百分比清單，例如 [25, 50, 75, 100]'
    )
    
    # 時間戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '財務目標'
        verbose_name_plural = '財務目標'
        db_table = 'financial_goals'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.name} - {self.title}"
    
    @property
    def progress_percentage(self):
        """計算進度百分比"""
        if self.target_amount <= 0:
            return 0
        return min(100, (self.current_amount / self.target_amount) * 100)
    
    @property
    def is_completed(self):
        """檢查是否已完成"""
        return self.current_amount >= self.target_amount
    
    @property
    def remaining_amount(self):
        """剩餘金額"""
        return max(0, self.target_amount - self.current_amount)
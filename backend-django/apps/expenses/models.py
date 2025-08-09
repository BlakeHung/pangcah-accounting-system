"""
支出記錄模型

基於 legacy-project/prisma/schema.prisma 的 Transaction 模型轉換為 Django
"""

from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.conf import settings


class ExpenseType(models.TextChoices):
    """支出類型選擇"""
    EXPENSE = 'EXPENSE', '支出'
    INCOME = 'INCOME', '收入'


# 移除審批狀態和付款狀態，活動結算時統一處理


class Expense(models.Model):
    """
    支出記錄模型
    
    對應 legacy-project 中的 Transaction 模型
    """
    
    # 金額資訊
    amount = models.DecimalField(
        "金額",
        max_digits=10,
        decimal_places=2,
        help_text="支出或收入金額"
    )
    
    type = models.CharField(
        "類型",
        max_length=10,
        choices=ExpenseType.choices,
        default=ExpenseType.EXPENSE,
        help_text="支出或收入"
    )
    
    # 基本資訊
    date = models.DateTimeField(
        "發生日期",
        help_text="支出發生的日期時間"
    )
    
    description = models.TextField(
        "描述",
        blank=True,
        help_text="支出的詳細描述"
    )
    
    images = ArrayField(
        models.URLField(),
        verbose_name="相關圖片",
        blank=True,
        default=list,
        help_text="相關圖片 URL 列表"
    )
    
    # 外鍵關聯
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.PROTECT,
        related_name='expenses',
        verbose_name="分類"
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='expenses',
        verbose_name="記錄者"
    )
    
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses',
        verbose_name="關聯活動"
    )
    
    group = models.ForeignKey(
        'groups.Group',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses',
        verbose_name="關聯群組"
    )
    
    # 移除狀態管理字段，活動結算時統一處理
    
    # 時間戳
    created_at = models.DateTimeField("創建時間", auto_now_add=True)
    updated_at = models.DateTimeField("更新時間", auto_now=True)
    
    class Meta:
        verbose_name = "支出記錄"
        verbose_name_plural = "支出記錄"
        db_table = "expenses"
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['date']),
        ]
        
    def __str__(self) -> str:
        return f"{self.get_type_display()} - {self.amount} ({self.description[:20]})"
    
    def can_user_edit(self, user) -> bool:
        """檢查用戶是否可以編輯此支出"""
        if not user or not user.is_authenticated:
            return False
        
        # 系統管理員可以編輯所有支出
        if user.role == 'ADMIN':
            return True
        
        # 支出記錄者可以編輯自己的記錄
        if self.user == user:
            return True
        
        # 如果有關聯活動，檢查活動管理權限
        if self.event:
            return self.event.can_user_manage(user)
        
        return False
    
    def get_participants_for_split(self):
        """獲取參與分攤的用戶列表"""
        if not self.event:
            return []
        
        participants = []
        for participant in self.event.participants.filter(is_active=True):
            # 檢查分攤選項
            if participant.split_option == 'NO_SPLIT':
                # 不分攤先前費用，只分攤加入後的支出
                if self.date >= participant.joined_at:
                    participants.append(participant.user)
            elif participant.split_option == 'PARTIAL_SPLIT':
                # 部分分攤，檢查是否包含在分攤列表中
                if self.id in participant.partial_split_expenses:
                    participants.append(participant.user)
            elif participant.split_option == 'FULL_SPLIT':
                # 分攤所有費用
                participants.append(participant.user)
        
        return participants


class SplitType(models.TextChoices):
    """費用分攤類型"""
    AVERAGE = 'AVERAGE', '平均分攤'
    RATIO = 'RATIO', '比例分攤'
    FIXED = 'FIXED', '固定金額'
    SELECTIVE = 'SELECTIVE', '選擇性分攤'


class ExpenseSplit(models.Model):
    """
    費用分攤模型
    
    記錄每筆支出的分攤詳情
    """
    
    expense = models.ForeignKey(
        Expense,
        on_delete=models.CASCADE,
        related_name='splits',
        verbose_name="關聯支出"
    )
    
    participant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='expense_splits',
        verbose_name="分攤參與者"
    )
    
    split_type = models.CharField(
        "分攤類型",
        max_length=20,
        choices=SplitType.choices,
        default=SplitType.AVERAGE,
        help_text="費用的分攤計算方式"
    )
    
    split_value = models.DecimalField(
        "分攤值",
        max_digits=10,
        decimal_places=4,
        help_text="分攤的值（比例或固定金額）"
    )
    
    calculated_amount = models.DecimalField(
        "計算後金額",
        max_digits=10,
        decimal_places=2,
        help_text="根據分攤方式計算出的實際金額"
    )
    
    # 分攤調整記錄
    is_adjusted = models.BooleanField(
        "是否已調整",
        default=False,
        help_text="分攤是否被手動調整過"
    )
    
    adjusted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='adjusted_splits',
        verbose_name="調整者"
    )
    
    adjusted_at = models.DateTimeField(
        "調整時間",
        null=True,
        blank=True
    )
    
    # 時間戳
    created_at = models.DateTimeField("創建時間", auto_now_add=True)
    updated_at = models.DateTimeField("更新時間", auto_now=True)
    
    class Meta:
        verbose_name = "費用分攤"
        verbose_name_plural = "費用分攤"
        db_table = "expense_splits"
        unique_together = ['expense', 'participant']
        indexes = [
            models.Index(fields=['expense', 'participant']),
            models.Index(fields=['split_type']),
            models.Index(fields=['is_adjusted']),
        ]
        
    def __str__(self) -> str:
        return f"{self.expense.description[:20]} - {self.participant.username} - NT${self.calculated_amount}"
    
    def can_user_adjust(self, user) -> bool:
        """檢查用戶是否可以調整此分攤"""
        if not user or not user.is_authenticated:
            return False
        
        # 系統管理員可以調整所有分攤
        if user.role == 'ADMIN':
            return True
        
        # 如果有關聯活動
        if self.expense.event:
            # 活動管理者可以調整
            if self.expense.event.can_user_manage(user):
                return True
            
            # 檢查用戶是否被授權調整分攤
            participant = self.expense.event.participants.filter(user=user, is_active=True).first()
            if participant and participant.can_adjust_splits:
                # 但不能調整已被活動管理者調整過的項目
                return not (self.is_adjusted and self.adjusted_by and 
                           self.expense.event.can_user_manage(self.adjusted_by))
        
        return False
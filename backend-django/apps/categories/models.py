"""
分類模型

基於 legacy-project/prisma/schema.prisma 的 Category 模型轉換為 Django
"""

from django.db import models


class CategoryType(models.TextChoices):
    """
    分類類型選擇
    
    對應 legacy-project 中的收支類型
    """
    EXPENSE = 'EXPENSE', '支出'
    INCOME = 'INCOME', '收入'


class Category(models.Model):
    """
    分類模型
    
    對應 legacy-project/prisma/schema.prisma 中的 Category 模型
    用於交易記錄的分類管理
    """
    
    name = models.CharField(
        "分類名稱",
        max_length=100,
        help_text="分類的顯示名稱"
    )
    
    type = models.CharField(
        "分類類型",
        max_length=10,
        choices=CategoryType.choices,
        help_text="分類是用於支出還是收入"
    )
    
    is_default = models.BooleanField(
        "預設分類",
        default=False,
        help_text="是否為系統預設分類"
    )
    
    # 時間戳
    created_at = models.DateTimeField("創建時間", auto_now_add=True)
    updated_at = models.DateTimeField("更新時間", auto_now=True)
    
    class Meta:
        verbose_name = "分類"
        verbose_name_plural = "分類"
        db_table = "categories"
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['is_default']),
        ]
        
    def __str__(self) -> str:
        return f"{self.name} ({self.get_type_display()})"
    
    @property
    def is_expense_category(self) -> bool:
        """檢查是否為支出分類"""
        return self.type == CategoryType.EXPENSE
    
    @property
    def is_income_category(self) -> bool:
        """檢查是否為收入分類"""
        return self.type == CategoryType.INCOME
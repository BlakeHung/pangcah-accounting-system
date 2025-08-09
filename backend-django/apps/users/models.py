"""
用戶模型

基於 legacy-project/prisma/schema.prisma 的 User 模型轉換為 Django
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    """
    用戶角色選擇
    
    簡化為兩種角色：系統管理員和一般用戶
    群組級別的管理權限通過 Group.managers 欄位實現
    """
    ADMIN = 'ADMIN', '系統管理員'
    USER = 'USER', '一般用戶'


class User(AbstractUser):
    """
    用戶模型
    
    繼承 Django 的 AbstractUser，添加自定義欄位
    對應 legacy-project/prisma/schema.prisma 中的 User 模型
    """
    
    # 繼承的欄位: username, email, first_name, last_name, password 等
    
    # 自定義欄位
    name = models.CharField(
        "姓名", 
        max_length=100,
        help_text="用戶真實姓名"
    )
    
    role = models.CharField(
        "角色",
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.USER,
        help_text="用戶在系統中的角色"
    )
    
    image = models.URLField(
        "頭像",
        blank=True,
        null=True,
        help_text="用戶頭像 URL"
    )
    
    # 時間戳 (繼承自 AbstractUser: date_joined, last_login)
    created_at = models.DateTimeField("創建時間", auto_now_add=True)
    updated_at = models.DateTimeField("更新時間", auto_now=True)
    
    class Meta:
        verbose_name = "用戶"
        verbose_name_plural = "用戶"
        db_table = "users"
        
    def __str__(self) -> str:
        return f"{self.name} ({self.username})"
    
    @property
    def is_admin(self) -> bool:
        """檢查是否為管理員"""
        return self.role == UserRole.ADMIN
    
    @property
    def is_regular_user(self) -> bool:
        """檢查是否為一般用戶"""
        return self.role == UserRole.USER
    
    @property
    def can_manage_payments(self) -> bool:
        """檢查是否可以管理付款狀態"""
        return self.role == UserRole.ADMIN


class UserPreferences(models.Model):
    """
    用戶偏好設定
    簡化版本，只包含核心偏好
    """
    THEME_CHOICES = [
        ('light', '淺色主題'),
        ('dark', '深色主題'),
    ]
    
    CURRENCY_CHOICES = [
        ('TWD', '新台幣'),
        ('USD', '美元'),
        ('EUR', '歐元'),
        ('JPY', '日圓'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='preferences',
        verbose_name='用戶'
    )
    
    theme = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='light',
        verbose_name='介面主題'
    )
    
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='TWD',
        verbose_name='貨幣顯示'
    )
    
    notifications = models.BooleanField(
        default=True,
        verbose_name='應用內通知'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '用戶偏好設定'
        verbose_name_plural = '用戶偏好設定'
        db_table = 'user_preferences'
    
    def __str__(self):
        return f"{self.user.name} 的偏好設定"
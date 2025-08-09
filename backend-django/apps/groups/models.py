"""
群組模型

基於 legacy-project/prisma/schema.prisma 的 Group 相關模型轉換為 Django
"""

from django.db import models
from django.conf import settings


class Group(models.Model):
    """
    群組模型
    
    用於管理家族成員群組
    """
    
    name = models.CharField(
        "群組名稱",
        max_length=100,
        help_text="群組的顯示名稱"
    )
    
    description = models.TextField(
        "群組描述",
        blank=True,
        help_text="群組的詳細描述"
    )
    
    # 創建者
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_groups',
        verbose_name="創建者"
    )
    
    # 群組管理者 (多對多關係)
    managers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='managed_groups',
        blank=True,
        verbose_name="群組管理者",
        help_text="被指定管理此群組的用戶"
    )
    
    # 時間戳
    created_at = models.DateTimeField("創建時間", auto_now_add=True)
    updated_at = models.DateTimeField("更新時間", auto_now=True)
    
    class Meta:
        verbose_name = "群組"
        verbose_name_plural = "群組"
        db_table = "groups"
        
    def __str__(self) -> str:
        return self.name
    
    @property
    def member_count(self) -> int:
        """取得群組成員數量"""
        return self.members.count()
    
    def is_manager(self, user) -> bool:
        """檢查指定用戶是否為此群組的管理者"""
        if user.role == 'ADMIN':  # 系統管理員預設為所有群組的管理者
            return True
        return self.managers.filter(id=user.id).exists()
    
    def add_manager(self, user):
        """添加群組管理者"""
        self.managers.add(user)
    
    def remove_manager(self, user):
        """移除群組管理者"""
        self.managers.remove(user)


class GroupMember(models.Model):
    """
    群組成員模型
    
    支持系統用戶和非系統用戶的混合管理
    """
    
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='members',
        verbose_name="群組"
    )
    
    name = models.CharField(
        "成員姓名",
        max_length=100,
        help_text="成員的顯示姓名"
    )
    
    # 可選的系統用戶關聯
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='group_memberships',
        verbose_name="關聯用戶",
        help_text="如果是系統用戶則建立關聯"
    )
    
    # 時間戳
    created_at = models.DateTimeField("創建時間", auto_now_add=True)
    updated_at = models.DateTimeField("更新時間", auto_now=True)
    
    class Meta:
        verbose_name = "群組成員"
        verbose_name_plural = "群組成員"
        db_table = "group_members"
        unique_together = [['group', 'user']]  # 同一群組中用戶不能重複
        
    def __str__(self) -> str:
        return f"{self.group.name} - {self.name}"
    
    @property
    def is_system_user(self) -> bool:
        """檢查是否為系統用戶"""
        return self.user is not None
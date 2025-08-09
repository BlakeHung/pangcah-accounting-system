"""
活動模型

基於 legacy-project/prisma/schema.prisma 的 Activity 模型轉換為 Django
在新架構中重命名為 Event 以更符合業務語意
"""

from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth import get_user_model


class EventStatus(models.TextChoices):
    """
    活動狀態選擇
    """
    ACTIVE = 'ACTIVE', '進行中'
    COMPLETED = 'COMPLETED', '已完成'
    CANCELLED = 'CANCELLED', '已取消'


class Event(models.Model):
    """
    活動模型
    
    對應 legacy-project/prisma/schema.prisma 中的 Activity 模型
    重命名為 Event 以更符合阿美族家族活動的語意
    """
    
    name = models.CharField(
        "活動名稱",
        max_length=200,
        help_text="活動的顯示名稱"
    )
    
    description = models.TextField(
        "活動描述",
        blank=True,
        help_text="活動的詳細描述"
    )
    
    # 時間資訊
    start_date = models.DateTimeField(
        "開始時間",
        help_text="活動開始的日期時間"
    )
    
    end_date = models.DateTimeField(
        "結束時間",
        help_text="活動結束的日期時間"
    )
    
    # 狀態管理
    status = models.CharField(
        "活動狀態",
        max_length=10,
        choices=EventStatus.choices,
        default=EventStatus.ACTIVE,
        help_text="活動目前的狀態"
    )
    
    enabled = models.BooleanField(
        "啟用狀態",
        default=True,
        help_text="活動是否啟用"
    )
    
    # 關聯資訊
    group = models.ForeignKey(
        'groups.Group',
        on_delete=models.CASCADE,
        related_name='events',
        verbose_name="所屬群組",
        help_text="活動所屬的群組"
    )
    
    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_events',
        verbose_name="創建者",
        help_text="創建此活動的用戶"
    )
    
    # 活動管理者 - 多對多關係
    managers = models.ManyToManyField(
        get_user_model(),
        related_name='managed_events',
        verbose_name="活動管理者",
        help_text="可管理此活動的用戶列表",
        blank=True
    )
    
    # 結算控制
    is_locked = models.BooleanField(
        "結算鎖定狀態",
        default=False,
        help_text="活動是否已結算鎖定，鎖定後一般用戶無法新增記錄"
    )
    
    settlement_date = models.DateTimeField(
        "結算時間",
        null=True,
        blank=True,
        help_text="活動結算的時間"
    )
    
    # 分帳控制
    allow_split = models.BooleanField(
        "允許分帳",
        default=True,
        help_text="是否允許此活動的支出進行分帳"
    )
    
    # 預算管理
    budget = models.DecimalField(
        "活動預算",
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="活動的總預算"
    )
    
    # 時間戳
    created_at = models.DateTimeField("創建時間", auto_now_add=True)
    updated_at = models.DateTimeField("更新時間", auto_now=True)
    
    class Meta:
        verbose_name = "活動"
        verbose_name_plural = "活動"
        db_table = "events"
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['enabled']),
            models.Index(fields=['start_date']),
        ]
        
    def __str__(self) -> str:
        return self.name
    
    @property
    def is_active(self) -> bool:
        """檢查活動是否為進行中"""
        return self.status == EventStatus.ACTIVE and self.enabled
    
    @property
    def is_completed(self) -> bool:
        """檢查活動是否已完成"""
        return self.status == EventStatus.COMPLETED
    
    @property
    def is_in_progress(self) -> bool:
        """檢查活動是否已開始進行"""
        from django.utils import timezone
        return self.start_date <= timezone.now()
    
    @property
    def is_before_start(self) -> bool:
        """檢查活動是否尚未開始"""
        from django.utils import timezone
        return self.start_date > timezone.now()
    
    def can_user_manage(self, user) -> bool:
        """檢查用戶是否可以管理此活動"""
        if not user or not user.is_authenticated:
            return False
        
        # 系統管理員可以管理所有活動
        if user.role == 'ADMIN':
            return True
        
        # 活動管理者可以管理
        if self.managers.filter(id=user.id).exists():
            return True
        
        return False
    
    def can_user_view_finances(self, user) -> bool:
        """檢查用戶是否可以查看此活動的財務狀況"""
        if not user or not user.is_authenticated:
            return False
        
        # 系統管理員可以查看所有活動
        if user.role == 'ADMIN':
            return True
        
        # 活動管理者可以查看
        if self.managers.filter(id=user.id).exists():
            return True
        
        # 群組管理者可以查看群組內活動的財務狀況
        if self.group and self.group.managers.filter(id=user.id).exists():
            return True
        
        return False
    
    def can_user_add_expense(self, user) -> bool:
        """檢查用戶是否可以新增支出記錄"""
        if not user or not user.is_authenticated:
            return False
        
        # 如果活動已鎖定，只有管理員和活動管理者可以新增
        if self.is_locked:
            return self.can_user_manage(user)
        
        # 檢查用戶是否為活動參與者
        return self.participants.filter(user=user, is_active=True).exists()
    
    def perform_settlement(self, user):
        """執行活動結算"""
        if not self.can_user_manage(user):
            raise PermissionError("只有活動管理者可以執行結算")
        
        from django.utils import timezone
        self.status = EventStatus.COMPLETED
        self.is_locked = True
        self.settlement_date = timezone.now()
        self.save()


class EDM(models.Model):
    """
    EDM (電子直郵) 模型
    
    對應 legacy-project 中的 EDM 模型
    用於活動宣傳和資訊發布
    """
    
    # 關聯活動 (一對一關係)
    event = models.OneToOneField(
        Event,
        on_delete=models.CASCADE,
        related_name='edm',
        verbose_name="關聯活動"
    )
    
    # EDM 內容
    title = models.CharField(
        "EDM 標題",
        max_length=200,
        help_text="EDM 的標題"
    )
    
    content = models.TextField(
        "EDM 內容",
        help_text="EDM 的詳細內容"
    )
    
    images = ArrayField(
        models.URLField(),
        verbose_name="圖片列表",
        blank=True,
        default=list,
        help_text="EDM 相關圖片的 URL 列表"
    )
    
    contact_info = models.CharField(
        "聯絡資訊",
        max_length=500,
        blank=True,
        help_text="聯絡方式資訊"
    )
    
    registration_link = models.URLField(
        "報名連結",
        blank=True,
        help_text="活動報名連結"
    )
    
    # 時間戳
    created_at = models.DateTimeField("創建時間", auto_now_add=True)
    updated_at = models.DateTimeField("更新時間", auto_now=True)
    
    class Meta:
        verbose_name = "EDM"
        verbose_name_plural = "EDM"
        db_table = "edms"
        
    def __str__(self) -> str:
        return f"{self.title} - {self.event.name}"


class SplitOption(models.TextChoices):
    """參與者分攤選項"""
    NO_SPLIT = 'NO_SPLIT', '不分攤先前費用'
    PARTIAL_SPLIT = 'PARTIAL_SPLIT', '部分分攤費用'  
    FULL_SPLIT = 'FULL_SPLIT', '分攤所有費用'


class ActivityParticipant(models.Model):
    """
    活動參與者模型
    
    記錄用戶參與活動的詳細資訊，包括加入時間和分攤選項
    """
    
    activity = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='participants',
        verbose_name="關聯活動"
    )
    
    user = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name='activity_participations',
        verbose_name="參與用戶"
    )
    
    joined_at = models.DateTimeField(
        "加入時間",
        auto_now_add=True,
        help_text="用戶加入活動的時間"
    )
    
    split_option = models.CharField(
        "分攤選項",
        max_length=20,
        choices=SplitOption.choices,
        default=SplitOption.FULL_SPLIT,
        help_text="用戶的費用分攤選項"
    )
    
    is_active = models.BooleanField(
        "是否活躍",
        default=True,
        help_text="用戶是否仍在活動中"
    )
    
    # 部分分攤時的特定支出ID列表（JSON格式）
    partial_split_expenses = models.JSONField(
        "部分分攤支出列表",
        default=list,
        blank=True,
        help_text="當選擇部分分攤時，需要分攤的支出ID列表"
    )
    
    # 授權管理
    can_adjust_splits = models.BooleanField(
        "可調整分攤權限",
        default=False,
        help_text="是否被授權可以調整費用分攤方式"
    )
    
    # 時間戳
    created_at = models.DateTimeField("創建時間", auto_now_add=True)
    updated_at = models.DateTimeField("更新時間", auto_now=True)
    
    class Meta:
        verbose_name = "活動參與者"
        verbose_name_plural = "活動參與者"
        db_table = "activity_participants"
        unique_together = ['activity', 'user']
        indexes = [
            models.Index(fields=['activity', 'user']),
            models.Index(fields=['is_active']),
        ]
        
    def __str__(self) -> str:
        return f"{self.user.username} - {self.activity.name}"


class ActionType(models.TextChoices):
    """活動操作類型"""
    EXPENSE_ADD = 'EXPENSE_ADD', '新增支出'
    EXPENSE_EDIT = 'EXPENSE_EDIT', '編輯支出'
    EXPENSE_DELETE = 'EXPENSE_DELETE', '刪除支出'
    INCOME_ADD = 'INCOME_ADD', '新增收入'
    INCOME_EDIT = 'INCOME_EDIT', '編輯收入'
    INCOME_DELETE = 'INCOME_DELETE', '刪除收入'
    USER_JOIN = 'USER_JOIN', '用戶加入'
    USER_LEAVE = 'USER_LEAVE', '用戶離開'
    SPLIT_ADJUST = 'SPLIT_ADJUST', '調整分攤'
    STATUS_CHANGE = 'STATUS_CHANGE', '狀態變更'
    ACTIVITY_EDIT = 'ACTIVITY_EDIT', '活動編輯'
    SETTLEMENT = 'SETTLEMENT', '執行結算'
    MANAGER_ADDED = 'MANAGER_ADDED', '新增管理者'
    MANAGER_REMOVED = 'MANAGER_REMOVED', '移除管理者'


class ActivityLog(models.Model):
    """
    活動記錄模型
    
    記錄活動中的所有操作歷史，提供完整的審計追蹤
    """
    
    activity = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='logs',
        verbose_name="關聯活動"
    )
    
    action_type = models.CharField(
        "操作類型",
        max_length=20,
        choices=ActionType.choices,
        help_text="執行的操作類型"
    )
    
    description = models.TextField(
        "操作描述",
        help_text="操作的詳細描述"
    )
    
    operator = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_operations',
        verbose_name="操作者"
    )
    
    timestamp = models.DateTimeField(
        "操作時間",
        auto_now_add=True
    )
    
    # 額外的元數據資訊（JSON格式）
    metadata = models.JSONField(
        "操作元數據",
        default=dict,
        blank=True,
        help_text="操作的額外資訊，如變更前後的值"
    )
    
    class Meta:
        verbose_name = "活動記錄"
        verbose_name_plural = "活動記錄"
        db_table = "activity_logs"
        indexes = [
            models.Index(fields=['activity', 'timestamp']),
            models.Index(fields=['action_type']),
            models.Index(fields=['operator']),
        ]
        ordering = ['-timestamp']
        
    def __str__(self) -> str:
        operator_name = self.operator.username if self.operator else "系統"
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M')} | {operator_name} | {self.get_action_type_display()}"
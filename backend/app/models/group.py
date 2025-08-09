"""
群組模型

基於 legacy-project/prisma/schema.prisma 的 Group 相關模型轉換
支持家族成員群組管理和分帳功能
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from sqlalchemy import Column, String, DateTime, Boolean, Text, Numeric, ForeignKey, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class SplitType(str, Enum):
    """
    分帳類型枚舉
    """
    EQUAL = "EQUAL"        # 平均分攤
    PERCENTAGE = "PERCENTAGE"  # 按比例分攤
    FIXED = "FIXED"        # 固定金額


class Group(Base):
    """
    群組模型
    
    對應 legacy-project/prisma/schema.prisma 中的 Group 模型
    用於管理家族成員群組
    """
    __tablename__ = "groups"
    
    # 主鍵
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="群組唯一識別符"
    )
    
    # 基本資訊
    name = Column(
        String(100),
        nullable=False,
        comment="群組名稱"
    )
    
    description = Column(
        Text,
        nullable=True,
        comment="群組描述"
    )
    
    # 外鍵關聯創建者
    created_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        comment="創建者用戶 ID"
    )
    
    # 時間戳
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="創建時間"
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="更新時間"
    )
    
    # 關聯關係
    created_by = relationship("User", back_populates="created_groups")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="group", lazy="dynamic")
    event_groups = relationship("EventGroup", back_populates="group", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<Group(id={self.id}, name={self.name}, created_by_id={self.created_by_id})>"
    
    def to_dict(self) -> dict:
        """
        轉換為字典格式
        
        Returns:
            dict: 群組信息字典
        """
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "created_by_id": str(self.created_by_id),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class GroupMember(Base):
    """
    群組成員模型
    
    對應 legacy-project/prisma/schema.prisma 中的 GroupMember 模型
    支持系統用戶和非系統用戶的混合管理
    """
    __tablename__ = "group_members"
    
    # 主鍵
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="群組成員唯一識別符"
    )
    
    # 外鍵關聯
    group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        comment="群組 ID"
    )
    
    # 成員資訊
    name = Column(
        String(100),
        nullable=False,
        comment="成員姓名"
    )
    
    # 可選的系統用戶關聯
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        comment="關聯的系統用戶 ID（可選）"
    )
    
    # 時間戳
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="創建時間"
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="更新時間"
    )
    
    # 關聯關係
    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="group_memberships")
    expense_splits = relationship("ExpenseMemberSplit", back_populates="member", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<GroupMember(id={self.id}, name={self.name}, group_id={self.group_id})>"
    
    def to_dict(self) -> dict:
        """
        轉換為字典格式
        
        Returns:
            dict: 群組成員信息字典
        """
        return {
            "id": str(self.id),
            "group_id": str(self.group_id),
            "name": self.name,
            "user_id": str(self.user_id) if self.user_id else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ExpenseMemberSplit(Base):
    """
    支出分帳記錄模型
    
    對應 legacy-project/prisma/schema.prisma 中的 TransactionMemberSplit 模型
    用於記錄支出在群組成員間的分攤情況
    """
    __tablename__ = "expense_member_splits"
    
    # 主鍵
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="分帳記錄唯一識別符"
    )
    
    # 外鍵關聯
    expense_id = Column(
        UUID(as_uuid=True),
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        comment="支出記錄 ID"
    )
    
    group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("groups.id"),
        nullable=False,
        comment="群組 ID"
    )
    
    member_id = Column(
        UUID(as_uuid=True),
        ForeignKey("group_members.id"),
        nullable=False,
        comment="群組成員 ID"
    )
    
    # 分帳資訊
    is_included = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="是否納入分帳計算"
    )
    
    split_type = Column(
        SQLEnum(SplitType),
        default=SplitType.EQUAL,
        nullable=False,
        comment="分帳類型"
    )
    
    split_value = Column(
        Numeric(10, 2),
        nullable=True,
        comment="分帳值（比例時為百分比，固定金額時為金額）"
    )
    
    calculated_amount = Column(
        Numeric(10, 2),
        nullable=True,
        comment="計算後的分攤金額"
    )
    
    # 時間戳
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="創建時間"
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="更新時間"
    )
    
    # 關聯關係
    expense = relationship("Expense", back_populates="member_splits")
    group = relationship("Group")
    member = relationship("GroupMember", back_populates="expense_splits")
    
    def __repr__(self) -> str:
        return f"<ExpenseMemberSplit(id={self.id}, expense_id={self.expense_id}, member_id={self.member_id})>"
    
    def to_dict(self) -> dict:
        """
        轉換為字典格式
        
        Returns:
            dict: 分帳記錄信息字典
        """
        return {
            "id": str(self.id),
            "expense_id": str(self.expense_id),
            "group_id": str(self.group_id),
            "member_id": str(self.member_id),
            "is_included": self.is_included,
            "split_type": self.split_type.value,
            "split_value": float(self.split_value) if self.split_value else None,
            "calculated_amount": float(self.calculated_amount) if self.calculated_amount else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class EventGroup(Base):
    """
    活動群組參與模型
    
    對應 legacy-project/prisma/schema.prisma 中的 ActivityGroup 模型
    記錄群組參與活動的情況
    """
    __tablename__ = "event_groups"
    
    # 主鍵
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="活動群組參與記錄唯一識別符"
    )
    
    # 外鍵關聯
    event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        comment="活動 ID"
    )
    
    group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("groups.id"),
        nullable=False,
        comment="群組 ID"
    )
    
    # 參與資訊
    member_count = Column(
        Integer,
        nullable=False,
        default=0,
        comment="實際參與人數"
    )
    
    # 時間戳
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="創建時間"
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="更新時間"
    )
    
    # 關聯關係
    event = relationship("Event")
    group = relationship("Group", back_populates="event_groups")
    
    def __repr__(self) -> str:
        return f"<EventGroup(id={self.id}, event_id={self.event_id}, group_id={self.group_id})>"
    
    def to_dict(self) -> dict:
        """
        轉換為字典格式
        
        Returns:
            dict: 活動群組參與記錄信息字典
        """
        return {
            "id": str(self.id),
            "event_id": str(self.event_id),
            "group_id": str(self.group_id),
            "member_count": self.member_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
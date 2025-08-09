"""
支出記錄模型

基於 legacy-project/prisma/schema.prisma 的 Transaction 模型轉換
在新架構中重命名為 Expense 以更清楚地表達業務含義
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from sqlalchemy import Column, String, DateTime, Boolean, Text, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class ExpenseType(str, Enum):
    """
    支出類型枚舉
    """
    EXPENSE = "EXPENSE"
    INCOME = "INCOME"


class ExpenseStatus(str, Enum):
    """
    支出狀態枚舉
    """
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PaymentStatus(str, Enum):
    """
    付款狀態枚舉
    """
    UNPAID = "UNPAID"
    PAID = "PAID"
    PARTIAL = "PARTIAL"


class Expense(Base):
    """
    支出記錄模型
    
    對應 legacy-project/prisma/schema.prisma 中的 Transaction 模型
    重命名為 Expense 以更符合家族記帳的業務語意
    """
    __tablename__ = "expenses"
    
    # 主鍵
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="支出記錄唯一識別符"
    )
    
    # 金額資訊
    amount = Column(
        Numeric(10, 2),
        nullable=False,
        comment="金額"
    )
    
    type = Column(
        SQLEnum(ExpenseType),
        default=ExpenseType.EXPENSE,
        nullable=False,
        comment="類型：支出或收入"
    )
    
    # 基本資訊
    date = Column(
        DateTime(timezone=True),
        nullable=False,
        comment="發生日期"
    )
    
    description = Column(
        Text,
        nullable=True,
        comment="描述"
    )
    
    images = Column(
        ARRAY(String),
        default=[],
        comment="相關圖片 URL 列表"
    )
    
    # 外鍵關聯
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id"),
        nullable=False,
        comment="分類 ID"
    )
    
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        comment="記錄者用戶 ID"
    )
    
    event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("events.id"),
        nullable=True,
        comment="關聯活動 ID"
    )
    
    group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("groups.id"),
        nullable=True,
        comment="關聯群組 ID"
    )
    
    # 狀態管理
    status = Column(
        SQLEnum(ExpenseStatus),
        default=ExpenseStatus.PENDING,
        nullable=False,
        comment="審批狀態"
    )
    
    payment_status = Column(
        SQLEnum(PaymentStatus),
        default=PaymentStatus.UNPAID,
        nullable=False,
        comment="付款狀態"
    )
    
    paid_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="付款時間"
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
    category = relationship("Category", back_populates="expenses")
    user = relationship("User", back_populates="expenses")
    event = relationship("Event", back_populates="expenses")
    group = relationship("Group", back_populates="expenses")
    # member_splits: List["ExpenseMemberSplit"] = relationship("ExpenseMemberSplit", back_populates="expense")
    # payments: List["ExpensePayment"] = relationship("ExpensePayment", back_populates="expense")
    
    def __repr__(self) -> str:
        return f"<Expense(id={self.id}, amount={self.amount}, type={self.type}, status={self.status})>"
    
    def to_dict(self) -> dict:
        """
        轉換為字典格式
        
        Returns:
            dict: 支出記錄信息字典
        """
        return {
            "id": str(self.id),
            "amount": float(self.amount),
            "type": self.type.value,
            "date": self.date.isoformat() if self.date else None,
            "description": self.description,
            "images": self.images or [],
            "category_id": str(self.category_id),
            "user_id": str(self.user_id),
            "event_id": str(self.event_id) if self.event_id else None,
            "group_id": str(self.group_id) if self.group_id else None,
            "status": self.status.value,
            "payment_status": self.payment_status.value,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ExpensePayment(Base):
    """
    支出付款記錄模型
    
    對應 legacy-project 中的 TransactionPayment 模型
    支持多人付款的情況
    """
    __tablename__ = "expense_payments"
    
    # 主鍵
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="付款記錄唯一識別符"
    )
    
    # 外鍵關聯
    expense_id = Column(
        UUID(as_uuid=True),
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        comment="支出記錄 ID"
    )
    
    payer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        comment="付款人 ID"
    )
    
    # 付款資訊
    amount = Column(
        Numeric(10, 2),
        nullable=False,
        comment="付款金額"
    )
    
    payment_date = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="付款日期"
    )
    
    payment_method = Column(
        String(50),
        nullable=True,
        comment="付款方式"
    )
    
    note = Column(
        Text,
        nullable=True,
        comment="備註"
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
    expense = relationship("Expense", back_populates="payments")
    payer = relationship("User")
    
    def __repr__(self) -> str:
        return f"<ExpensePayment(id={self.id}, expense_id={self.expense_id}, amount={self.amount})>"
    
    def to_dict(self) -> dict:
        """
        轉換為字典格式
        
        Returns:
            dict: 付款記錄信息字典
        """
        return {
            "id": str(self.id),
            "expense_id": str(self.expense_id),
            "payer_id": str(self.payer_id),
            "amount": float(self.amount),
            "payment_date": self.payment_date.isoformat() if self.payment_date else None,
            "payment_method": self.payment_method,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
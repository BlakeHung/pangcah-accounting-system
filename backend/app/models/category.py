"""
分類模型

基於 legacy-project/prisma/schema.prisma 的 Category 模型轉換
"""

from datetime import datetime
from enum import Enum
from typing import List

from sqlalchemy import Column, String, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class CategoryType(str, Enum):
    """
    分類類型枚舉
    
    對應 legacy-project 中的收支類型
    """
    EXPENSE = "EXPENSE"
    INCOME = "INCOME"


class Category(Base):
    """
    分類模型
    
    對應 legacy-project/prisma/schema.prisma 中的 Category 模型
    用於交易記錄的分類管理
    """
    __tablename__ = "categories"
    
    # 主鍵
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="分類唯一識別符"
    )
    
    # 基本信息
    name = Column(
        String(100),
        nullable=False,
        comment="分類名稱"
    )
    
    type = Column(
        SQLEnum(CategoryType),
        nullable=False,
        comment="分類類型：收入或支出"
    )
    
    is_default = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="是否為預設分類"
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
    expenses = relationship("Expense", back_populates="category", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name={self.name}, type={self.type})>"
    
    def to_dict(self) -> dict:
        """
        轉換為字典格式
        
        Returns:
            dict: 分類信息字典
        """
        return {
            "id": str(self.id),
            "name": self.name,
            "type": self.type.value,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
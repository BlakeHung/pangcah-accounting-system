"""
用戶模型

基於 legacy-project/prisma/schema.prisma 的 User 模型轉換
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import Column, String, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class UserRole(str, Enum):
    """
    用戶角色枚舉
    
    對應 legacy-project 中的 UserRole enum
    """
    ADMIN = "ADMIN"
    FINANCE_MANAGER = "FINANCE_MANAGER"
    USER = "USER"


class User(Base):
    """
    用戶模型
    
    對應 legacy-project/prisma/schema.prisma 中的 User 模型
    遷移從 MongoDB ObjectId 到 PostgreSQL UUID
    """
    __tablename__ = "users"
    
    # 主鍵改用 UUID
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="用戶唯一識別符"
    )
    
    # 基本信息
    name = Column(
        String(100), 
        nullable=False,
        comment="用戶姓名"
    )
    
    email = Column(
        String(255), 
        unique=True, 
        nullable=False,
        comment="用戶電子郵件"
    )
    
    password = Column(
        String(255), 
        nullable=False,
        comment="加密後的密碼"
    )
    
    role = Column(
        SQLEnum(UserRole),
        default=UserRole.USER,
        nullable=False,
        comment="用戶角色"
    )
    
    image = Column(
        String(500),
        nullable=True,
        comment="用戶頭像 URL"
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
    
    # 關聯關係 (使用 lazy import 避免循環導入)
    expenses = relationship("Expense", back_populates="user", lazy="dynamic")
    created_groups = relationship("Group", back_populates="created_by", lazy="dynamic")
    group_memberships = relationship("GroupMember", back_populates="user", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, name={self.name}, email={self.email}, role={self.role})>"
    
    def to_dict(self) -> dict:
        """
        轉換為字典格式
        
        用於 API 響應，不包含敏感信息如密碼
        
        Returns:
            dict: 用戶信息字典
        """
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "role": self.role.value,
            "image": self.image,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
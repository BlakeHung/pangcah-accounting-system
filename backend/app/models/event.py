"""
活動模型

基於 legacy-project/prisma/schema.prisma 的 Activity 模型轉換
在新架構中重命名為 Event 以更符合業務語意
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import Column, String, DateTime, Boolean, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class EventStatus(str, Enum):
    """
    活動狀態枚舉
    """
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Event(Base):
    """
    活動模型
    
    對應 legacy-project/prisma/schema.prisma 中的 Activity 模型
    重命名為 Event 以更符合阿美族家族活動的語意
    """
    __tablename__ = "events"
    
    # 主鍵
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="活動唯一識別符"
    )
    
    # 基本信息
    name = Column(
        String(200),
        nullable=False,
        comment="活動名稱"
    )
    
    description = Column(
        Text,
        nullable=True,
        comment="活動描述"
    )
    
    # 時間資訊
    start_date = Column(
        DateTime(timezone=True),
        nullable=False,
        comment="活動開始時間"
    )
    
    end_date = Column(
        DateTime(timezone=True),
        nullable=False,
        comment="活動結束時間"
    )
    
    # 狀態管理
    status = Column(
        SQLEnum(EventStatus),
        default=EventStatus.ACTIVE,
        nullable=False,
        comment="活動狀態"
    )
    
    enabled = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="是否啟用"
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
    expenses = relationship("Expense", back_populates="event", lazy="dynamic")
    edm = relationship("EDM", back_populates="event", uselist=False)
    
    def __repr__(self) -> str:
        return f"<Event(id={self.id}, name={self.name}, status={self.status})>"
    
    def to_dict(self) -> dict:
        """
        轉換為字典格式
        
        Returns:
            dict: 活動信息字典
        """
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status.value,
            "enabled": self.enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class EDM(Base):
    """
    EDM (電子直郵) 模型
    
    對應 legacy-project 中的 EDM 模型
    用於活動宣傳和資訊發布
    """
    __tablename__ = "edms"
    
    # 主鍵
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="EDM 唯一識別符"
    )
    
    # 外鍵關聯活動
    event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        comment="關聯的活動 ID"
    )
    
    # EDM 內容
    title = Column(
        String(200),
        nullable=False,
        comment="EDM 標題"
    )
    
    content = Column(
        Text,
        nullable=False,
        comment="EDM 內容"
    )
    
    images = Column(
        ARRAY(String),
        default=[],
        comment="EDM 圖片 URL 列表"
    )
    
    contact_info = Column(
        String(500),
        nullable=True,
        comment="聯絡資訊"
    )
    
    registration_link = Column(
        String(500),
        nullable=True,
        comment="報名連結"
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
    event = relationship("Event", back_populates="edm")
    
    def __repr__(self) -> str:
        return f"<EDM(id={self.id}, title={self.title}, event_id={self.event_id})>"
    
    def to_dict(self) -> dict:
        """
        轉換為字典格式
        
        Returns:
            dict: EDM 信息字典
        """
        return {
            "id": str(self.id),
            "event_id": str(self.event_id),
            "title": self.title,
            "content": self.content,
            "images": self.images or [],
            "contact_info": self.contact_info,
            "registration_link": self.registration_link,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
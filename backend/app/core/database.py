"""
資料庫連接和配置

基於 legacy-project 的 Prisma schema 轉換為 SQLAlchemy 模型
使用 PostgreSQL 替代 MongoDB
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()

# 創建異步資料庫引擎
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.DEBUG,
    future=True
)

# 創建異步會話工廠
AsyncSessionLocal = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# SQLAlchemy 基類
Base = declarative_base()


async def get_db() -> AsyncSession:
    """
    資料庫會話依賴注入
    
    用於 FastAPI 的依賴注入系統
    
    Yields:
        AsyncSession: 資料庫會話
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_tables():
    """
    創建所有資料庫表格
    
    在應用程序啟動時調用
    """
    async with engine.begin() as conn:
        # 導入所有模型以確保它們被註冊
        from app.models import (
            User, Category, Event, EDM, Expense, ExpensePayment,
            Group, GroupMember, ExpenseMemberSplit, EventGroup
        )
        
        # 創建所有表格
        await conn.run_sync(Base.metadata.create_all)
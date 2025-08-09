"""
應用程序配置管理

遵循 instruction.md 的配置管理原則
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    應用程序設定類
    
    使用 Pydantic Settings 進行環境變數管理
    """
    
    # 基本設定
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # 資料庫設定
    DATABASE_URL: str = "postgresql://user:password@localhost/family_finance"
    
    # CORS 設定
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",  # React 開發服務器
        "http://localhost:5173",  # Vite 開發服務器
    ]
    
    # JWT 設定
    JWT_SECRET_KEY: str = "jwt-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # AI 功能設定
    OPENAI_API_KEY: str = ""
    AI_ENABLED: bool = False
    AI_MAX_REQUESTS_PER_DAY: int = 100
    
    # 檔案上傳設定
    UPLOAD_MAX_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_ALLOWED_EXTENSIONS: List[str] = [
        ".jpg", ".jpeg", ".png", ".gif", ".pdf"
    ]
    
    # 快取設定
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL_SECONDS: int = 3600
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    獲取單例設定實例
    
    使用 lru_cache 確保設定只被載入一次
    
    Returns:
        Settings: 應用程序設定實例
    """
    return Settings()
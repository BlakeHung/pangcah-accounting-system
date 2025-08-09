"""
家族記帳 APP - FastAPI 主程序

根據 instruction.md 的架構設計原則建立，
使用分層架構：Controller → Service → Repository
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.database import create_tables

# 獲取設定
settings = get_settings()

# 創建 FastAPI 實例
app = FastAPI(
    title="Family Finance API",
    description="阿美族家族記帳系統 API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """
    應用程序啟動時執行的初始化操作
    """
    # 創建資料庫表格
    await create_tables()


@app.get("/")
async def root():
    """
    根路徑健康檢查
    """
    return JSONResponse(
        content={
            "message": "Family Finance API is running",
            "version": "1.0.0",
            "status": "healthy"
        }
    )


@app.get("/health")
async def health_check():
    """
    健康檢查端點
    """
    return JSONResponse(
        content={
            "status": "healthy",
            "timestamp": "2024-01-01T00:00:00Z"  # 實際上應該使用當前時間
        }
    )


# 註冊 API 路由
app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
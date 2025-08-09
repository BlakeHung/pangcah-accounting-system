"""
API v1 路由模組

根據 instruction.md 的要求，所有 API 都要加 /v1/ 前綴
"""

from fastapi import APIRouter

from app.api.v1 import auth, users, events, expenses, categories, groups

# 創建 v1 API 路由器
api_router = APIRouter()

# 註冊各模組路由
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
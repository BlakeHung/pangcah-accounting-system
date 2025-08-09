"""
用戶管理 API 路由

基於 legacy-project/src/app/api/users/ 的邏輯重新實作
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/", response_model=List[dict])
async def get_users(
    db: AsyncSession = Depends(get_db)
):
    """
    獲取用戶列表
    
    對應 legacy-project/src/app/api/users/route.ts 的 GET 方法
    
    Args:
        db: 資料庫會話
        
    Returns:
        List[dict]: 用戶列表
        
    Raises:
        HTTPException: 權限不足時拋出 403 錯誤
    """
    # TODO: 實作用戶列表獲取邏輯
    # 1. 檢查當前用戶權限（僅 ADMIN 可查看）
    # 2. 從資料庫獲取所有用戶
    # 3. 過濾敏感資訊（如密碼）
    # 4. 返回用戶列表
    
    return [
        {
            "message": "Get users endpoint - TODO: implement",
            "status": "placeholder"
        }
    ]


@router.post("/", response_model=dict)
async def create_user(
    db: AsyncSession = Depends(get_db)
):
    """
    創建新用戶
    
    對應 legacy-project/src/app/api/users/route.ts 的 POST 方法
    
    Args:
        db: 資料庫會話
        
    Returns:
        dict: 創建的用戶資訊
        
    Raises:
        HTTPException: 權限不足或創建失敗時拋出錯誤
    """
    # TODO: 實作用戶創建邏輯
    # 1. 檢查當前用戶權限（僅 ADMIN 可創建）
    # 2. 驗證輸入資料
    # 3. 檢查 email 唯一性
    # 4. 加密密碼
    # 5. 創建用戶記錄
    # 6. 返回用戶資訊（不含密碼）
    
    return {
        "message": "Create user endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.get("/{user_id}", response_model=dict)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    獲取特定用戶資訊
    
    對應 legacy-project/src/app/api/users/[id]/route.ts 的 GET 方法
    
    Args:
        user_id: 用戶 ID
        db: 資料庫會話
        
    Returns:
        dict: 用戶資訊
        
    Raises:
        HTTPException: 用戶不存在或權限不足時拋出錯誤
    """
    # TODO: 實作單用戶獲取邏輯
    # 1. 檢查當前用戶權限
    # 2. 從資料庫獲取指定用戶
    # 3. 返回用戶資訊（不含密碼）
    
    return {
        "message": f"Get user {user_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.put("/{user_id}", response_model=dict)
async def update_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    更新用戶資訊
    
    對應 legacy-project/src/app/api/users/[id]/route.ts 的 PUT 方法
    
    Args:
        user_id: 用戶 ID
        db: 資料庫會話
        
    Returns:
        dict: 更新後的用戶資訊
        
    Raises:
        HTTPException: 用戶不存在或權限不足時拋出錯誤
    """
    # TODO: 實作用戶更新邏輯
    # 1. 檢查當前用戶權限（僅 ADMIN 可修改）
    # 2. 驗證輸入資料
    # 3. 更新用戶記錄
    # 4. 返回更新後的用戶資訊
    
    return {
        "message": f"Update user {user_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    刪除用戶
    
    對應 legacy-project/src/app/api/users/[id]/route.ts 的 DELETE 方法
    
    Args:
        user_id: 用戶 ID
        db: 資料庫會話
        
    Returns:
        dict: 刪除成功訊息
        
    Raises:
        HTTPException: 用戶不存在或權限不足時拋出錯誤
    """
    # TODO: 實作用戶刪除邏輯
    # 1. 檢查當前用戶權限（僅 ADMIN 可刪除）
    # 2. 檢查用戶是否存在
    # 3. 軟刪除或硬刪除用戶記錄
    # 4. 返回刪除成功訊息
    
    return {
        "message": f"Delete user {user_id} endpoint - TODO: implement",
        "status": "placeholder"
    }
"""
分類管理 API 路由

基於 legacy-project/src/app/api/categories/ 的邏輯重新實作
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.category import Category, CategoryType

router = APIRouter()


@router.get("/", response_model=List[dict])
async def get_categories(
    db: AsyncSession = Depends(get_db)
):
    """
    獲取分類列表
    
    對應 legacy-project/src/app/api/categories/route.ts 的 GET 方法
    
    Args:
        db: 資料庫會話
        
    Returns:
        List[dict]: 分類列表
    """
    # TODO: 實作分類列表獲取邏輯
    # 1. 從資料庫獲取所有分類
    # 2. 按名稱排序
    # 3. 返回分類列表
    
    return [
        {
            "message": "Get categories endpoint - TODO: implement",
            "status": "placeholder"
        }
    ]


@router.post("/", response_model=dict)
async def create_category(
    db: AsyncSession = Depends(get_db)
):
    """
    創建新分類
    
    對應 legacy-project/src/app/api/categories/route.ts 的 POST 方法
    
    Args:
        db: 資料庫會話
        
    Returns:
        dict: 創建的分類資訊
        
    Raises:
        HTTPException: 權限不足或創建失敗時拋出錯誤
    """
    # TODO: 實作分類創建邏輯
    # 1. 檢查當前用戶權限（僅 ADMIN 可創建）
    # 2. 使用 Zod schema 驗證輸入資料
    # 3. 檢查分類名稱唯一性
    # 4. 創建分類記錄
    # 5. 返回分類資訊
    
    return {
        "message": "Create category endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.get("/{category_id}", response_model=dict)
async def get_category(
    category_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    獲取特定分類資訊
    
    Args:
        category_id: 分類 ID
        db: 資料庫會話
        
    Returns:
        dict: 分類資訊
        
    Raises:
        HTTPException: 分類不存在時拋出 404 錯誤
    """
    # TODO: 實作單分類獲取邏輯
    # 1. 從資料庫獲取指定分類
    # 2. 檢查分類是否存在
    # 3. 返回分類資訊
    
    return {
        "message": f"Get category {category_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.patch("/{category_id}", response_model=dict)
async def update_category(
    category_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    更新分類名稱
    
    對應 legacy-project/src/app/api/categories/[id]/route.ts 的 PATCH 方法
    
    Args:
        category_id: 分類 ID
        db: 資料庫會話
        
    Returns:
        dict: 更新後的分類資訊
        
    Raises:
        HTTPException: 分類不存在或權限不足時拋出錯誤
    """
    # TODO: 實作分類更新邏輯
    # 1. 檢查當前用戶權限（僅 ADMIN 可修改）
    # 2. 驗證輸入資料（名稱不能為空）
    # 3. 檢查分類是否存在
    # 4. 更新分類記錄
    # 5. 返回更新後的分類資訊
    
    return {
        "message": f"Update category {category_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    刪除分類
    
    對應 legacy-project/src/app/api/categories/[id]/route.ts 的 DELETE 方法
    
    Args:
        category_id: 分類 ID
        db: 資料庫會話
        
    Returns:
        dict: 刪除成功訊息（返回 204 No Content）
        
    Raises:
        HTTPException: 分類不存在或權限不足時拋出錯誤
    """
    # TODO: 實作分類刪除邏輯
    # 1. 檢查當前用戶權限（僅 ADMIN 可刪除）
    # 2. 檢查分類是否存在
    # 3. 檢查分類是否正在被使用（如果有關聯的支出記錄則不能刪除）
    # 4. 刪除分類記錄
    # 5. 返回 204 No Content
    
    return {
        "message": f"Delete category {category_id} endpoint - TODO: implement",
        "status": "placeholder"
    }
"""
支出記錄 API 路由

基於 legacy-project/src/app/api/transactions/ 的邏輯重新實作
在新架構中重命名為 expenses 以更清楚表達業務含義
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.expense import Expense, ExpenseStatus, PaymentStatus

router = APIRouter()


@router.get("/", response_model=List[dict])
async def get_expenses(
    user_id: Optional[str] = Query(None, description="篩選特定用戶的支出記錄"),
    sort_by: Optional[str] = Query("created_at", description="排序欄位"),
    order: Optional[str] = Query("desc", description="排序順序"),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取支出記錄列表
    
    對應 legacy-project/src/app/api/transactions/route.ts 的 GET 方法
    
    Args:
        user_id: 可選的用戶 ID 篩選
        sort_by: 排序欄位
        order: 排序順序
        db: 資料庫會話
        
    Returns:
        List[dict]: 支出記錄列表
    """
    # TODO: 實作支出記錄列表獲取邏輯
    # 1. 檢查當前用戶權限
    #    - ADMIN/FINANCE 可查看所有記錄
    #    - 普通用戶僅查看自己的記錄
    # 2. 應用查詢參數篩選
    # 3. 包含關聯數據 (category, user, event)
    # 4. 返回支出記錄列表
    
    return [
        {
            "message": "Get expenses endpoint - TODO: implement",
            "status": "placeholder",
            "filters": {
                "user_id": user_id,
                "sort_by": sort_by,
                "order": order
            }
        }
    ]


@router.post("/", response_model=dict)
async def create_expense(
    db: AsyncSession = Depends(get_db)
):
    """
    創建新支出記錄
    
    對應 legacy-project/src/app/api/transactions/route.ts 的 POST 方法
    
    Args:
        db: 資料庫會話
        
    Returns:
        dict: 創建的支出記錄資訊
        
    Raises:
        HTTPException: 創建失敗時拋出錯誤
    """
    # TODO: 實作支出記錄創建邏輯
    # 1. 驗證輸入資料（amount, category_id, date 必填）
    # 2. 自動關聯到第一個活躍活動（如果有）
    # 3. 設定初始狀態為 PENDING
    # 4. 支援圖片上傳
    # 5. 創建支出記錄
    # 6. 返回創建的記錄資訊
    
    return {
        "message": "Create expense endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.get("/{expense_id}", response_model=dict)
async def get_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    獲取特定支出記錄資訊
    
    Args:
        expense_id: 支出記錄 ID
        db: 資料庫會話
        
    Returns:
        dict: 支出記錄資訊
        
    Raises:
        HTTPException: 支出記錄不存在或權限不足時拋出錯誤
    """
    # TODO: 實作單支出記錄獲取邏輯
    # 1. 檢查支出記錄是否存在
    # 2. 檢查用戶權限（記錄創建者或 ADMIN 可查看）
    # 3. 包含關聯數據
    # 4. 返回支出記錄資訊
    
    return {
        "message": f"Get expense {expense_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.put("/{expense_id}", response_model=dict)
async def update_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    更新支出記錄
    
    對應 legacy-project/src/app/api/transactions/[id]/route.ts 的 PUT 方法
    
    Args:
        expense_id: 支出記錄 ID
        db: 資料庫會話
        
    Returns:
        dict: 更新後的支出記錄資訊
        
    Raises:
        HTTPException: 支出記錄不存在或權限不足時拋出錯誤
    """
    # TODO: 實作支出記錄更新邏輯
    # 1. 檢查用戶權限（記錄創建者或 ADMIN 可修改）
    # 2. 驗證活動存在性（如果更新 event_id）
    # 3. 更新支出記錄
    # 4. 返回更新後的資訊
    
    return {
        "message": f"Update expense {expense_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    刪除支出記錄
    
    Args:
        expense_id: 支出記錄 ID
        db: 資料庫會話
        
    Returns:
        dict: 刪除成功訊息
        
    Raises:
        HTTPException: 支出記錄不存在或權限不足時拋出錯誤
    """
    # TODO: 實作支出記錄刪除邏輯
    # 1. 檢查用戶權限（記錄創建者或 ADMIN 可刪除）
    # 2. 檢查支出記錄是否存在
    # 3. 刪除相關的分帳和付款記錄
    # 4. 刪除支出記錄
    # 5. 返回刪除成功訊息
    
    return {
        "message": f"Delete expense {expense_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.put("/{expense_id}/payment", response_model=dict)
async def update_payment_status(
    expense_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    更新付款狀態
    
    對應 legacy-project/src/app/api/transactions/[id]/payment/route.ts 的 PUT 方法
    
    Args:
        expense_id: 支出記錄 ID
        db: 資料庫會話
        
    Returns:
        dict: 更新後的付款狀態
        
    Raises:
        HTTPException: 支出記錄不存在或權限不足時拋出錯誤
    """
    # TODO: 實作付款狀態更新邏輯
    # 1. 檢查用戶權限（ADMIN 或 FINANCE_MANAGER 可操作）
    # 2. 設置 payment_status 為 PAID
    # 3. 記錄 paid_at 時間
    # 4. 返回更新後的狀態
    
    return {
        "message": f"Update expense {expense_id} payment status endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.get("/{expense_id}/splits", response_model=List[dict])
async def get_expense_splits(
    expense_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    獲取支出分帳記錄
    
    Args:
        expense_id: 支出記錄 ID
        db: 資料庫會話
        
    Returns:
        List[dict]: 分帳記錄列表
        
    Raises:
        HTTPException: 支出記錄不存在或權限不足時拋出錯誤
    """
    # TODO: 實作分帳記錄獲取邏輯
    # 1. 檢查支出記錄是否存在
    # 2. 檢查用戶權限
    # 3. 獲取所有分帳記錄
    # 4. 包含成員資訊
    # 5. 返回分帳記錄列表
    
    return [
        {
            "message": f"Get expense {expense_id} splits endpoint - TODO: implement",
            "status": "placeholder"
        }
    ]


@router.post("/{expense_id}/splits", response_model=dict)
async def create_expense_split(
    expense_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    創建支出分帳記錄
    
    Args:
        expense_id: 支出記錄 ID
        db: 資料庫會話
        
    Returns:
        dict: 創建的分帳記錄
        
    Raises:
        HTTPException: 支出記錄不存在或權限不足時拋出錯誤
    """
    # TODO: 實作分帳記錄創建邏輯
    # 1. 檢查支出記錄是否存在
    # 2. 檢查用戶權限
    # 3. 驗證分帳資料
    # 4. 計算分攤金額
    # 5. 創建分帳記錄
    # 6. 返回分帳記錄資訊
    
    return {
        "message": f"Create expense {expense_id} split endpoint - TODO: implement",
        "status": "placeholder"
    }
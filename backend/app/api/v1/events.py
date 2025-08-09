"""
活動管理 API 路由

基於 legacy-project/src/app/api/activities/ 的邏輯重新實作
在新架構中重命名為 events
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.event import Event, EventStatus, EDM

router = APIRouter()


@router.get("/", response_model=List[dict])
async def get_events(
    db: AsyncSession = Depends(get_db)
):
    """
    獲取活動列表
    
    對應 legacy-project/src/app/api/activities/route.ts 的 GET 方法
    
    Args:
        db: 資料庫會話
        
    Returns:
        List[dict]: 活動列表
    """
    # TODO: 實作活動列表獲取邏輯
    # 1. 從資料庫獲取所有活動
    # 2. 按 updated_at 降序排列
    # 3. 返回活動列表
    
    return [
        {
            "message": "Get events endpoint - TODO: implement",
            "status": "placeholder"
        }
    ]


@router.post("/", response_model=dict)
async def create_event(
    db: AsyncSession = Depends(get_db)
):
    """
    創建新活動
    
    對應 legacy-project/src/app/api/activities/route.ts 的 POST 方法
    
    Args:
        db: 資料庫會話
        
    Returns:
        dict: 創建的活動資訊
        
    Raises:
        HTTPException: 權限不足或創建失敗時拋出錯誤
    """
    # TODO: 實作活動創建邏輯
    # 1. 檢查當前用戶權限（僅 ADMIN 可創建）
    # 2. 驗證輸入資料（name, start_date, end_date 必填）
    # 3. 創建活動記錄
    # 4. 返回活動資訊
    
    return {
        "message": "Create event endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.get("/{event_id}", response_model=dict)
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    獲取特定活動資訊
    
    對應 legacy-project/src/app/api/activities/[id]/route.ts 的 GET 方法
    
    Args:
        event_id: 活動 ID
        db: 資料庫會話
        
    Returns:
        dict: 活動資訊
        
    Raises:
        HTTPException: 活動不存在時拋出 404 錯誤
    """
    # TODO: 實作單活動獲取邏輯
    # 1. 從資料庫獲取指定活動
    # 2. 檢查活動是否存在
    # 3. 返回活動資訊
    
    return {
        "message": f"Get event {event_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.put("/{event_id}", response_model=dict)
async def update_event(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    更新活動資訊
    
    對應 legacy-project/src/app/api/activities/[id]/route.ts 的 PUT 方法
    
    Args:
        event_id: 活動 ID
        db: 資料庫會話
        
    Returns:
        dict: 更新後的活動資訊
        
    Raises:
        HTTPException: 活動不存在或權限不足時拋出錯誤
    """
    # TODO: 實作活動更新邏輯
    # 1. 檢查當前用戶權限（僅 ADMIN 可修改）
    # 2. 驗證輸入資料
    # 3. 更新活動記錄
    # 4. 返回更新後的活動資訊
    
    return {
        "message": f"Update event {event_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.put("/{event_id}/toggle", response_model=dict)
async def toggle_event_status(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    切換活動啟用狀態
    
    對應 legacy-project/src/app/api/activities/[id]/toggle/route.ts 的 PUT 方法
    
    Args:
        event_id: 活動 ID
        db: 資料庫會話
        
    Returns:
        dict: 更新後的活動狀態
        
    Raises:
        HTTPException: 活動不存在或權限不足時拋出錯誤
    """
    # TODO: 實作活動狀態切換邏輯
    # 1. 檢查當前用戶權限（ADMIN 或 FINANCE_MANAGER 可操作）
    # 2. 切換 enabled 狀態
    # 3. 返回更新後的狀態
    
    return {
        "message": f"Toggle event {event_id} status endpoint - TODO: implement",
        "status": "placeholder"
    }


# EDM 相關端點
@router.get("/{event_id}/edm", response_model=dict)
async def get_event_edm(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    獲取活動 EDM 內容
    
    對應 legacy-project/src/app/api/activities/[id]/edm/route.ts 的 GET 方法
    
    Args:
        event_id: 活動 ID
        db: 資料庫會話
        
    Returns:
        dict: EDM 內容
        
    Raises:
        HTTPException: EDM 不存在時拋出 404 錯誤
    """
    # TODO: 實作 EDM 獲取邏輯
    # 1. 檢查活動是否存在
    # 2. 獲取關聯的 EDM
    # 3. 返回 EDM 內容
    
    return {
        "message": f"Get event {event_id} EDM endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.post("/{event_id}/edm", response_model=dict)
async def create_or_update_edm(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    創建或更新活動 EDM
    
    對應 legacy-project/src/app/api/activities/[id]/edm/route.ts 的 POST 方法
    
    Args:
        event_id: 活動 ID
        db: 資料庫會話
        
    Returns:
        dict: EDM 資訊
        
    Raises:
        HTTPException: 活動不存在或權限不足時拋出錯誤
    """
    # TODO: 實作 EDM 創建/更新邏輯
    # 1. 檢查當前用戶權限（僅 ADMIN 可操作）
    # 2. 驗證輸入資料
    # 3. 使用 upsert 操作（存在則更新，不存在則創建）
    # 4. 返回 EDM 資訊
    
    return {
        "message": f"Create/Update event {event_id} EDM endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.delete("/{event_id}/edm")
async def delete_edm(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    刪除活動 EDM
    
    對應 legacy-project/src/app/api/activities/[id]/edm/route.ts 的 DELETE 方法
    
    Args:
        event_id: 活動 ID
        db: 資料庫會話
        
    Returns:
        dict: 刪除成功訊息
        
    Raises:
        HTTPException: EDM 不存在或權限不足時拋出錯誤
    """
    # TODO: 實作 EDM 刪除邏輯
    # 1. 檢查當前用戶權限（僅 ADMIN 可刪除）
    # 2. 檢查 EDM 是否存在
    # 3. 刪除 EDM 記錄
    # 4. 返回刪除成功訊息
    
    return {
        "message": f"Delete event {event_id} EDM endpoint - TODO: implement",
        "status": "placeholder"
    }
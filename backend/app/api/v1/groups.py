"""
群組管理 API 路由

基於 legacy-project/src/app/api/groups/ 的邏輯重新實作
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.group import Group, GroupMember

router = APIRouter()


@router.get("/", response_model=List[dict])
async def get_user_groups(
    db: AsyncSession = Depends(get_db)
):
    """
    獲取用戶相關群組
    
    對應 legacy-project/src/app/api/groups/route.ts 的 GET 方法
    
    Args:
        db: 資料庫會話
        
    Returns:
        List[dict]: 用戶相關的群組列表
    """
    # TODO: 實作用戶群組獲取邏輯
    # 1. 獲取用戶創建的群組（isOwner: true）
    # 2. 獲取用戶參與的群組（isOwner: false）
    # 3. 包含成員數量統計
    # 4. 返回群組列表
    
    return [
        {
            "message": "Get user groups endpoint - TODO: implement",
            "status": "placeholder"
        }
    ]


@router.post("/", response_model=dict)
async def create_group(
    db: AsyncSession = Depends(get_db)
):
    """
    創建新群組
    
    對應 legacy-project/src/app/api/groups/route.ts 的 POST 方法
    
    Args:
        db: 資料庫會話
        
    Returns:
        dict: 創建的群組資訊
        
    Raises:
        HTTPException: 創建失敗時拋出錯誤
    """
    # TODO: 實作群組創建邏輯
    # 1. 驗證輸入資料（name 必填）
    # 2. 自動設定當前用戶為創建者
    # 3. 創建群組記錄
    # 4. 返回群組資訊
    
    return {
        "message": "Create group endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.get("/{group_id}", response_model=dict)
async def get_group(
    group_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    獲取群組詳情
    
    對應 legacy-project/src/app/api/groups/[id]/route.ts 的 GET 方法
    
    Args:
        group_id: 群組 ID
        db: 資料庫會話
        
    Returns:
        dict: 群組詳細資訊
        
    Raises:
        HTTPException: 群組不存在或權限不足時拋出錯誤
    """
    # TODO: 實作群組詳情獲取邏輯
    # 1. 檢查用戶權限（創建者或成員可查看）
    # 2. 包含成員、活動、創建者資訊
    # 3. 返回群組詳情
    
    return {
        "message": f"Get group {group_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.put("/{group_id}", response_model=dict)
async def update_group(
    group_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    更新群組資訊
    
    對應 legacy-project/src/app/api/groups/[id]/route.ts 的 PUT 方法
    
    Args:
        group_id: 群組 ID
        db: 資料庫會話
        
    Returns:
        dict: 更新後的群組資訊
        
    Raises:
        HTTPException: 群組不存在或權限不足時拋出錯誤
    """
    # TODO: 實作群組更新邏輯
    # 1. 檢查用戶權限（僅群組創建者可修改）
    # 2. 驗證輸入資料
    # 3. 更新群組記錄（name, description）
    # 4. 返回更新後的群組資訊
    
    return {
        "message": f"Update group {group_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.delete("/{group_id}")
async def delete_group(
    group_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    刪除群組
    
    對應 legacy-project/src/app/api/groups/[id]/route.ts 的 DELETE 方法
    
    Args:
        group_id: 群組 ID
        db: 資料庫會話
        
    Returns:
        dict: 刪除成功訊息
        
    Raises:
        HTTPException: 群組不存在或權限不足時拋出錯誤
    """
    # TODO: 實作群組刪除邏輯
    # 1. 檢查用戶權限（僅群組創建者可刪除）
    # 2. 檢查群組是否存在
    # 3. 級聯刪除相關成員記錄
    # 4. 刪除群組記錄
    # 5. 返回刪除成功訊息
    
    return {
        "message": f"Delete group {group_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


# 群組成員管理
@router.get("/{group_id}/members", response_model=List[dict])
async def get_group_members(
    group_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    獲取群組成員列表
    
    對應 legacy-project/src/app/api/groups/[id]/members/route.ts 的 GET 方法
    
    Args:
        group_id: 群組 ID
        db: 資料庫會話
        
    Returns:
        List[dict]: 群組成員列表
        
    Raises:
        HTTPException: 群組不存在或權限不足時拋出錯誤
    """
    # TODO: 實作群組成員列表獲取邏輯
    # 1. 檢查用戶權限（僅群組創建者可查看）
    # 2. 獲取所有群組成員
    # 3. 包含用戶關聯資訊
    # 4. 返回成員列表
    
    return [
        {
            "message": f"Get group {group_id} members endpoint - TODO: implement",
            "status": "placeholder"
        }
    ]


@router.post("/{group_id}/members", response_model=dict)
async def add_group_member(
    group_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    添加群組成員
    
    對應 legacy-project/src/app/api/groups/[id]/members/route.ts 的 POST 方法
    
    Args:
        group_id: 群組 ID
        db: 資料庫會話
        
    Returns:
        dict: 添加的成員資訊
        
    Raises:
        HTTPException: 群組不存在或權限不足時拋出錯誤
    """
    # TODO: 實作群組成員添加邏輯
    # 1. 檢查用戶權限（僅群組創建者可添加）
    # 2. 支援兩種模式：
    #    - 關聯現有用戶（提供 userId）
    #    - 僅記錄姓名（不提供 userId）
    # 3. 創建成員記錄
    # 4. 返回成員資訊
    
    return {
        "message": f"Add member to group {group_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.put("/{group_id}/members/{member_id}", response_model=dict)
async def update_group_member(
    group_id: str,
    member_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    更新群組成員資訊
    
    對應 legacy-project/src/app/api/groups/[id]/members/[memberId]/route.ts 的 PUT 方法
    
    Args:
        group_id: 群組 ID
        member_id: 成員 ID
        db: 資料庫會話
        
    Returns:
        dict: 更新後的成員資訊
        
    Raises:
        HTTPException: 成員不存在或權限不足時拋出錯誤
    """
    # TODO: 實作群組成員更新邏輯
    # 1. 檢查用戶權限（僅群組創建者可修改）
    # 2. 驗證輸入資料
    # 3. 更新成員資訊（name, userId）
    # 4. 支援清除用戶關聯功能
    # 5. 返回更新後的成員資訊
    
    return {
        "message": f"Update member {member_id} in group {group_id} endpoint - TODO: implement",
        "status": "placeholder"
    }


@router.delete("/{group_id}/members/{member_id}")
async def remove_group_member(
    group_id: str,
    member_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    移除群組成員
    
    對應 legacy-project/src/app/api/groups/[id]/members/[memberId]/route.ts 的 DELETE 方法
    
    Args:
        group_id: 群組 ID
        member_id: 成員 ID
        db: 資料庫會話
        
    Returns:
        dict: 移除成功訊息
        
    Raises:
        HTTPException: 成員不存在或權限不足時拋出錯誤
    """
    # TODO: 實作群組成員移除邏輯
    # 1. 檢查用戶權限（僅群組創建者可移除）
    # 2. 檢查成員是否存在
    # 3. 檢查成員是否有相關的分帳記錄
    # 4. 刪除成員記錄
    # 5. 返回移除成功訊息
    
    return {
        "message": f"Remove member {member_id} from group {group_id} endpoint - TODO: implement",
        "status": "placeholder"
    }
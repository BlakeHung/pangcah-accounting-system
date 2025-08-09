# 活動API權限欄位說明

## Event API Response 權限相關欄位

### 1. `is_user_manager` (boolean)
- **說明**：當前用戶是否為此活動的管理者
- **計算邏輯**：
  - 如果用戶是超級管理員 (ADMIN)，返回 `true`
  - 如果用戶在活動的 `managers` 列表中，返回 `true`
  - 其他情況返回 `false`
- **用途**：前端根據此欄位決定是否顯示「編輯」按鈕

### 2. `can_user_view_finances` (boolean)
- **說明**：當前用戶是否可以查看此活動的財務狀況
- **計算邏輯**：
  - 如果用戶是超級管理員 (ADMIN)，返回 `true`
  - 如果用戶在活動的 `managers` 列表中，返回 `true`
  - 如果用戶是活動所屬群組的管理者，返回 `true`
  - 其他情況返回 `false`
- **用途**：前端根據此欄位決定是否顯示財務報表和統計資訊

### 3. `is_user_participant` (boolean)
- **說明**：當前用戶是否為此活動的參與者
- **計算邏輯**：檢查用戶是否在 `participants` 列表中且狀態為 `is_active=true`
- **用途**：決定用戶是否可以在活動中新增支出

## API Response 範例

```json
{
  "id": 6,
  "name": "週末聚餐 - 測試分帳",
  "description": "測試分帳功能的家庭聚餐活動",
  "group": 1,
  "group_name": "核心家庭",
  "managers": [
    {
      "id": 1,
      "username": "admin",
      "name": "Admin"
    }
  ],
  "is_user_manager": false,
  "can_user_view_finances": true,
  "is_user_participant": true,
  "allow_split": true,
  "status": "ACTIVE",
  "enabled": true,
  // ... 其他欄位
}
```

## 權限檢查 API Endpoints

### 1. 更新活動 (PUT/PATCH)
- **端點**：`/api/v1/events/{id}/`
- **權限檢查**：必須 `is_user_manager = true`
- **錯誤回應**：
  ```json
  {
    "error": "您沒有權限編輯此活動"
  }
  ```
  HTTP Status: 403 Forbidden

### 2. 查看活動財務報表
- **端點**：`/api/v1/events/{id}/financial-report/` (如果實作)
- **權限檢查**：必須 `can_user_view_finances = true`
- **錯誤回應**：
  ```json
  {
    "error": "您沒有權限查看此活動的財務資訊"
  }
  ```
  HTTP Status: 403 Forbidden

### 3. 新增支出到活動
- **端點**：`/api/v1/expenses/`
- **權限檢查**：
  - 如果活動已鎖定 (`is_locked = true`)，必須 `is_user_manager = true`
  - 否則必須 `is_user_participant = true`

## 前端使用建議

### 1. 活動列表頁面
```typescript
// 根據權限顯示不同的操作按鈕
{activity.is_user_manager && (
  <button onClick={handleEdit}>編輯活動</button>
)}

{activity.can_user_view_finances && (
  <button onClick={handleViewFinances}>查看財務報表</button>
)}
```

### 2. 活動詳情頁面
```typescript
// 在載入活動後檢查權限
useEffect(() => {
  if (activity && !activity.is_user_manager && requiresEditPermission) {
    navigate('/activities')
  }
}, [activity])
```

### 3. 新增支出頁面
```typescript
// 檢查是否可以為活動新增支出
const canAddExpense = activity.is_user_participant || activity.is_user_manager
```

## 注意事項

1. **權限欄位是動態的**：根據當前登入用戶計算，不同用戶看到的值會不同
2. **前端應該信任後端**：不要在前端硬編碼權限邏輯
3. **權限變更即時生效**：如果用戶權限被變更，下次API請求就會反映新的權限
4. **群組管理者特殊性**：群組管理者可以查看財務但不能編輯活動，這是業務設計
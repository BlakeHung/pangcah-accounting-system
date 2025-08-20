# Pangcah Accounting System - Claude Code 開發筆記

## 系統架構概覽

### 後端 (Django)
- **位置**: `/backend-django`
- **技術棧**: Django 5.0, Django REST Framework, Django Channels
- **資料庫**: PostgreSQL (Railway)
- **部署**: Railway.app

### 前端 (React)
- **位置**: `/frontend`
- **技術棧**: React 18, TypeScript, Vite, TailwindCSS, D3.js
- **部署**: Vercel

## 重要變更記錄

### 2025-08-20: WebSocket 功能暫時禁用

#### 問題背景
Railway Free Tier 資源限制導致 WebSocket 連接失敗：
- 錯誤訊息: "Insufficient resources"
- 原因: Free Tier 只有 512MB RAM 和 0.5 vCPU

#### 解決方案
1. **前端**: 禁用 WebSocket 連接，改用靜態資料展示
   - 檔案: `frontend/src/components/Realtime/RealtimeDashboard.tsx`
   - 顯示「功能維護中」提示
   - 使用範例資料展示介面

2. **後端**: 改用基本 HTTP 服務器
   - 檔案: `backend-django/Procfile`
   - 使用 `start_basic.sh` 替代 `start.sh`
   - 移除 WebSocket worker 配置

#### 恢復 WebSocket 功能的步驟
當升級到付費方案或資源問題解決後：

1. **後端恢復**:
   ```bash
   # 修改 Procfile
   web: bash start.sh
   ```

2. **前端恢復**:
   - 還原 `RealtimeDashboard.tsx` 到使用 `useRealtimeData` hook
   - 移除「功能維護中」提示

3. **環境變數**:
   - 確保 `REDIS_URL` 正確設置
   - 確保 `VITE_WS_URL` 指向正確的 WebSocket 端點

### TypeScript 類型修復 (2025-08-20)

修復了 78 個 TypeScript 編譯錯誤：
- **D3 圖表組件**: NetworkGraph, SankeyDiagram, TreemapChart
- **報表組件**: CustomReportBuilder, ReportPreview
- **Layout 組件**: 將 user prop 改為可選

### Phase 3 實作完成 (2025-08-20)

實作了完整的資料視覺化基礎設施：
- **Dashboard App**: 儀表板配置管理
- **Reports App**: 報表生成與管理
- **Monitoring App**: 系統監控與警報

## 常用命令

### 後端
```bash
cd backend-django

# 本地開發
python manage.py runserver

# 資料庫遷移
python manage.py makemigrations
python manage.py migrate

# 創建超級用戶
python manage.py createsuperuser
```

### 前端
```bash
cd frontend

# 開發模式
npm run dev

# 建構
npm run build

# 類型檢查
npm run type-check
```

## 環境變數

### 後端 (.env)
```
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
DEBUG=False
```

### 前端 (.env)
```
VITE_API_URL=https://your-api.railway.app
VITE_WS_URL=wss://your-api.railway.app/ws/realtime-stats
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
```

## 待辦事項

- [ ] 升級 Railway 到付費方案以啟用 WebSocket
- [ ] 實作 HTTP 長輪詢作為 WebSocket 的備用方案
- [ ] 優化前端 bundle 大小（目前 1.68MB）
- [ ] 實作使用者認證整合
- [ ] 完成報表匯出功能

## 故障排除

### WebSocket 連接失敗
1. 檢查 Railway 資源使用情況
2. 確認 Redis 服務正常運行
3. 檢查 CORS 設置
4. 驗證 WebSocket URL 格式

### 資料庫連接問題
1. 檢查 DATABASE_URL 環境變數
2. 確認 Railway PostgreSQL 服務狀態
3. 檢查資料庫遷移狀態

### 前端建構錯誤
1. 執行 `npm run type-check` 檢查類型錯誤
2. 清除 node_modules 並重新安裝
3. 檢查環境變數設置

## 聯絡資訊

如有問題請聯繫開發團隊或查看 GitHub Issues。
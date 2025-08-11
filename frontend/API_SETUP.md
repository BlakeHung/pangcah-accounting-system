# 前端 API 配置說明

## 🚀 快速開始

前端現已配置為連接雲端 Railway API，可以直接開始本地開發：

```bash
npm run dev
```

## 🔧 API 配置選項

### 方法一：使用 Vite Proxy（當前配置）
`vite.config.ts` 已配置 proxy 直接轉發到 Railway：
```typescript
proxy: {
  '/api': {
    target: 'https://pangcah-accounting-system-production.up.railway.app',
    changeOrigin: true,
    secure: true,
  },
}
```

### 方法二：環境變數配置
創建 `.env.local` 檔案：
```env
# 連接雲端 API
VITE_API_BASE_URL=https://pangcah-accounting-system-production.up.railway.app

# 或連接本地 API  
# VITE_API_BASE_URL=http://localhost:8000
```

## 📋 測試帳號

### 系統管理員
- 用戶名：`admin`
- 密碼：`admin123`

### 阿美族用戶範例
- 用戶名：`cilangasan_奶奶_芭娜`
- 密碼：`amis123`

## 🎯 可用的 API 資料

雲端 Railway API 已包含完整測試資料：
- ✅ 177 個阿美族用戶（六大家族三代）
- ✅ 23 筆支出記錄（含費用分攤）
- ✅ 季節性文化活動（播種祭、豐年祭、收穫祭）
- ✅ 10 個文化相關支出分類
- ✅ 完整的群組和權限管理

## 🔍 API 端點

- **Base URL**: `https://pangcah-accounting-system-production.up.railway.app`
- **API 文檔**: `/api/docs/` 和 `/api/redoc/`
- **登入**: `POST /api/v1/auth/users/login/`
- **用戶資料**: `GET /api/v1/auth/users/me/`

## 💡 開發建議

1. **專注前端開發**：所有後端功能都已準備完成
2. **使用真實資料**：可用阿美族社群資料測試 UI
3. **文化特色設計**：考慮融入原住民文化元素
4. **響應式設計**：考慮手機使用場景

## 🔄 切換 API 來源

### 連接雲端 API（當前）
```bash
# 保持 vite.config.ts 現有配置
npm run dev
```

### 切換到本地 API
```bash
# 1. 修改 vite.config.ts 的 target 為 'http://localhost:8000'
# 2. 確保本地後端運行在 8000 port
# 3. 重啟前端
npm run dev
```

現在可以安心進行前端界面開發了！🎨
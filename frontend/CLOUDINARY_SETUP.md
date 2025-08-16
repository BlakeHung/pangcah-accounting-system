# Cloudinary 設定指南

## 快速開始

### 1. 註冊 Cloudinary 帳號

1. 訪問 [Cloudinary 註冊頁面](https://cloudinary.com/users/register/free)
2. 使用 Email 或 Google 帳號註冊
3. 選擇免費方案（25GB 儲存空間 + 25GB 月流量）

### 2. 取得 API 憑證

登入後，在 Dashboard 頁面可以看到：

- **Cloud Name**: 您的唯一識別碼（例如：`pangcah`）
- **API Key**: 公開金鑰
- **API Secret**: 私密金鑰（後端使用，前端不需要）

### 3. 建立 Upload Preset（重要！）

1. 進入 **Settings** → **Upload**
2. 點擊 **Upload presets** 標籤
3. 點擊 **Add upload preset**
4. 設定：
   - **Preset name**: `pangcah_unsigned`（或您喜歡的名稱）
   - **Signing Mode**: 選擇 **Unsigned**（允許前端直接上傳）
   - **Folder**: `pangcah-accounting`（自動整理圖片）
5. 在 **Upload Control** 區塊設定：
   - **Max file size**: 10485760（10MB）
   - **Allowed formats**: jpg, png, gif, pdf, webp
6. 點擊 **Save**

### 4. 設定環境變數

在 `frontend` 目錄建立 `.env` 檔案：

```env
# Cloudinary 設定
VITE_CLOUDINARY_CLOUD_NAME=您的_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=pangcah_unsigned
```

### 5. 重啟開發伺服器

```bash
npm run dev
```

## 功能特色

### 自動優化
- 圖片自動壓縮（quality: auto）
- 格式自動轉換（format: auto）
- 尺寸限制（最大寬度 2000px）

### 縮圖生成
- 列表顯示使用 200x200 縮圖
- 減少頻寬使用
- 加快載入速度

### 批次上傳
- 支援同時上傳多張圖片
- 顯示上傳進度
- 檔案大小限制（10MB）

## 免費方案限制

- **儲存空間**: 25GB
- **月流量**: 25GB
- **圖片處理**: 25,000 次/月
- **影片處理**: 無

對於小型專案，免費方案通常足夠使用。

## 升級選項

當免費額度不足時，可考慮：

1. **Plus 方案** (USD $89/月)
   - 225GB 儲存空間
   - 225GB 月流量
   - 225,000 次圖片處理

2. **Advanced 方案** (USD $224/月)
   - 600GB 儲存空間  
   - 600GB 月流量
   - 600,000 次圖片處理

## 常見問題

### Q: 如何查看使用量？
A: 登入 Cloudinary Dashboard，在首頁就能看到當月使用量統計。

### Q: 圖片會永久保存嗎？
A: 是的，除非您手動刪除，圖片會永久保存在 Cloudinary。

### Q: 可以設定自動刪除舊圖片嗎？
A: 可以使用 Upload Preset 的 "Auto backup" 和 "Auto delete" 功能設定保留期限。

### Q: 如何優化成本？
A: 
- 使用自動格式轉換（WebP 比 JPG 小 30%）
- 設定合理的圖片尺寸上限
- 定期清理不需要的圖片

## 技術支援

- [Cloudinary 文件](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [圖片優化最佳實踐](https://cloudinary.com/documentation/image_optimization)

## 安全建議

1. **永遠不要**將 API Secret 放在前端程式碼中
2. 使用 Unsigned Upload Preset 時，設定合理的限制
3. 定期檢查異常上傳活動
4. 考慮實作後端驗證層（生產環境）
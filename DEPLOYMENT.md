# 🚀 阿美族家族記帳系統 - 部署指南

## 📋 部署架構

### Phase 1: 基礎部署 (Vercel + Railway)
- **前端**: Vercel (React + Vite)
- **後端**: Railway (Django + PostgreSQL)
- **資料庫**: Railway PostgreSQL
- **靜態檔案**: WhiteNoise

### Phase 2: 進階部署 (待開發)
- **CDN**: AWS CloudFront / Vercel Edge Network
- **檔案儲存**: AWS S3
- **快取**: Redis
- **監控**: Sentry + Analytics

## 🏗️ Phase 1 部署步驟

### 1. 前端部署到 Vercel

#### 1.1 準備工作
```bash
# 確認前端可以正常建置
cd new-project/frontend
npm install
npm run build
```

#### 1.2 Vercel 部署
1. **登入 Vercel**
   - 前往 [vercel.com](https://vercel.com)
   - 使用 GitHub 帳號登入

2. **匯入專案**
   - 點擊 "Import Project"
   - 選擇 GitHub repository
   - 選擇 `new-project/frontend` 目錄

3. **環境變數設定**
   ```
   VITE_API_BASE_URL = https://your-railway-backend.up.railway.app
   ```

4. **部署設定**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

#### 1.3 自訂網域 (可選)
```
# 在 Vercel Dashboard 中設定
Domain: family-finance.your-domain.com
```

### 2. 後端部署到 Railway

#### 2.1 準備工作
```bash
# 確認後端可以正常啟動
cd new-project/backend-django
source venv/bin/activate
python manage.py check
python manage.py collectstatic --dry-run
```

#### 2.2 Railway 部署
1. **登入 Railway**
   - 前往 [railway.app](https://railway.app)
   - 使用 GitHub 帳號登入

2. **創建新專案**
   - 點擊 "New Project"
   - 選擇 "Deploy from GitHub repo"
   - 選擇你的 repository

3. **設定根目錄**
   ```
   Root Directory: new-project/backend-django
   ```

4. **PostgreSQL 資料庫**
   - 在專案中點擊 "Add Service"
   - 選擇 "PostgreSQL"
   - Railway 會自動創建資料庫並提供連線資訊

#### 2.3 環境變數設定
在 Railway Dashboard 中設定以下環境變數：

```bash
# Django 設定
DJANGO_SETTINGS_MODULE=family_finance.settings.production
DJANGO_SECRET_KEY=your-super-secret-key-here

# 資料庫連線 (Railway 自動提供)
PGDATABASE=${{Postgres.PGDATABASE}}
PGUSER=${{Postgres.PGUSER}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
PGHOST=${{Postgres.PGHOST}}
PGPORT=${{Postgres.PGPORT}}

# CORS 設定
ALLOWED_HOST=your-railway-domain.up.railway.app
FRONTEND_URL=https://your-vercel-frontend.vercel.app
```

#### 2.4 初始化資料庫
部署完成後，在 Railway Console 中執行：
```bash
python manage.py migrate
python manage.py createsuperuser
python create_test_scenarios.py  # 創建測試資料
```

### 3. 網域和 HTTPS 設定

#### 3.1 後端網域
```bash
# Railway 提供的預設網域
https://your-app-name-production.up.railway.app

# 或設定自訂網域
api.your-domain.com
```

#### 3.2 前端網域
```bash
# Vercel 提供的預設網域
https://your-app-name.vercel.app

# 或設定自訂網域
your-domain.com
```

### 4. 環境變數更新

#### 4.1 更新前端環境變數
在 Vercel Dashboard 中更新：
```
VITE_API_BASE_URL = https://your-actual-railway-domain.up.railway.app
```

#### 4.2 更新後端 CORS 設定
在 Railway 中更新：
```
FRONTEND_URL = https://your-actual-vercel-domain.vercel.app
```

## 🔧 部署後檢查清單

### ✅ 基本功能測試
- [ ] 前端可以正常載入
- [ ] 後端 API 可以存取 (`/api/docs/`)
- [ ] 登入功能正常
- [ ] 資料庫連線成功
- [ ] 靜態檔案載入正常

### ✅ 完整功能測試
- [ ] 用戶註冊和登入
- [ ] 群組管理功能
- [ ] 活動創建和管理
- [ ] 支出記錄和分攤
- [ ] 權限控制正確
- [ ] 跨群組邀請功能

### ✅ 效能和安全性
- [ ] HTTPS 強制重定向
- [ ] CORS 設定正確
- [ ] 靜態檔案壓縮
- [ ] 資料庫索引優化
- [ ] 日誌記錄正常

## 🚨 常見問題排解

### 1. 前端無法連接後端
```bash
# 檢查 CORS 設定
- Railway 中的 FRONTEND_URL 是否正確
- 前端的 VITE_API_BASE_URL 是否正確
- Railway 後端是否正常運行
```

### 2. 資料庫連線失敗
```bash
# 檢查環境變數
echo $PGHOST
echo $PGDATABASE

# 檢查網路連線
pg_isready -h $PGHOST -p $PGPORT
```

### 3. 靜態檔案載入失敗
```bash
# 檢查 WhiteNoise 設定
python manage.py collectstatic --noinput

# 檢查檔案權限
ls -la staticfiles/
```

### 4. Railway 部署失敗
```bash
# 檢查 requirements.txt
pip freeze > requirements.txt

# 檢查 Python 版本
python --version

# 查看部署日誌
# 在 Railway Dashboard 中查看 Deployments 頁面
```

## 📊 監控和維護

### 1. 日誌監控
```bash
# Railway 中查看應用日誌
# Dashboard > Deployments > View Logs

# 重要日誌項目
- HTTP requests and responses
- Database queries
- Error messages
- Performance metrics
```

### 2. 資料庫備份
```bash
# Railway 會自動備份 PostgreSQL
# 可在 Database 頁面查看備份狀態

# 手動匯出資料
python manage.py dumpdata > backup.json
```

### 3. 效能監控
```bash
# 使用 Railway 內建監控
- CPU 使用率
- Memory 使用率
- Database 連線數
- Response time
```

## 🔄 持續部署 (CI/CD)

### GitHub Actions 設定 (可選)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

## 🎯 下一步規劃

### Phase 2 升級選項
1. **效能優化**
   - CDN 設定 (CloudFlare)
   - Redis 快取層
   - 資料庫讀寫分離

2. **進階功能**
   - 檔案上傳 (AWS S3)
   - 即時通知 (WebSocket)
   - 郵件服務 (SendGrid)

3. **監控和分析**
   - Sentry 錯誤追蹤
   - Google Analytics
   - 效能監控 (New Relic)

## 📞 技術支援

### 部署相關問題
- **Vercel 文件**: https://vercel.com/docs
- **Railway 文件**: https://docs.railway.app
- **Django 部署**: https://docs.djangoproject.com/en/5.0/howto/deployment/

### 緊急聯絡
- 技術負責人: Blake Hung
- Email: blake@wchung.tw
- 專案 GitHub: https://github.com/your-username/family-finance

---

**🎉 部署成功後，你的阿美族家族記帳系統就可以正式上線使用了！**
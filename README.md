# 🏠 阿美族家族記帳系統

> 從 Next.js 全棧轉換為 React + Django + AI 架構的現代化家族財務管理系統

## 🚀 快速開始

### 系統啟動（3個終端）

#### 終端1 - 啟動資料庫
```bash
cd new-project/backend-django
docker-compose up -d
```

#### 終端2 - 啟動後端
```bash
cd new-project/backend-django
source venv/bin/activate
python manage.py runserver
```

#### 終端3 - 啟動前端
```bash
cd new-project/frontend
npm start
```

### 初始設置（僅首次需要）

#### 1. 後端環境設置
```bash
cd new-project/backend-django

# 創建虛擬環境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安裝依賴
pip install -r requirements.txt

# 環境配置
cp .env.example .env
# 編輯 .env 文件設置資料庫等配置

# 資料庫遷移（確保 Docker PostgreSQL 已啟動）
python manage.py makemigrations
python manage.py migrate

# 創建管理員帳戶 (預設 admin/admin)
python manage.py createsuperuser

# 創建完整測試資料（推薦）
python create_test_scenarios.py

# 或創建簡單示範資料
python create_sample_data.py
```

#### 2. 前端環境設置
```bash
cd new-project/frontend

# 安裝依賴
npm install
```

## 🌐 訪問地址

- **前端**: http://localhost:3000
  - 登入頁面: `/login`
  - 主儀表板: `/dashboard`
  - 群組管理: `/groups`
  - 用戶管理: `/users`
  - 支出記錄: `/transactions`
  - 活動管理: `/activities`
  - 分類管理: `/categories`
  - 系統設定: `/settings`
- **後端 API**: http://localhost:8000
- **API 文檔**: http://localhost:8000/api/docs/
- **Django 管理後台**: http://localhost:8000/admin/

## 🔑 測試帳戶

### 完整測試場景帳戶（執行 create_test_scenarios.py 後）
所有密碼都是：`password123`

| 用戶名 | 角色 | 管理群組 | 測試重點 |
|--------|------|----------|---------|
| admin | 超級管理員 | 所有 | 最高權限 |
| alice | 媽媽 | 核心家庭 | 群組管理者權限 |
| bob | 爸爸 | 無 | 一般參與者 |
| charlie | 大兒子 | 年輕人小組 | 群組管理者權限 |
| diana | 小女兒 | 無 | 一般用戶 |
| edward | 爺爺 | 大家庭聚會 | 特殊權限測試 |
| fiona | 奶奶 | 無 | 長輩用戶 |
| george | 叔叔 | 無 | 一般用戶 |

## 📁 專案架構

```
new-project/
├── backend-django/          # Django 後端
│   ├── family_finance/     # Django 專案設定
│   ├── apps/               # Django 應用模組
│   │   ├── users/         # 用戶管理
│   │   ├── categories/    # 分類管理
│   │   ├── events/        # 活動管理（含參與者、記錄）
│   │   ├── expenses/      # 支出記錄（含分攤）
│   │   └── groups/        # 群組管理
│   ├── requirements.txt   # Python 依賴
│   ├── docker-compose.yml # Docker 編排
│   ├── create_test_scenarios.py # 完整測試資料腳本
│   └── *.md              # 各種文檔
├── frontend/              # React 前端
│   ├── src/              # 源碼
│   │   ├── pages/       # 頁面組件
│   │   ├── components/  # 共用組件
│   │   └── contexts/    # Context Providers
│   └── package.json      # Node.js 依賴
└── shared/               # 共用類型定義
```

## 🛠️ 技術棧

### 後端
- **Django 5.0** - Python Web 框架
- **Django REST Framework** - API 開發
- **PostgreSQL** - 關聯式資料庫
- **JWT** - 身份驗證（simplejwt）
- **Docker** - 容器化部署

### 前端
- **React 18** - 前端框架
- **TypeScript** - 類型安全
- **Vite** - 建構工具
- **React Query (@tanstack/react-query)** - 數據獲取和狀態管理
- **React Router** - 路由管理
- **Axios** - HTTP 客戶端
- **Recharts** - 數據視覺化圖表庫（現有）
- **ECharts** - 進階互動式圖表（規劃中）

## 🔐 權限系統

### 角色層級
1. **ADMIN（超級管理員）**
   - 所有系統權限
   - 可管理所有群組和活動
   
2. **群組管理者**
   - 通過 `managed_groups` 判斷（非獨立角色）
   - 可創建活動
   - 可管理自己的群組
   
3. **活動管理者**
   - 可編輯活動資訊
   - 可在已結束活動新增支出
   - 可以是非參與者（如 ADMIN）
   
4. **一般用戶**
   - 只能參與活動
   - 在進行中活動可新增支出

### 權限矩陣

| 功能 | ADMIN | 群組管理者 | 活動管理者 | 一般用戶 |
|------|-------|-----------|-----------|---------|
| 創建群組 | ✅ | ❌ | ❌ | ❌ |
| 創建活動 | ✅ | ✅ | ❌ | ❌ |
| 編輯活動 | ✅ | ❌ | ✅ | ❌ |
| 新增支出（進行中） | ✅ | ✅* | ✅* | ✅* |
| 新增支出（已結束） | ✅ | ❌ | ✅ | ❌ |

*需要是活動參與者

## 📊 已完成功能

### ✅ 後端完成項目
- [x] **基礎架構**
  - Django 專案基礎架構
  - Docker 容器化配置
  - JWT 身份驗證系統
  - API 文檔生成

- [x] **資料模型**
  - 用戶管理模型（支援 ADMIN/USER 角色）
  - 群組管理模型（支援管理者設定）
  - 活動管理模型（Event, ActivityParticipant, ActivityLog）
  - 支出記錄模型（Expense, ExpenseSplit）
  - 分類管理模型

- [x] **API 端點**
  - `/api/v1/auth/` - 認證系統（登入、登出、刷新）
  - `/api/v1/auth/users/` - 用戶管理（含 /me 端點）
  - `/api/v1/groups/` - 群組 CRUD
  - `/api/v1/categories/` - 分類 CRUD
  - `/api/v1/events/` - 活動管理（含特殊操作）
  - `/api/v1/expenses/` - 支出記錄和分攤

- [x] **業務邏輯**
  - 活動參與者管理（加入、離開、分攤選項）
  - 費用分攤計算（平均、比例、固定金額）
  - 活動管理者權限控制
  - 群組管理者判斷邏輯
  - 已結束活動支出權限控制
  - 跨群組活動邀請功能

### ✅ 前端完成項目
- [x] **基礎架構**
  - React + TypeScript 設置
  - React Query 狀態管理
  - React Router 路由配置
  - Axios 攔截器和認證處理
  - Snackbar 通知系統

- [x] **核心頁面**
  - 登入頁面（JWT 認證）
  - 主儀表板（實時數據展示）
  - 群組管理（CRUD + 成員管理）
  - 用戶管理（列表 + 詳情）
  - 分類管理（收支分類）
  - 系統設定（個人資料、偏好設定）

- [x] **活動管理**
  - 活動列表（狀態篩選、權限控制）
  - 新增活動（群組管理者權限檢查）
  - 活動編輯（管理者權限）
  - 活動詳情（ActivityManager）
  - 參與者管理（邀請、移除、升級管理者）

- [x] **支出管理**
  - 支出列表（篩選、搜索、統計）
  - 新增支出（權限控制、分攤設定）
  - 支出詳情（編輯、刪除）
  - 分攤功能（平均、比例、固定金額）

- [x] **UI/UX 優化**
  - 響應式設計（手機端適配）
  - 共用 Layout 組件
  - 載入狀態和錯誤處理
  - 表單驗證和提示
  - 權限控制 UI 提示

### ✅ 權限修復和優化
- [x] 修復群組管理者新增活動權限
- [x] 修復 `/api/v1/auth/users/me/` 返回 managed_groups
- [x] 修復活動管理者可以是非參與者
- [x] 修復已結束活動的支出新增權限
- [x] 移除不必要的支出審批狀態欄位

### ✅ 測試資料和文檔
- [x] 完整測試場景資料腳本
- [x] 活動權限管理文檔
- [x] 群組權限管理說明
- [x] 新增活動權限修復指南
- [x] 完整測試情境指南

## 🚧 進行中和待開發

### 🎯 進行中功能
- [ ] **數據視覺化增強** 📊 [詳細規劃](DATA_VISUALIZATION_ROADMAP.md)
  - ✅ 基礎圖表已完成（Recharts）
  - 🚧 整合 ECharts 提升互動性
  - 🚧 即時資料更新機制
  - 📅 進階視覺化（熱力圖、網絡圖）
  - 📅 自定義報表生成器

### 待開發功能
  
- [ ] **進階功能**
  - 活動結算功能
  - 匯出報表（Excel/PDF）
  - 實時通知系統
  - 檔案上傳（收據圖片）
  
- [ ] **AI 功能**
  - 收據 OCR 識別
  - 智能分類建議
  - 消費模式分析

- [ ] **部署準備**
  - 生產環境配置
  - CI/CD 流程
  - 效能優化

## 🧪 測試指南

### 執行測試場景
```bash
# 建立完整測試資料
cd backend-django
source venv/bin/activate
python create_test_scenarios.py
```

### 關鍵測試點
1. **權限測試**
   - 不同用戶看到「新增活動」按鈕
   - 已結束活動的支出新增限制
   - 管理者非參與者的特殊情境

2. **分攤測試**
   - 平均分攤計算正確性
   - 比例分攤計算正確性
   - 跨群組成員分攤

3. **業務邏輯**
   - 活動生命週期管理
   - 參與者加入和離開
   - 管理者權限變更

詳細測試步驟請參考：[完整測試情境指南](backend-django/完整測試情境指南.md)

## 🔧 開發工具

### 後端開發
```bash
# 資料庫遷移
python manage.py makemigrations
python manage.py migrate

# 創建測試資料
python create_test_scenarios.py

# Django Shell
python manage.py shell

# 執行測試
python manage.py test
```

### 前端開發
```bash
# 啟動開發服務器
npm start

# 建置生產版本
npm run build

# 代碼檢查
npm run lint
```

## 📚 相關文檔

### 業務文檔
- [業務規則文檔](.claude/business_rules.md)
- [活動權限管理文檔](backend-django/活動權限管理文檔.md)
- [群組權限管理說明](backend-django/群組權限管理說明.md)

### 技術文檔
- [開發指導原則](.claude/instruction.md)
- [專案背景與架構](.claude/context.md)
- [新增活動權限修復指南](backend-django/新增活動權限修復指南.md)
- [數據視覺化發展規劃](DATA_VISUALIZATION_ROADMAP.md) 📊

### 測試文檔
- [完整測試情境指南](backend-django/完整測試情境指南.md)
- [分帳功能測試指南](backend-django/分帳功能測試指南.md)

## 🤝 開發流程

1. **需求分析**: 查看業務規則文檔
2. **參考實作**: 查看 `legacy-project/` 了解原有實作
3. **後端開發**: 實作 Models → Serializers → Views → URLs
4. **前端開發**: 實作 Pages → Components → API Integration
5. **測試驗證**: 使用測試資料驗證功能
6. **文檔更新**: 更新相關文檔

## 📞 聯絡資訊

如有問題或建議，請通過以下方式聯絡：
- 專案維護者: Blake Hung
- Email: blake@wchung.tw

---

**🎯 目標**: 打造現代化、智能化的家族財務管理系統，幫助阿美族家族更好地管理財務和活動！

**📅 最後更新**: 2025-08-08 - 完成權限系統修復和測試場景建立
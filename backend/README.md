# Family Finance Backend API

阿美族家族記帳系統後端 API，使用 Python FastAPI 框架開發。

## 技術棧

- **框架**: FastAPI
- **資料庫**: PostgreSQL + SQLAlchemy
- **身份驗證**: JWT + Passport
- **API 文檔**: Swagger/OpenAPI
- **部署**: Docker Ready

## 項目結構

```
backend/
├── app/
│   ├── api/
│   │   └── v1/           # API v1 路由
│   │       ├── auth.py   # 身份驗證
│   │       ├── users.py  # 用戶管理
│   │       ├── events.py # 活動管理
│   │       ├── expenses.py # 支出記錄
│   │       ├── categories.py # 分類管理
│   │       └── groups.py # 群組管理
│   ├── core/             # 核心配置
│   │   ├── config.py     # 應用程序配置
│   │   └── database.py   # 資料庫配置
│   ├── models/           # 數據模型
│   │   ├── user.py       # 用戶模型
│   │   ├── category.py   # 分類模型
│   │   ├── event.py      # 活動模型
│   │   ├── expense.py    # 支出模型
│   │   └── group.py      # 群組模型
│   └── main.py           # 應用程序入口
├── requirements.txt      # 依賴列表
├── .env.example         # 環境變數範例
└── README.md           # 此文件
```

## 開發設置

### 1. 安裝依賴

```bash
# 創建虛擬環境
python -m venv venv

# 激活虛擬環境
# Windows
venv\\Scripts\\activate
# macOS/Linux
source venv/bin/activate

# 安裝依賴
pip install -r requirements.txt
```

### 2. 環境配置

```bash
# 複製環境變數範例
cp .env.example .env

# 編輯 .env 文件，填入正確的配置
```

### 3. 資料庫設置

```bash
# 確保 PostgreSQL 正在運行
# 創建資料庫
createdb family_finance

# 運行資料庫遷移（將來會添加 Alembic）
```

### 4. 啟動開發服務器

```bash
# 開發模式
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 或使用 Python 直接運行
python -m app.main
```

### 5. 訪問 API 文檔

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 端點

### 身份驗證
- `POST /api/v1/auth/login` - 用戶登入
- `POST /api/v1/auth/logout` - 用戶登出
- `GET /api/v1/auth/me` - 獲取當前用戶

### 用戶管理
- `GET /api/v1/users/` - 獲取用戶列表
- `POST /api/v1/users/` - 創建用戶
- `GET /api/v1/users/{id}` - 獲取用戶詳情
- `PUT /api/v1/users/{id}` - 更新用戶
- `DELETE /api/v1/users/{id}` - 刪除用戶

### 活動管理
- `GET /api/v1/events/` - 獲取活動列表
- `POST /api/v1/events/` - 創建活動
- `GET /api/v1/events/{id}` - 獲取活動詳情
- `PUT /api/v1/events/{id}` - 更新活動
- `PUT /api/v1/events/{id}/toggle` - 切換活動狀態

### EDM 管理
- `GET /api/v1/events/{id}/edm` - 獲取活動 EDM
- `POST /api/v1/events/{id}/edm` - 創建/更新 EDM
- `DELETE /api/v1/events/{id}/edm` - 刪除 EDM

### 支出記錄
- `GET /api/v1/expenses/` - 獲取支出列表
- `POST /api/v1/expenses/` - 創建支出記錄
- `GET /api/v1/expenses/{id}` - 獲取支出詳情
- `PUT /api/v1/expenses/{id}` - 更新支出記錄
- `DELETE /api/v1/expenses/{id}` - 刪除支出記錄
- `PUT /api/v1/expenses/{id}/payment` - 更新付款狀態

### 分類管理
- `GET /api/v1/categories/` - 獲取分類列表
- `POST /api/v1/categories/` - 創建分類
- `GET /api/v1/categories/{id}` - 獲取分類詳情
- `PATCH /api/v1/categories/{id}` - 更新分類
- `DELETE /api/v1/categories/{id}` - 刪除分類

### 群組管理
- `GET /api/v1/groups/` - 獲取用戶群組
- `POST /api/v1/groups/` - 創建群組
- `GET /api/v1/groups/{id}` - 獲取群組詳情
- `PUT /api/v1/groups/{id}` - 更新群組
- `DELETE /api/v1/groups/{id}` - 刪除群組

### 群組成員
- `GET /api/v1/groups/{id}/members` - 獲取群組成員
- `POST /api/v1/groups/{id}/members` - 添加群組成員
- `PUT /api/v1/groups/{id}/members/{member_id}` - 更新群組成員
- `DELETE /api/v1/groups/{id}/members/{member_id}` - 移除群組成員

## 數據模型

### 核心模型
- **User**: 用戶模型，支援多角色權限
- **Category**: 分類模型，支援收支分類
- **Event**: 活動模型，家族活動管理
- **EDM**: 電子直郵模型，活動宣傳

### 財務模型
- **Expense**: 支出記錄模型
- **ExpensePayment**: 付款記錄模型
- **Group**: 群組模型
- **GroupMember**: 群組成員模型
- **ExpenseMemberSplit**: 分帳記錄模型

## 權限系統

- **ADMIN**: 系統管理員，擁有所有權限
- **FINANCE_MANAGER**: 財務經理，可管理付款狀態
- **USER**: 普通用戶，僅能管理自己的數據

## AI 功能規劃

- 收據 OCR 自動識別
- 智能支出分類
- 自動分帳建議算法
- 消費模式分析
- 對話式記帳助手

## 開發規範

請參考 `/.claude/instruction.md` 中的開發指導原則。

## 貢獻

請遵循項目的代碼風格和提交規範。
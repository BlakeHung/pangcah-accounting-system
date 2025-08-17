
<!-- 
此文檔由私有倉庫自動同步生成
如需完整資訊，請參考內部文檔
最後更新: Sun Aug 17 06:32:01 UTC 2025
-->

# 🗂️ Git 倉庫策略建議

## 📋 專案現況分析

### 專案特性
- **業務類型**: 家族記帳系統（單一業務領域）
- **團隊規模**: 小團隊開發
- **用戶規模**: < 100 用戶
- **技術棧**: React + Django（緊密耦合）
- **部署需求**: 簡單直接的部署流程

## 🚫 不建議的方案：Nested Git

```
❌ 不建議
workspace/ (git)
├── frontend/ (git)  
├── backend-django/ (git)
└── data/ (git)
```

### 問題分析
1. **管理複雜**: Git submodules 學習曲線陡峭
2. **開發效率低**: 每次feature需要多次commit
3. **版本同步難**: 跨repo的版本一致性問題
4. **CI/CD複雜**: 需要多套部署流程

## ✅ 推薦方案：Monorepo

```
✅ 推薦
family-finance-system/ (單一 git repo)
├── frontend/           # React 前端
├── backend/           # Django 後端  
├── docs/             # 文檔
├── scripts/          # 自動化腳本
├── .github/          # GitHub Actions
└── docker-compose.yml # 完整環境
```

## 🏗️ 詳細倉庫結構

### 建議的完整結構

```
family-finance-system/
├── 📁 frontend/                    # React 前端應用
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── 📁 backend/                     # Django 後端
│   ├── family_finance/
│   ├── apps/
│   ├── requirements.txt
│   └── manage.py
├── 📁 shared/                      # 共用資源
│   ├── types/                     # TypeScript 類型定義
│   ├── constants/                 # 常數定義
│   └── utils/                     # 工具函數
├── 📁 docs/                        # 項目文檔
│   ├── api/                       # API 文檔
│   ├── deployment/                # 部署文檔
│   ├── development/               # 開發文檔
│   └── user-guides/               # 使用手冊
├── 📁 scripts/                     # 自動化腳本
│   ├── setup.sh                  # 環境設置
│   ├── dev.sh                     # 開發啟動
│   ├── build.sh                   # 建置腳本
│   └── deploy.sh                  # 部署腳本
├── 📁 tests/                       # 整合測試
│   ├── e2e/                       # 端對端測試
│   ├── api/                       # API 測試
│   └── integration/               # 整合測試
├── 📁 .github/                     # GitHub 配置
│   ├── workflows/                 # GitHub Actions
│   │   ├── ci.yml                # 持續整合
│   │   ├── cd.yml                # 持續部署
│   │   └── test.yml              # 測試流程
│   └── ISSUE_TEMPLATE/           # Issue 模板
├── 📁 deployment/                  # 部署配置
│   ├── docker/
│   ├── kubernetes/
│   └── nginx/
├── 📄 docker-compose.yml          # 開發環境編排
├── 📄 docker-compose.prod.yml     # 生產環境編排
├── 📄 .gitignore                  # Git 忽略規則
├── 📄 README.md                   # 項目說明
├── 📄 CHANGELOG.md                # 版本變更日誌
├── 📄 CONTRIBUTING.md             # 貢獻指南
└── 📄 LICENSE                     # 授權協議
```

## 🎯 Monorepo 的優勢

### ✅ 開發優勢
1. **簡化的開發流程**
   ```bash
   # 一個命令啟動整個系統
   ./scripts/dev.sh
   
   # 一次commit包含前後端變更
   git commit -m "feat: 新增用戶偏好設定功能"
   ```

2. **統一的依賴管理**
   ```bash
   # 根目錄 package.json 管理 workspace
   npm install  # 安裝所有依賴
   ```

3. **原子性變更**
   - 跨前後端的功能可以在同一個PR中完成
   - 版本一致性保證
   - 重構更容易

### ✅ 協作優勢
1. **簡化的分支策略**
   ```
   main          # 生產分支
   develop       # 開發分支
   feature/*     # 功能分支
   hotfix/*      # 緊急修復
   ```

2. **統一的Code Review流程**
   - 前後端變更一起審查
   - 減少溝通成本
   - 保證功能完整性

### ✅ 部署優勢
1. **簡化的CI/CD**
   ```yaml
   # .github/workflows/ci.yml
   name: CI/CD Pipeline
   on: [push, pull_request]
   jobs:
     test:
       - Frontend tests
       - Backend tests
       - Integration tests
     deploy:
       - Build frontend
       - Deploy backend
       - Deploy frontend
   ```

2. **版本同步**
   - 前後端版本始終同步
   - 統一的版本標記
   - 簡化的回滾流程

## 🔧 實施建議

### Phase 1: 倉庫遷移 (立即執行)

```bash
# 1. 創建新的 monorepo
git init family-finance-system
cd family-finance-system

# 2. 遷移現有代碼
mkdir frontend backend docs scripts
cp -r /path/to/current/frontend/* frontend/
cp -r /path/to/current/backend-django/* backend/

# 3. 建立根目錄配置
# 創建 package.json (npm workspaces)
# 創建 docker-compose.yml
# 更新 .gitignore
```

### Phase 2: 工具配置 (1週內)

1. **設置 npm workspaces**
   ```json
   // package.json
   {
     "name": "family-finance-system",
     "workspaces": ["frontend", "backend"],
     "scripts": {
       "dev": "./scripts/dev.sh",
       "build": "./scripts/build.sh",
       "test": "npm run test --workspaces"
     }
   }
   ```

2. **建立自動化腳本**
   ```bash
   # scripts/dev.sh
   #!/bin/bash
   echo "🚀 啟動家族記帳系統..."
   docker-compose up -d  # 資料庫
   concurrently \
     "cd backend && python manage.py runserver" \
     "cd frontend && npm run dev"
   ```

3. **配置 GitHub Actions**
   - 自動測試流程
   - 自動部署流程
   - 代碼品質檢查

### Phase 3: 文檔整合 (1週內)

1. **合併現有文檔**
   ```
   docs/
   ├── api/              # 從 backend/docs 遷移
   ├── development/      # 開發指南
   ├── deployment/       # 部署指南
   └── user-guides/      # 使用手冊
   ```

2. **更新 README**
   - 統一的啟動指令
   - 完整的功能說明
   - 貢獻指南

## 🔄 與其他方案的對比

| 特性 | Monorepo | Multi-repo | Nested Git |
|------|----------|-----------|------------|
| 開發複雜度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 版本一致性 | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| CI/CD簡潔度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 新人上手 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 代碼重用 | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| 權限控制 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 📦 Monorepo 最佳實踐

### 1. 文件組織
```bash
# 明確的模組邊界
frontend/    # 純前端相關
backend/     # 純後端相關
shared/      # 共用代碼和類型
```

### 2. 腳本自動化
```bash
# 簡化的開發命令
npm run dev          # 啟動開發環境
npm run test         # 運行所有測試
npm run build        # 建置所有模組
npm run deploy       # 部署到生產環境
```

### 3. 依賴管理
```json
// 使用 npm workspaces 管理依賴
{
  "workspaces": {
    "packages": ["frontend", "backend", "shared"]
  }
}
```

### 4. Git 工作流程
```bash
# 功能開發
git checkout -b feature/user-preferences
# 開發前後端功能...
git commit -m "feat: 新增用戶偏好設定"
git push origin feature/user-preferences
# 創建 PR，包含完整功能
```

## 🚀 遷移行動計劃

### 立即行動 (今天)
1. 備份現有代碼
2. 創建新的 monorepo 結構
3. 遷移代碼到新結構

### 1週內完成
1. 設置自動化腳本
2. 配置 CI/CD 流程
3. 更新文檔

### 2週內完成
1. 團隊培訓新的工作流程
2. 驗證所有功能正常
3. 正式切換到新倉庫

## 🎯 結論

對於你的家族記帳系統項目，**Monorepo 是最佳選擇**，因為：

1. **簡化開發**: 一個倉庫管理所有代碼
2. **提升效率**: 減少跨倉庫的協調成本  
3. **便於維護**: 統一的版本控制和部署
4. **新人友好**: 降低項目理解門檻

避免使用 nested git 的複雜結構，直接採用簡潔的 monorepo 策略！
#!/bin/bash

# 家族記帳系統前端初始化腳本

echo "🚀 開始初始化家族記帳系統前端..."

# 檢查是否安裝了 Node.js 和 npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝，請先安裝 Node.js (建議版本 18+)"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安裝，請先安裝 npm"
    exit 1
fi

# 顯示版本信息
echo "📋 環境信息："
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"

# 安裝依賴
echo "📥 安裝前端依賴..."
npm install

# 檢查依賴安裝是否成功
if [ $? -eq 0 ]; then
    echo "✅ 依賴安裝成功！"
else
    echo "❌ 依賴安裝失敗"
    exit 1
fi

echo "✅ 前端初始化完成！"
echo ""
echo "🎯 可用的命令："
echo "   npm run dev      - 啟動開發服務器"
echo "   npm run build    - 建置生產版本"
echo "   npm run preview  - 預覽生產版本"
echo "   npm run lint     - 代碼檢查"
echo ""
echo "🌐 開發服務器地址："
echo "   前端: http://localhost:3000"
echo ""
echo "⚠️  請確保後端服務器運行在 http://localhost:8000"
#!/bin/bash

# 家族記帳系統後端初始化腳本

echo "🚀 開始初始化家族記帳系統後端..."

# 檢查是否安裝了 Python 和 pip
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安裝，請先安裝 Python3"
    exit 1
fi

# 創建虛擬環境（如果不存在）
if [ ! -d "venv" ]; then
    echo "📦 創建虛擬環境..."
    python3 -m venv venv
fi

# 激活虛擬環境
echo "🔧 激活虛擬環境..."
source venv/bin/activate

# 安裝依賴
echo "📥 安裝 Python 依賴..."
pip install -r requirements.txt

# 複製環境變數文件
if [ ! -f ".env" ]; then
    echo "📋 創建環境變數文件..."
    cp .env.example .env
    echo "⚠️  請編輯 .env 文件設置正確的配置"
fi

# 運行資料庫遷移
echo "🗄️ 運行資料庫遷移..."
python manage.py makemigrations
python manage.py migrate

# 創建超級用戶（可選）
echo "👤 是否要創建超級用戶？(y/N)"
read -r create_superuser
if [[ $create_superuser =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
fi

# 收集靜態文件
echo "📁 收集靜態文件..."
python manage.py collectstatic --noinput

echo "✅ 初始化完成！"
echo ""
echo "🎯 啟動開發服務器："
echo "   python manage.py runserver"
echo ""
echo "🌐 訪問地址："
echo "   後端 API: http://localhost:8000"
echo "   API 文檔: http://localhost:8000/api/docs/"
echo "   管理後台: http://localhost:8000/admin/"
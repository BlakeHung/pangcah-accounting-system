#!/bin/bash
# Railway 資料初始化腳本

echo "🚀 Railway 資料初始化開始..."
echo "================================"

# 執行 Django management command
python manage.py init_data --settings=pangcah_accounting.settings.railway

echo "================================"
echo "✅ 初始化完成！"
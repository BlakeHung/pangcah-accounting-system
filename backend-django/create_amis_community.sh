#!/bin/bash
# Railway 阿美族社群資料創建腳本

echo "🌟 開始創建阿美族長光部落社群資料..."
echo "========================================"

# 執行 Django management command
python manage.py create_amis_community --settings=pangcah_accounting.settings.railway

echo "========================================"
echo "✅ 阿美族社群資料創建完成！"
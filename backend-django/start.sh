#!/bin/bash
echo "Starting Pangcah Accounting API..."

# 設定 PORT 預設值
if [ -z "$PORT" ]; then
    PORT=8000
fi
echo "PORT: $PORT"

echo "Collecting static files..."
python manage.py collectstatic --noinput --settings=pangcah_accounting.settings.railway

echo "Running database migrations..."
python manage.py migrate --settings=pangcah_accounting.settings.railway

echo "Initializing data..."
python manage.py init_data --settings=pangcah_accounting.settings.railway
if [ $? -eq 0 ]; then
    echo "✅ 基本資料初始化成功"
else
    echo "❌ 基本資料初始化失敗，但繼續執行"
fi

echo "Creating minimal Amis community data..."
python manage.py create_minimal_amis --settings=pangcah_accounting.settings.railway
if [ $? -eq 0 ]; then
    echo "✅ 阿美族資料創建成功"
else
    echo "❌ 阿美族資料創建失敗，但繼續執行"
fi

echo "Starting server on port $PORT..."
python manage.py runserver 0.0.0.0:$PORT
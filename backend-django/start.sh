#!/bin/bash
echo "Starting Pangcah Accounting API with WebSocket support..."

# 設定 PORT 預設值
if [ -z "$PORT" ]; then
    PORT=8000
fi
echo "PORT: $PORT"

# 運行資料庫遷移
echo "Running database migrations..."
python manage.py migrate --settings=pangcah_accounting.settings.railway

# 收集靜態文件
echo "Collecting static files..."
python manage.py collectstatic --noinput --settings=pangcah_accounting.settings.railway

echo "Starting ASGI server with WebSocket support on port $PORT..."
daphne -b 0.0.0.0 -p $PORT pangcah_accounting.asgi:application
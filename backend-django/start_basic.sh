#!/bin/bash
echo "Starting Pangcah Accounting API (Basic Mode - No WebSocket)..."

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

echo "Starting basic HTTP server on port $PORT..."

# 使用標準的 gunicorn，不需要 WebSocket
gunicorn pangcah_accounting.wsgi:application \
  -b 0.0.0.0:$PORT \
  --workers 1 \
  --max-requests 200 \
  --timeout 30 \
  --log-level info \
  --disable-redirect-access-to-syslog
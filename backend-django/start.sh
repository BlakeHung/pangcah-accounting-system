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

# 嘗試 gunicorn，如果失敗則使用 daphne
if command -v gunicorn &> /dev/null; then
    echo "Using gunicorn + uvicorn (Railway Free Tier optimized)..."
    gunicorn pangcah_accounting.asgi:application \
      -k uvicorn.workers.UvicornWorker \
      -b 0.0.0.0:$PORT \
      --workers 1 \
      --worker-connections 10 \
      --max-requests 100 \
      --timeout 30 \
      --graceful-timeout 20 \
      --keep-alive 5
else
    echo "Fallback to daphne..."
    daphne -b 0.0.0.0 -p $PORT pangcah_accounting.asgi:application
fi
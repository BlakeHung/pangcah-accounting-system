#!/bin/bash
echo "Starting Pangcah Accounting API (Railway Hobby Plan)..."

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

echo "Starting optimized HTTP server on port $PORT..."

# 使用 gunicorn + WSGI 以獲得最佳穩定性
gunicorn pangcah_accounting.wsgi:application \
  -b 0.0.0.0:$PORT \
  --workers 2 \
  --worker-class sync \
  --max-requests 500 \
  --max-requests-jitter 50 \
  --timeout 60 \
  --keep-alive 5 \
  --log-level info \
  --access-logfile - \
  --error-logfile -
#!/bin/bash
echo "Starting Pangcah Accounting API (Serverless Mode)..."

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

echo "Starting serverless HTTP server on port $PORT..."

# Serverless 優化配置
gunicorn pangcah_accounting.wsgi:application \
  -b 0.0.0.0:$PORT \
  --workers 1 \
  --worker-class sync \
  --max-requests 100 \
  --max-requests-jitter 10 \
  --timeout 120 \
  --keep-alive 2 \
  --log-level info \
  --access-logfile - \
  --error-logfile -
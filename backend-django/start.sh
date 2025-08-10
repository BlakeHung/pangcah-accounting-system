#!/bin/bash
echo "Starting Pangcah Accounting API..."

# 設定 PORT 預設值
if [ -z "$PORT" ]; then
    PORT=8000
fi
echo "PORT: $PORT"

echo "Starting server on port $PORT..."
python manage.py runserver 0.0.0.0:$PORT --settings=pangcah_accounting.settings.railway
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
python manage.py init_data --settings=pangcah_accounting.settings.railway || true

echo "Starting server on port $PORT..."
python manage.py runserver 0.0.0.0:$PORT
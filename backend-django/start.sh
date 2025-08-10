#!/bin/bash
echo "Starting Pangcah Accounting API..."
echo "PORT: ${PORT:-8080}"

echo "Collecting static files..."
python manage.py collectstatic --noinput --settings=pangcah_accounting.settings.railway

echo "Running database migrations..."
python manage.py migrate --settings=pangcah_accounting.settings.railway

echo "Using gunicorn to start server..."
gunicorn pangcah_accounting.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 2 --log-level info
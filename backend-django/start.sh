#!/bin/bash
echo "Starting Pangcah Accounting API..."
echo "PORT: ${PORT:-8000}"
echo "Using gunicorn to start server..."
gunicorn pangcah_accounting.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --log-level info
#!/bin/bash
# Railway Pre-deploy Command
echo "🚀 執行Railway預部署命令..."

echo "Running database migrations..."
python manage.py migrate --settings=pangcah_accounting.settings.railway

echo "Collecting static files..."
python manage.py collectstatic --noinput --settings=pangcah_accounting.settings.railway

echo "Initializing basic data..."
python manage.py init_data --settings=pangcah_accounting.settings.railway

echo "Creating full Amis community data..."
python manage.py create_amis_community --settings=pangcah_accounting.settings.railway

echo "Creating test expense..."
python manage.py create_test_expense_now --settings=pangcah_accounting.settings.railway

echo "✅ 預部署命令執行完成"
#!/usr/bin/env python
"""
獨立腳本創建管理員帳號
"""
import os
import sys
import django

# 設置 Django 環境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pangcah_accounting.settings.railway')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_admin():
    """創建管理員帳號"""
    if User.objects.filter(username='admin').exists():
        print('⚠️ 管理員帳號已存在')
        return
    
    try:
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@pangcah-accounting.com',
            password='admin123',
            first_name='系統',
            last_name='管理員',
            name='系統管理員',
            role='ADMIN',
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        print(f'✅ 成功創建管理員帳號: {admin_user.username} / admin123')
    except Exception as e:
        print(f'❌ 創建管理員帳號失敗: {e}')

if __name__ == '__main__':
    create_admin()
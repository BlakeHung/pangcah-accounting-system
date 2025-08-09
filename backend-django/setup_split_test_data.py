#!/usr/bin/env python
"""
設置分帳測試數據
為admin和alice用戶創建可以測試分帳功能的數據
"""

import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Django 設置
sys.path.append('/Users/blakehung/devProjects/family-finance-workspace/new-project/backend-django')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'family_finance.settings')
django.setup()

from apps.users.models import User
from apps.groups.models import Group, GroupMember
from apps.events.models import Event
from apps.categories.models import Category

def setup_test_data():
    print("🔧 設置分帳測試數據...")
    
    # 1. 確保測試用戶存在
    print("\n1. 檢查測試用戶...")
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'name': '系統管理員',
            'role': 'ADMIN',
            'email': 'admin@example.com'
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"   ✅ 創建管理員: {admin_user.username}")
    else:
        print(f"   ✅ 管理員已存在: {admin_user.username}")
    
    alice_user, created = User.objects.get_or_create(
        username='alice',
        defaults={
            'name': '愛麗絲',
            'role': 'USER',
            'email': 'alice@example.com'
        }
    )
    if created:
        alice_user.set_password('alice123')
        alice_user.save()
        print(f"   ✅ 創建用戶: {alice_user.username}")
    else:
        print(f"   ✅ 用戶已存在: {alice_user.username}")
    
    # 2. 創建測試群組
    print("\n2. 設置測試群組...")
    test_group, created = Group.objects.get_or_create(
        name='家庭聚餐群組',
        defaults={
            'description': '用於測試分帳功能的家庭聚餐群組',
            'created_by': admin_user
        }
    )
    if created:
        print(f"   ✅ 創建群組: {test_group.name}")
    else:
        print(f"   ✅ 群組已存在: {test_group.name}")
    
    # 添加管理者
    test_group.managers.add(admin_user)
    test_group.save()
    print(f"   ✅ 添加管理者: {admin_user.name}")
    
    # 添加群組成員
    alice_member, created = GroupMember.objects.get_or_create(
        group=test_group,
        name=alice_user.name,
        defaults={
            'user': alice_user,
            'is_system_user': True
        }
    )
    if created:
        print(f"   ✅ 添加成員: {alice_user.name}")
    
    admin_member, created = GroupMember.objects.get_or_create(
        group=test_group,
        name=admin_user.name,
        defaults={
            'user': admin_user,
            'is_system_user': True
        }
    )
    if created:
        print(f"   ✅ 添加成員: {admin_user.name}")
    
    # 3. 創建支出分類
    print("\n3. 設置支出分類...")
    food_category, created = Category.objects.get_or_create(
        name='餐費',
        defaults={
            'type': 'EXPENSE',
            'description': '用餐相關費用'
        }
    )
    if created:
        print(f"   ✅ 創建分類: {food_category.name}")
    else:
        print(f"   ✅ 分類已存在: {food_category.name}")
    
    # 4. 創建測試活動 - 允許分帳
    print("\n4. 創建測試活動...")
    split_event, created = Event.objects.get_or_create(
        name='家庭聚餐 - 可分帳',
        defaults={
            'description': '測試分帳功能的家庭聚餐活動',
            'start_date': timezone.now(),
            'end_date': timezone.now() + timedelta(days=7),
            'status': 'ACTIVE',
            'enabled': True,
            'allow_split': True,
            'group': test_group,
            'created_by': admin_user,
            'budget': 5000.00
        }
    )
    
    if created:
        print(f"   ✅ 創建活動: {split_event.name}")
    else:
        # 更新現有活動確保設置正確
        split_event.allow_split = True
        split_event.status = 'ACTIVE'
        split_event.enabled = True
        split_event.save()
        print(f"   ✅ 更新活動: {split_event.name}")
    
    # 添加活動管理者
    split_event.managers.add(admin_user)
    print(f"   ✅ 添加活動管理者: {admin_user.name}")
    
    # 5. 創建對照活動 - 不允許分帳
    no_split_event, created = Event.objects.get_or_create(
        name='個人記帳 - 不可分帳',
        defaults={
            'description': '不允許分帳的個人記帳活動',
            'start_date': timezone.now(),
            'end_date': timezone.now() + timedelta(days=7),
            'status': 'ACTIVE',
            'enabled': True,
            'allow_split': False,
            'group': test_group,
            'created_by': admin_user
        }
    )
    
    if created:
        print(f"   ✅ 創建對照活動: {no_split_event.name}")
    else:
        no_split_event.allow_split = False
        no_split_event.save()
        print(f"   ✅ 更新對照活動: {no_split_event.name}")
    
    print("\n🎉 測試數據設置完成！")
    print("\n📋 測試環境摘要:")
    print(f"   👥 測試用戶: admin (密碼: admin123), alice (密碼: alice123)")
    print(f"   👨‍👩‍👧‍👦 測試群組: {test_group.name}")
    print(f"   🎉 可分帳活動: {split_event.name}")
    print(f"   📝 不可分帳活動: {no_split_event.name}")
    print(f"   📂 測試分類: {food_category.name}")
    print(f"\n💡 測試步驟:")
    print(f"   1. 使用 admin 或 alice 登入")
    print(f"   2. 進入 '新增支出' 頁面")
    print(f"   3. 選擇群組: {test_group.name}")
    print(f"   4. 選擇活動: {split_event.name} (應該顯示分帳選項)")
    print(f"   5. 或選擇活動: {no_split_event.name} (不會顯示分帳選項)")

if __name__ == '__main__':
    setup_test_data()
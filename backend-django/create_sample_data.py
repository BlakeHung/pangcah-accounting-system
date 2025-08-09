#!/usr/bin/env python
"""
創建示範資料腳本
"""

import os
import django

# 設置 Django 環境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'family_finance.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.groups.models import Group, GroupMember
from apps.categories.models import Category

User = get_user_model()

def create_sample_data():
    print("🚀 開始創建示範資料...")
    
    # 1. 創建用戶
    print("\n👥 創建用戶...")
    
    # 確保 admin 用戶存在
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'name': 'Admin',
            'role': 'ADMIN',
            'is_superuser': True,
            'is_staff': True,
            'is_active': True
        }
    )
    if created:
        admin_user.set_password('admin')
        admin_user.save()
        print("   ✅ 創建系統管理員: admin")
    else:
        print("   ℹ️  系統管理員已存在: admin")
    
    # 創建一般用戶
    users_data = [
        {'username': 'alice', 'name': '愛麗絲', 'email': 'alice@example.com'},
        {'username': 'bob', 'name': '小明', 'email': 'bob@example.com'},
        {'username': 'carol', 'name': '小華', 'email': 'carol@example.com'},
        {'username': 'david', 'name': '大偉', 'email': 'david@example.com'},
        {'username': 'eva', 'name': '小美', 'email': 'eva@example.com'},
    ]
    
    users = {}
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'name': user_data['name'],
                'role': 'USER',
                'is_active': True
            }
        )
        if created:
            user.set_password('password123')  # 統一密碼方便測試
            user.save()
            print(f"   ✅ 創建用戶: {user_data['username']} ({user_data['name']})")
        else:
            print(f"   ℹ️  用戶已存在: {user_data['username']} ({user_data['name']})")
        
        users[user_data['username']] = user
    
    # 2. 創建分類
    print("\n📊 創建支出分類...")
    
    categories_data = [
        {'name': '餐飲', 'type': 'EXPENSE'},
        {'name': '交通', 'type': 'EXPENSE'},
        {'name': '娛樂', 'type': 'EXPENSE'},
        {'name': '生活用品', 'type': 'EXPENSE'},
        {'name': '醫療', 'type': 'EXPENSE'},
        {'name': '家族活動', 'type': 'EXPENSE'},
        {'name': '禮金', 'type': 'EXPENSE'},
        {'name': '其他', 'type': 'EXPENSE'},
    ]
    
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults={
                'type': cat_data['type'],
                'is_default': True  # 設為預設分類
            }
        )
        if created:
            print(f"   ✅ 創建分類: {cat_data['name']}")
        else:
            print(f"   ℹ️  分類已存在: {cat_data['name']}")
    
    # 3. 創建群組
    print("\n👨‍👩‍👧‍👦 創建家族群組...")
    
    groups_data = [
        {
            'name': '核心家庭',
            'description': '爸媽和小孩的日常開支群組',
            'members': ['alice', 'bob'],
            'managers': ['alice']  # 愛麗絲是核心家庭的管理者
        },
        {
            'name': '大家庭聚會',
            'description': '全家族聚會活動的費用管理',
            'members': ['alice', 'bob', 'carol', 'david', 'eva'],
            'managers': ['alice', 'carol']  # 愛麗絲和小華是大家庭的管理者
        },
        {
            'name': '年輕人小組',
            'description': '年輕一代的活動和聚餐費用',
            'members': ['bob', 'david', 'eva'],
            'managers': ['bob', 'david']  # 小明和大偉是年輕人小組的管理者
        }
    ]
    
    for group_data in groups_data:
        group, created = Group.objects.get_or_create(
            name=group_data['name'],
            defaults={
                'description': group_data['description'],
                'created_by': admin_user
            }
        )
        
        if created:
            print(f"   ✅ 創建群組: {group_data['name']}")
            
            # 添加群組管理者
            for manager_username in group_data['managers']:
                if manager_username in users:
                    group.managers.add(users[manager_username])
                    print(f"      👑 指定管理者: {users[manager_username].name}")
            
            # 添加群組成員
            for member_username in group_data['members']:
                if member_username in users:
                    GroupMember.objects.create(
                        group=group,
                        name=users[member_username].name,
                        user=users[member_username]
                    )
                    print(f"      👤 添加成員: {users[member_username].name}")
        else:
            print(f"   ℹ️  群組已存在: {group_data['name']}")
    
    # 4. 顯示權限總結
    print("\n🔐 權限總結:")
    print(f"   👨‍💼 系統管理員: admin (管理所有群組)")
    
    for group in Group.objects.all():
        managers = group.managers.all()
        members = group.members.all()
        print(f"\n   🏠 {group.name}:")
        print(f"      👑 管理者: {', '.join([m.name for m in managers])}")
        print(f"      👥 成員: {', '.join([m.name for m in members])}")
    
    print("\n✨ 示範資料創建完成！")
    print("\n🔑 登入資訊:")
    print("   系統管理員: admin / admin")
    print("   一般用戶: alice, bob, carol, david, eva / password123")

if __name__ == '__main__':
    create_sample_data()
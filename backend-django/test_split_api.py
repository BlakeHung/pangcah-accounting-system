#!/usr/bin/env python
"""
测试支出分帐API的脚本
"""

import os
import sys
import django
import requests
import json
from datetime import datetime

# Django 设置
sys.path.append('/Users/blakehung/devProjects/family-finance-workspace/new-project/backend-django')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'family_finance.settings')
django.setup()

from apps.users.models import User
from rest_framework_simplejwt.tokens import RefreshToken

def get_auth_token(username):
    """获取用户的JWT token"""
    try:
        user = User.objects.get(username=username)
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    except User.DoesNotExist:
        print(f"用户 {username} 不存在")
        return None

def test_expense_creation_with_split():
    """测试创建支出并设置分帐"""
    
    print("🧪 开始测试支出分帐API...")
    
    # 获取alice的token
    token = get_auth_token('alice')
    if not token:
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # 测试数据 - 平均分攊
    test_data_average = {
        "amount": 1000,
        "type": "EXPENSE",
        "date": datetime.now().isoformat(),
        "description": "测试平均分帐 - API测试",
        "category": 1,  # 假设分类ID为1
        "event": 6,     # 週末聚餐 - 測試分帳
        "group": 1,     # 核心家庭
        "split_type": "AVERAGE",
        "split_participants": [
            {
                "user_id": 1,  # admin
                "split_value": 0.5,
                "calculated_amount": 500
            },
            {
                "user_id": 2,  # alice
                "split_value": 0.5,
                "calculated_amount": 500
            }
        ]
    }
    
    print("\n📤 发送平均分帐测试请求...")
    print(f"请求数据: {json.dumps(test_data_average, indent=2, ensure_ascii=False)}")
    
    response = requests.post(
        'http://localhost:8000/api/v1/expenses/',
        headers=headers,
        json=test_data_average
    )
    
    print(f"\n📥 响应状态码: {response.status_code}")
    
    if response.status_code == 201:
        print("✅ 平均分帐创建成功!")
        expense_data = response.json()
        expense_id = expense_data['id']
        print(f"支出ID: {expense_id}")
        
        # 检查分帐记录
        splits_response = requests.get(
            f'http://localhost:8000/api/v1/expenses/{expense_id}/splits/',
            headers=headers
        )
        
        if splits_response.status_code == 200:
            splits_data = splits_response.json()
            print(f"分帐记录数量: {len(splits_data)}")
            for split in splits_data:
                participant_name = split['participant']['name']
                amount = split['calculated_amount']
                split_type = split['split_type']
                print(f"  - {participant_name}: NT$ {amount} ({split_type})")
        else:
            print("❌ 获取分帐记录失败")
    else:
        print(f"❌ 平均分帐创建失败: {response.text}")
    
    print("\n" + "="*50)
    
    # 测试数据 - 比例分攤
    test_data_ratio = {
        "amount": 1500,
        "type": "EXPENSE", 
        "date": datetime.now().isoformat(),
        "description": "测试比例分帐 - API测试",
        "category": 1,
        "event": 6,
        "group": 1,
        "split_type": "RATIO",
        "split_participants": [
            {
                "user_id": 1,  # admin - 2倍比例
                "split_value": 2.0,
                "calculated_amount": 1000
            },
            {
                "user_id": 2,  # alice - 1倍比例
                "split_value": 1.0, 
                "calculated_amount": 500
            }
        ]
    }
    
    print("📤 发送比例分帐测试请求...")
    print(f"请求数据: {json.dumps(test_data_ratio, indent=2, ensure_ascii=False)}")
    
    response = requests.post(
        'http://localhost:8000/api/v1/expenses/',
        headers=headers,
        json=test_data_ratio
    )
    
    print(f"\n📥 响应状态码: {response.status_code}")
    
    if response.status_code == 201:
        print("✅ 比例分帐创建成功!")
        expense_data = response.json()
        expense_id = expense_data['id']
        print(f"支出ID: {expense_id}")
        
        # 检查分帐记录
        splits_response = requests.get(
            f'http://localhost:8000/api/v1/expenses/{expense_id}/splits/',
            headers=headers
        )
        
        if splits_response.status_code == 200:
            splits_data = splits_response.json()
            print(f"分帐记录数量: {len(splits_data)}")
            for split in splits_data:
                participant_name = split['participant']['name']
                amount = split['calculated_amount']
                split_value = split['split_value']
                split_type = split['split_type']
                print(f"  - {participant_name}: NT$ {amount} (比例: {split_value}, {split_type})")
        else:
            print("❌ 获取分帐记录失败")
    else:
        print(f"❌ 比例分帐创建失败: {response.text}")
    
    print("\n" + "="*50)
    
    # 测试数据 - 固定金额分攤  
    test_data_fixed = {
        "amount": 800,
        "type": "EXPENSE",
        "date": datetime.now().isoformat(),
        "description": "测试固定金额分帐 - API测试",
        "category": 1,
        "event": 6,
        "group": 1,
        "split_type": "FIXED",
        "split_participants": [
            {
                "user_id": 1,  # admin - 固定500
                "split_value": 500,
                "calculated_amount": 500
            },
            {
                "user_id": 2,  # alice - 固定300
                "split_value": 300,
                "calculated_amount": 300
            }
        ]
    }
    
    print("📤 发送固定金额分帐测试请求...")
    print(f"请求数据: {json.dumps(test_data_fixed, indent=2, ensure_ascii=False)}")
    
    response = requests.post(
        'http://localhost:8000/api/v1/expenses/',
        headers=headers,
        json=test_data_fixed
    )
    
    print(f"\n📥 响应状态码: {response.status_code}")
    
    if response.status_code == 201:
        print("✅ 固定金额分帐创建成功!")
        expense_data = response.json()
        expense_id = expense_data['id']
        print(f"支出ID: {expense_id}")
        
        # 检查分帐记录
        splits_response = requests.get(
            f'http://localhost:8000/api/v1/expenses/{expense_id}/splits/',
            headers=headers
        )
        
        if splits_response.status_code == 200:
            splits_data = splits_response.json()
            print(f"分帐记录数量: {len(splits_data)}")
            total_split = 0
            for split in splits_data:
                participant_name = split['participant']['name']
                amount = split['calculated_amount']
                split_value = split['split_value']
                split_type = split['split_type']
                total_split += amount
                print(f"  - {participant_name}: NT$ {amount} (固定值: {split_value}, {split_type})")
            
            print(f"分帐总计: NT$ {total_split}")
            print(f"支出总额: NT$ 800")
            print(f"差额: NT$ {800 - total_split}")
        else:
            print("❌ 获取分帐记录失败")
    else:
        print(f"❌ 固定金额分帐创建失败: {response.text}")
    
    print("\n🎉 API测试完成!")

if __name__ == '__main__':
    test_expense_creation_with_split()
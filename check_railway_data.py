#!/usr/bin/env python3
"""
檢查Railway上的資料狀態並執行必要的初始化
"""
import requests
import json

BASE_URL = "https://pangcah-accounting-system-production.up.railway.app"

def login():
    """登入獲取access token"""
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/auth/login/", json=login_data)
    if response.status_code == 200:
        return response.json()["access"]
    else:
        print(f"登入失敗: {response.status_code} - {response.text}")
        return None

def check_groups(token):
    """檢查群組數量"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/v1/groups/", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"群組數量: {data['count']}")
        return data['count']
    else:
        print(f"檢查群組失敗: {response.status_code} - {response.text}")
        return 0

def check_events(token):
    """檢查活動數量"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/v1/events/", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"活動數量: {data['count']}")
        return data['count']
    else:
        print(f"檢查活動失敗: {response.status_code} - {response.text}")
        return 0

def test_amis_user_login():
    """測試阿美族用戶登入"""
    test_users = [
        "cilangasan_父親_拉罕",
        "nakao_母親_芭翁", 
        "tayal_兒子1_達利"
    ]
    
    for username in test_users:
        login_data = {
            "username": username,
            "password": "amis123"
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/auth/login/", json=login_data)
        if response.status_code == 200:
            print(f"✅ {username} 登入成功")
            return True
        else:
            print(f"❌ {username} 登入失敗")
    
    return False

def main():
    print("🔍 檢查Railway上的Pangcah Accounting System資料狀態")
    print("=" * 60)
    
    # 登入獲取token
    token = login()
    if not token:
        return
    
    print("✅ 管理員登入成功")
    
    # 檢查資料狀態
    group_count = check_groups(token)
    event_count = check_events(token)
    
    # 測試阿美族用戶登入
    amis_users_exist = test_amis_user_login()
    
    print("\n📊 資料狀態總結:")
    print(f"- 群組數量: {group_count}")
    print(f"- 活動數量: {event_count}")
    print(f"- 阿美族用戶: {'已創建' if amis_users_exist else '未創建'}")
    
    if group_count == 0 and event_count == 0 and not amis_users_exist:
        print("\n❌ 阿美族社群資料尚未創建")
        print("💡 需要在Railway上執行以下命令:")
        print("python manage.py create_amis_community --settings=pangcah_accounting.settings.railway")
    else:
        print(f"\n✅ 系統資料已初始化")
        if group_count >= 6:  # 六大家族
            print("🏔️ 長光部落六大家族資料已創建")
        if event_count >= 4:  # 四季活動
            print("🎭 四季文化活動已創建")

if __name__ == "__main__":
    main()
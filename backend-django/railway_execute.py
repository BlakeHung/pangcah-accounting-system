#!/usr/bin/env python3
"""
Railway 遠端命令執行工具
通過 HTTP API 觸發 Railway 上的 Django management command
"""

import requests
import time

def trigger_amis_community_creation():
    """通過API觸發阿美族社群資料創建"""
    
    # Railway API 基礎 URL
    base_url = "https://pangcah-accounting-system-production.up.railway.app"
    
    print("🌟 開始通過Railway API創建阿美族社群資料...")
    print("=" * 50)
    
    # 首先檢查API是否運行正常
    try:
        response = requests.get(f"{base_url}/api/health/", timeout=30)
        if response.status_code == 200:
            print("✅ Railway API 運行正常")
        else:
            print(f"⚠️ API 回應狀態碼: {response.status_code}")
    except Exception as e:
        print(f"❌ API 連接失敗: {e}")
        return False
    
    # 由於沒有直接的management command endpoint，
    # 我們需要通過其他方式觸發，比如創建一個測試用戶來間接觸發初始化
    
    print("\n📝 需要手動在Railway執行以下命令：")
    print("python manage.py create_amis_community --settings=pangcah_accounting.settings.railway")
    
    return True

if __name__ == "__main__":
    trigger_amis_community_creation()
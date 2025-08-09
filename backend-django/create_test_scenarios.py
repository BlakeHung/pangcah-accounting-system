#!/usr/bin/env python3
"""
建立完整的測試場景資料
包含：使用者、群組、活動、交易的各種權限測試情境
"""

import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal

# 設定 Django 環境
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'family_finance.settings.development')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.users.models import User
from apps.groups.models import Group, GroupMember  
from apps.events.models import Event, ActivityParticipant, SplitOption
from apps.expenses.models import Expense, ExpenseSplit
from apps.categories.models import Category

def create_test_data():
    print("🚀 開始建立測試場景資料...")
    
    # ===== 1. 建立測試用戶 =====
    print("\n👥 建立測試用戶...")
    
    # 清除現有的非admin用戶（保留admin）
    User.objects.exclude(username='admin').delete()
    
    # 重新建立測試用戶
    users_data = [
        {'username': 'alice', 'name': '愛麗絲(媽媽)', 'email': 'alice@family.com', 'role': 'USER'},
        {'username': 'bob', 'name': '小明(爸爸)', 'email': 'bob@family.com', 'role': 'USER'}, 
        {'username': 'charlie', 'name': '查理(大兒子)', 'email': 'charlie@family.com', 'role': 'USER'},
        {'username': 'diana', 'name': '黛安娜(小女兒)', 'email': 'diana@family.com', 'role': 'USER'},
        {'username': 'edward', 'name': '愛德華(爺爺)', 'email': 'edward@family.com', 'role': 'USER'},
        {'username': 'fiona', 'name': '費歐娜(奶奶)', 'email': 'fiona@family.com', 'role': 'USER'},
        {'username': 'george', 'name': '喬治(叔叔)', 'email': 'george@family.com', 'role': 'USER'},
    ]
    
    created_users = {}
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'name': user_data['name'],
                'email': user_data['email'], 
                'role': user_data['role']
            }
        )
        user.set_password('password123')
        user.save()
        created_users[user_data['username']] = user
        print(f"✅ 用戶: {user.name} ({user.username}) - {user.role}")
    
    admin_user = User.objects.get(username='admin')
    created_users['admin'] = admin_user
    
    # ===== 2. 建立測試群組 =====
    print("\n🏠 建立測試群組...")
    
    Group.objects.all().delete()
    
    # 核心家庭群組 - alice 管理
    nuclear_family = Group.objects.create(
        name='核心家庭',
        description='爸媽和小孩的日常開支群組',
        created_by=admin_user
    )
    nuclear_family.managers.add(created_users['alice'])
    
    # 大家庭群組 - edward 管理  
    extended_family = Group.objects.create(
        name='大家庭聚會',
        description='全家族聚會活動的費用管理',
        created_by=admin_user
    )
    extended_family.managers.add(created_users['edward'])
    
    # 年輕人群組 - charlie 管理
    young_group = Group.objects.create(
        name='年輕人小組', 
        description='年輕一代的活動和聚餐費用',
        created_by=admin_user
    )
    young_group.managers.add(created_users['charlie'])
    
    # 長輩群組 - 沒有特定管理者（只有ADMIN可管理）
    elders_group = Group.objects.create(
        name='長輩聯誼會',
        description='長輩們的活動費用管理', 
        created_by=admin_user
    )
    
    print(f"✅ 群組: {nuclear_family.name} - 管理者: alice")
    print(f"✅ 群組: {extended_family.name} - 管理者: edward") 
    print(f"✅ 群組: {young_group.name} - 管理者: charlie")
    print(f"✅ 群組: {elders_group.name} - 管理者: admin only")
    
    # 添加群組成員
    group_members = [
        # 核心家庭成員
        (nuclear_family, 'alice'),
        (nuclear_family, 'bob'),
        (nuclear_family, 'charlie'),
        (nuclear_family, 'diana'),
        
        # 大家庭成員
        (extended_family, 'alice'),
        (extended_family, 'bob'), 
        (extended_family, 'charlie'),
        (extended_family, 'diana'),
        (extended_family, 'edward'),
        (extended_family, 'fiona'),
        (extended_family, 'george'),
        
        # 年輕人群組
        (young_group, 'charlie'),
        (young_group, 'diana'),
        
        # 長輩群組
        (elders_group, 'edward'),
        (elders_group, 'fiona'),
        (elders_group, 'george'),
    ]
    
    GroupMember.objects.all().delete()
    for group, username in group_members:
        member, created = GroupMember.objects.get_or_create(
            group=group,
            user=created_users[username],
            defaults={'name': created_users[username].name}
        )
    
    # ===== 3. 建立測試分類 =====
    print("\n📊 建立測試分類...")
    
    # 先刪除交易記錄才能刪除分類
    Expense.objects.all().delete()
    ExpenseSplit.objects.all().delete()
    Category.objects.all().delete()
    categories_data = [
        '餐飲', '交通', '娛樂', '購物', '醫療', '教育', '住宿', '其他'
    ]
    
    created_categories = {}
    for name in categories_data:
        category = Category.objects.create(name=name, type='EXPENSE')
        created_categories[name] = category
        print(f"✅ 分類: {name}")
    
    # ===== 4. 建立測試活動 =====
    print("\n🎉 建立測試活動...")
    
    Event.objects.all().delete()
    ActivityParticipant.objects.all().delete()
    
    now = timezone.now()
    
    # 活動 1: 核心家庭週末出遊 (進行中) - alice 管理
    family_trip = Event.objects.create(
        name='家庭週末墾丁之旅',
        description='爸媽帶小孩到墾丁玩兩天一夜',
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=1), 
        status='ACTIVE',
        group=nuclear_family,
        created_by=created_users['alice'],
        allow_split=True,
        budget=Decimal('15000.00')
    )
    family_trip.managers.add(created_users['alice'])
    
    # 活動參與者
    participants_data = [
        (family_trip, 'alice', 'FULL_SPLIT'),
        (family_trip, 'bob', 'FULL_SPLIT'), 
        (family_trip, 'charlie', 'FULL_SPLIT'),
        (family_trip, 'diana', 'FULL_SPLIT'),
    ]
    
    for event, username, split_option in participants_data:
        ActivityParticipant.objects.create(
            activity=event,
            user=created_users[username],
            split_option=split_option
        )
    
    # 活動 2: 年輕人聚餐 (進行中) - charlie 管理
    young_dinner = Event.objects.create(
        name='年輕人火鍋聚會',
        description='charlie 和 diana 約朋友吃火鍋',
        start_date=now,
        end_date=now + timedelta(hours=4),
        status='ACTIVE',
        group=young_group,
        created_by=created_users['charlie'],
        allow_split=True,
        budget=Decimal('2000.00')
    )
    young_dinner.managers.add(created_users['charlie'])
    
    ActivityParticipant.objects.create(
        activity=young_dinner,
        user=created_users['charlie'],
        split_option='FULL_SPLIT'
    )
    ActivityParticipant.objects.create(
        activity=young_dinner, 
        user=created_users['diana'],
        split_option='FULL_SPLIT'
    )
    
    # 活動 3: 大家庭春節聚會 (已完成) - edward 管理
    spring_festival = Event.objects.create(
        name='春節家族團圓飯',
        description='全家族聚在一起吃年夜飯和守歲',
        start_date=now - timedelta(days=30),
        end_date=now - timedelta(days=29),
        status='COMPLETED',
        group=extended_family,
        created_by=created_users['edward'],
        allow_split=True,
        budget=Decimal('8000.00')
    )
    spring_festival.managers.add(created_users['edward'])
    
    # 所有大家庭成員參加
    for username in ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george']:
        ActivityParticipant.objects.create(
            activity=spring_festival,
            user=created_users[username],
            split_option='FULL_SPLIT'
        )
    
    # 活動 4: 長輩健檢活動 (計劃中) - admin 管理，但 edward 不是參與者
    health_check = Event.objects.create(
        name='長輩健康檢查',
        description='安排長輩們去醫院做年度健檢',
        start_date=now + timedelta(days=7),
        end_date=now + timedelta(days=7), 
        status='ACTIVE',
        group=elders_group,
        created_by=admin_user,
        allow_split=False,  # 不允許分攤
        budget=Decimal('12000.00')
    )
    health_check.managers.add(admin_user)
    health_check.managers.add(created_users['edward'])  # edward 是管理者但不是參與者
    
    # 只有 fiona 和 george 參與
    ActivityParticipant.objects.create(
        activity=health_check,
        user=created_users['fiona'],
        split_option='NO_SPLIT'
    )
    ActivityParticipant.objects.create(
        activity=health_check,
        user=created_users['george'], 
        split_option='NO_SPLIT'
    )
    
    print(f"✅ 活動: {family_trip.name} - 管理者: alice (進行中)")
    print(f"✅ 活動: {young_dinner.name} - 管理者: charlie (進行中)")
    print(f"✅ 活動: {spring_festival.name} - 管理者: edward (已完成)")
    print(f"✅ 活動: {health_check.name} - 管理者: admin, edward (edward非參與者)")
    
    # ===== 5. 建立測試交易 =====
    print("\n💰 建立測試交易...")
    
    # 交易記錄已在分類建立時清除，這裡不需要再次刪除
    
    # 墾丁旅行的支出
    # 1. 住宿費 - alice 支付，4人平分
    accommodation = Expense.objects.create(
        amount=Decimal('3200.00'),
        type='EXPENSE',
        date=now - timedelta(hours=12),
        description='墾丁民宿住宿費 兩晚',
        user=created_users['alice'],
        category=created_categories['住宿'],
        event=family_trip,
        group=nuclear_family
    )
    
    # 建立分攤記錄
    for username in ['alice', 'bob', 'charlie', 'diana']:
        ExpenseSplit.objects.create(
            expense=accommodation,
            participant=created_users[username], 
            split_type='AVERAGE',
            split_value=1,
            calculated_amount=Decimal('800.00')
        )
    
    # 2. 晚餐費用 - bob 支付
    dinner = Expense.objects.create(
        amount=Decimal('1800.00'),
        type='EXPENSE',
        date=now - timedelta(hours=8),
        description='海鮮餐廳晚餐',
        user=created_users['bob'],
        category=created_categories['餐飲'],
        event=family_trip,
        group=nuclear_family
    )
    
    for username in ['alice', 'bob', 'charlie', 'diana']:
        ExpenseSplit.objects.create(
            expense=dinner,
            participant=created_users[username],
            split_type='AVERAGE', 
            split_value=1,
            calculated_amount=Decimal('450.00')
        )
    
    # 3. 交通費 - charlie 支付，按比例分攤（大人多付）
    transport = Expense.objects.create(
        amount=Decimal('1200.00'),
        type='EXPENSE', 
        date=now - timedelta(hours=14),
        description='高鐵來回車票',
        user=created_users['charlie'],
        category=created_categories['交通'],
        event=family_trip,
        group=nuclear_family
    )
    
    # 大人付多一點，小孩少一點
    split_ratios = [
        ('alice', 1.5, Decimal('360.00')),
        ('bob', 1.5, Decimal('360.00')),  
        ('charlie', 1.0, Decimal('240.00')),
        ('diana', 1.0, Decimal('240.00')),
    ]
    
    for username, ratio, amount in split_ratios:
        ExpenseSplit.objects.create(
            expense=transport,
            participant=created_users[username],
            split_type='RATIO',
            split_value=ratio,
            calculated_amount=amount
        )
    
    # 年輕人聚餐支出
    hotpot = Expense.objects.create(
        amount=Decimal('800.00'),
        type='EXPENSE',
        date=now - timedelta(minutes=30), 
        description='麻辣火鍋吃到飽',
        user=created_users['charlie'],
        category=created_categories['餐飲'],
        event=young_dinner,
        group=young_group
    )
    
    for username in ['charlie', 'diana']:
        ExpenseSplit.objects.create(
            expense=hotpot,
            participant=created_users[username],
            split_type='AVERAGE',
            split_value=1,
            calculated_amount=Decimal('400.00')
        )
    
    # 春節聚會支出 (已完成活動)
    spring_food = Expense.objects.create(
        amount=Decimal('5500.00'),
        type='EXPENSE',
        date=now - timedelta(days=30),
        description='年夜飯食材和紅包',
        user=created_users['edward'], 
        category=created_categories['餐飲'],
        event=spring_festival,
        group=extended_family
    )
    
    # 7人平分
    for username in ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george']:
        ExpenseSplit.objects.create(
            expense=spring_food,
            participant=created_users[username],
            split_type='AVERAGE',
            split_value=1,
            calculated_amount=Decimal('785.71')  # 5500/7
        )
    
    # 健檢活動支出 (edward 以管理者身份新增，但不參與)
    health_expense = Expense.objects.create(
        amount=Decimal('6000.00'),
        type='EXPENSE',
        date=now + timedelta(hours=1),
        description='健檢預付款',
        user=created_users['edward'],  # edward 管理者支付
        category=created_categories['醫療'],
        event=health_check,
        group=elders_group
    )
    
    # 只有實際參與者分攤
    for username in ['fiona', 'george']:
        ExpenseSplit.objects.create(
            expense=health_expense,
            participant=created_users[username],
            split_type='AVERAGE',
            split_value=1,
            calculated_amount=Decimal('3000.00')
        )
    
    print(f"✅ 交易: {accommodation.description} - NT${accommodation.amount}")
    print(f"✅ 交易: {dinner.description} - NT${dinner.amount}")
    print(f"✅ 交易: {transport.description} - NT${transport.amount}")
    print(f"✅ 交易: {hotpot.description} - NT${hotpot.amount}")
    print(f"✅ 交易: {spring_food.description} - NT${spring_food.amount}")
    print(f"✅ 交易: {health_expense.description} - NT${health_expense.amount}")
    
    # ===== 統計資料 =====
    print("\n📊 測試資料建立完成統計:")
    print(f"👥 用戶數量: {User.objects.count()}")
    print(f"🏠 群組數量: {Group.objects.count()}") 
    print(f"👨‍👩‍👧‍👦 群組成員數: {GroupMember.objects.count()}")
    print(f"🎉 活動數量: {Event.objects.count()}")
    print(f"🎭 活動參與記錄: {ActivityParticipant.objects.count()}")
    print(f"💰 交易數量: {Expense.objects.count()}")
    print(f"🔄 分攤記錄數: {ExpenseSplit.objects.count()}")
    print(f"📊 分類數量: {Category.objects.count()}")

def print_test_scenarios():
    """印出測試情境說明"""
    print("\n" + "="*60)
    print("🧪 測試情境說明")
    print("="*60)
    
    print("\n🔐 權限測試情境：")
    print("\n1. 新增活動權限測試：")
    print("   ✅ admin - 超級管理員，可建立任何活動")
    print("   ✅ alice - 核心家庭管理者，可建立活動")  
    print("   ✅ edward - 大家庭管理者，可建立活動")
    print("   ✅ charlie - 年輕人群組管理者，可建立活動")
    print("   ❌ bob, diana, fiona, george - 一般用戶，無法建立活動")
    
    print("\n2. 新增支出權限測試：")
    print("   📍 進行中活動 (家庭墾丁旅行)：")
    print("     ✅ alice, bob, charlie, diana - 活動參與者可新增支出")
    print("     ❌ edward, fiona, george - 非參與者無法新增支出")
    
    print("   📍 已完成活動 (春節家族聚會)：")
    print("     ✅ edward - 活動管理者可在已完成活動新增支出")
    print("     ✅ admin - 超級管理員可新增支出")
    print("     ❌ alice, bob, charlie - 一般參與者無法在已完成活動新增支出")
    
    print("   📍 管理者非參與者情境 (健檢活動)：")
    print("     ✅ edward - 活動管理者但非參與者，可新增支出")
    print("     ✅ admin - 超級管理員，可新增支出")
    print("     ✅ fiona, george - 活動參與者，可新增支出")
    print("     ❌ alice, bob, charlie, diana - 非參與者無法新增支出")
    
    print("\n3. 編輯活動權限測試：")
    print("   ✅ admin - 可編輯所有活動")
    print("   ✅ alice - 可編輯家庭旅行活動(自己管理)")
    print("   ✅ charlie - 可編輯年輕人聚餐(自己管理)")
    print("   ✅ edward - 可編輯春節聚會和健檢活動(自己管理)")
    print("   ❌ bob, diana, fiona, george - 無法編輯任何活動")
    
    print("\n💰 分攤測試情境：")
    print("\n1. 平均分攤：住宿費 4人平分，每人800元")
    print("2. 比例分攤：交通費按年齡比例，大人1.5倍，小孩1倍")
    print("3. 跨群組分攤：春節聚會7人參與，跨越多個群組成員")
    print("4. 管理者非參與者：edward 管理健檢活動但不參與分攤")
    
    print("\n📊 資料驗證測試：")
    print("\n1. 群組管理者身份：")
    print("   - alice 管理核心家庭群組")
    print("   - edward 管理大家庭群組") 
    print("   - charlie 管理年輕人群組")
    print("   - 長輩聯誼會只有admin可管理")
    
    print("\n2. 活動狀態測試：")
    print("   - 家庭旅行：進行中，允許分攤，有預算")
    print("   - 年輕人聚餐：進行中，允許分攤")
    print("   - 春節聚會：已完成，允許分攤")
    print("   - 健檢活動：計劃中，不允許分攤")
    
    print("\n🧪 建議測試步驟：")
    print("1. 用不同用戶登入前端系統")
    print("2. 檢查「新增活動」按鈕是否正確顯示")
    print("3. 測試在不同活動中新增支出的權限")
    print("4. 驗證分攤計算的正確性")
    print("5. 測試已完成活動的支出新增限制")
    print("6. 驗證管理者非參與者的特殊情境")
    
    print("\n🔑 測試帳號：")
    print("所有用戶密碼都是: password123")
    for username in ['admin', 'alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george']:
        print(f"- {username}")

if __name__ == '__main__':
    try:
        create_test_data()
        print_test_scenarios()
        print("\n🎉 測試資料建立成功！")
        print("💡 請使用上述帳號登入前端系統進行測試")
    except Exception as e:
        print(f"❌ 建立測試資料時發生錯誤: {e}")
        import traceback
        traceback.print_exc()
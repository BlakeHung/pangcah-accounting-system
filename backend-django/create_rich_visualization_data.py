#!/usr/bin/env python3
"""
創建豐富的視覺化測試資料
包含：多個三天兩夜活動、不同狀態、各種交易類型，適合數據視覺化展示
"""

import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random

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

def create_rich_visualization_data():
    print("🎨 開始創建豐富的視覺化測試資料...")
    
    # 清除舊資料但保留用戶和群組
    print("\n🗑️ 清理舊的活動和交易資料...")
    Expense.objects.all().delete()
    ExpenseSplit.objects.all().delete()
    Event.objects.all().delete()
    ActivityParticipant.objects.all().delete()
    
    # 獲取現有用戶
    users = {
        'admin': User.objects.get(username='admin'),
        'alice': User.objects.get(username='alice'), 
        'bob': User.objects.get(username='bob'),
        'charlie': User.objects.get(username='charlie'),
        'diana': User.objects.get(username='diana'),
        'edward': User.objects.get(username='edward'),
        'fiona': User.objects.get(username='fiona'),
        'george': User.objects.get(username='george'),
    }
    
    # 獲取現有群組
    nuclear_family = Group.objects.get(name='核心家庭')
    extended_family = Group.objects.get(name='大家庭聚會')
    young_group = Group.objects.get(name='年輕人小組')
    elders_group = Group.objects.get(name='長輩聯誼會')
    
    # 獲取分類
    categories = {cat.name: cat for cat in Category.objects.all()}
    
    now = timezone.now()
    
    # ===== 創建多個三天兩夜旅遊活動 =====
    activities = []
    
    # 活動1: 2024年6月 - 台東三天兩夜之旅 (已完成)
    taitung_trip = Event.objects.create(
        name='台東知本溫泉三天兩夜之旅',
        description='全家一起到台東知本泡溫泉、看海景，體驗原住民文化',
        start_date=now - timedelta(days=120),  # 4個月前
        end_date=now - timedelta(days=118),
        status='COMPLETED',
        group=extended_family,
        created_by=users['alice'],
        allow_split=True,
        budget=Decimal('25000.00')
    )
    taitung_trip.managers.add(users['alice'])
    activities.append(taitung_trip)
    
    # 所有大家庭成員參加
    for username in ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george']:
        ActivityParticipant.objects.create(
            activity=taitung_trip,
            user=users[username],
            split_option='FULL_SPLIT'
        )
    
    # 活動2: 2024年8月 - 清境農場三天兩夜 (已完成)  
    cingjing_trip = Event.objects.create(
        name='清境農場高山避暑三天兩夜',
        description='到清境農場看羊咩咩、賞雲海，享受涼爽的高山氣候',
        start_date=now - timedelta(days=60),  # 2個月前
        end_date=now - timedelta(days=58),
        status='COMPLETED',
        group=nuclear_family,
        created_by=users['bob'],
        allow_split=True,
        budget=Decimal('18000.00')
    )
    cingjing_trip.managers.add(users['bob'])
    activities.append(cingjing_trip)
    
    # 核心家庭成員參加
    for username in ['alice', 'bob', 'charlie', 'diana']:
        ActivityParticipant.objects.create(
            activity=cingjing_trip,
            user=users[username],
            split_option='FULL_SPLIT'
        )
    
    # 活動3: 2024年10月 - 花蓮太魯閣三天兩夜 (進行中)
    taroko_trip = Event.objects.create(
        name='花蓮太魯閣峽谷三天兩夜探險',
        description='探索太魯閣國家公園的壯麗峽谷，體驗原住民部落文化',
        start_date=now - timedelta(days=2),  # 2天前開始
        end_date=now + timedelta(days=1),    # 還有1天結束
        status='ACTIVE',
        group=extended_family,
        created_by=users['edward'],
        allow_split=True,
        budget=Decimal('22000.00')
    )
    taroko_trip.managers.add(users['edward'])
    activities.append(taroko_trip)
    
    # 大部分家庭成員參加（fiona因身體不適未參加）
    for username in ['alice', 'bob', 'charlie', 'diana', 'edward', 'george']:
        ActivityParticipant.objects.create(
            activity=taroko_trip,
            user=users[username],
            split_option='FULL_SPLIT'
        )
    
    # 活動4: 2024年12月 - 阿里山日出三天兩夜 (計劃中)
    alishan_trip = Event.objects.create(
        name='阿里山日出雲海三天兩夜',
        description='上阿里山看日出、搭小火車、賞櫻花季前的山景',
        start_date=now + timedelta(days=30),  # 一個月後
        end_date=now + timedelta(days=32),
        status='PLANNED',
        group=extended_family,
        created_by=users['charlie'],
        allow_split=True,
        budget=Decimal('20000.00')
    )
    alishan_trip.managers.add(users['charlie'])
    activities.append(alishan_trip)
    
    # 全家都計劃參加
    for username in ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george']:
        ActivityParticipant.objects.create(
            activity=alishan_trip,
            user=users[username],
            split_option='FULL_SPLIT'
        )
    
    print(f"\n🎉 創建了 {len(activities)} 個三天兩夜旅遊活動")
    
    # ===== 為每個活動創建詳細的交易記錄 =====
    
    # 台東知本溫泉之旅的詳細支出
    create_taitung_expenses(taitung_trip, users, categories, now)
    
    # 清境農場之旅的詳細支出  
    create_cingjing_expenses(cingjing_trip, users, categories, now)
    
    # 花蓮太魯閣之旅的詳細支出（進行中）
    create_taroko_expenses(taroko_trip, users, categories, now)
    
    # 阿里山之旅的預付支出
    create_alishan_expenses(alishan_trip, users, categories, now)
    
    # ===== 創建日常小額支出記錄 =====
    create_daily_expenses(users, categories, now)
    
    # ===== 統計資料 =====
    print("\n📊 視覺化測試資料創建完成統計:")
    print(f"🎉 活動數量: {Event.objects.count()}")
    print(f"👥 活動參與記錄: {ActivityParticipant.objects.count()}")
    print(f"💰 交易數量: {Expense.objects.count()}")
    print(f"🔄 分攤記錄數: {ExpenseSplit.objects.count()}")
    
    # 按活動統計
    for activity in activities:
        expense_count = Expense.objects.filter(event=activity).count()
        total_amount = sum(exp.amount for exp in Expense.objects.filter(event=activity))
        print(f"   📍 {activity.name}: {expense_count}筆交易, 總計NT${total_amount}")

def create_taitung_expenses(activity, users, categories, now):
    """創建台東知本溫泉之旅的詳細支出記錄"""
    base_date = activity.start_date
    
    # Day 1 - 出發日
    # 交通費：高鐵票
    transport1 = Expense.objects.create(
        amount=Decimal('4200.00'),
        type='EXPENSE',
        date=base_date - timedelta(hours=2),
        description='高鐵台北-台東來回車票 7張',
        user=users['alice'],
        category=categories['交通'],
        event=activity,
        group=activity.group
    )
    create_equal_split(transport1, users, ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george'])
    
    # 午餐：池上便當
    lunch1 = Expense.objects.create(
        amount=Decimal('525.00'),
        type='EXPENSE',
        date=base_date + timedelta(hours=4),
        description='池上火車便當 7個',
        user=users['bob'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(lunch1, users, ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george'])
    
    # 住宿：知本溫泉飯店
    hotel1 = Expense.objects.create(
        amount=Decimal('8400.00'),
        type='EXPENSE',
        date=base_date + timedelta(hours=6),
        description='知本溫泉飯店 3間房 2晚',
        user=users['edward'],
        category=categories['住宿'],
        event=activity,
        group=activity.group
    )
    create_equal_split(hotel1, users, ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george'])
    
    # 晚餐：原住民風味餐廳
    dinner1 = Expense.objects.create(
        amount=Decimal('2100.00'),
        type='EXPENSE',
        date=base_date + timedelta(hours=12),
        description='原住民風味餐廳晚餐',
        user=users['charlie'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(dinner1, users, ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george'])
    
    # Day 2 - 遊玩日
    # 早餐：飯店自助餐
    breakfast2 = Expense.objects.create(
        amount=Decimal('1050.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=8),
        description='飯店自助早餐 7位',
        user=users['diana'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(breakfast2, users, ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george'])
    
    # 門票：初鹿牧場
    ticket1 = Expense.objects.create(
        amount=Decimal('700.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=10),
        description='初鹿牧場門票 7張',
        user=users['fiona'],
        category=categories['娛樂'],
        event=activity,
        group=activity.group
    )
    create_equal_split(ticket1, users, ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george'])
    
    # 午餐：牧場餐廳
    lunch2 = Expense.objects.create(
        amount=Decimal('1575.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=13),
        description='初鹿牧場餐廳午餐',
        user=users['george'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(lunch2, users, ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george'])
    
    # 購物：台東名產
    shopping1 = Expense.objects.create(
        amount=Decimal('1800.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=16),
        description='台東名產：釋迦、洛神花茶等',
        user=users['alice'],
        category=categories['購物'],
        event=activity,
        group=activity.group
    )
    create_equal_split(shopping1, users, ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george'])
    
    # 晚餐：海鮮餐廳
    dinner2 = Expense.objects.create(
        amount=Decimal('2800.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=19),
        description='台東海鮮餐廳晚餐',
        user=users['bob'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(dinner2, users, ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george'])
    
    # Day 3 - 回程日
    # 早餐：飯店退房
    breakfast3 = Expense.objects.create(
        amount=Decimal('350.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=2, hours=8),
        description='便利商店早餐',
        user=users['charlie'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(breakfast3, users, ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george'])
    
    # 租車費：遊覽當地
    car_rental = Expense.objects.create(
        amount=Decimal('1600.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=2, hours=9),
        description='租車費用 2天',
        user=users['edward'],
        category=categories['交通'],
        event=activity,
        group=activity.group
    )
    create_equal_split(car_rental, users, ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george'])

def create_cingjing_expenses(activity, users, categories, now):
    """創建清境農場之旅的詳細支出記錄"""
    base_date = activity.start_date
    participants = ['alice', 'bob', 'charlie', 'diana']
    
    # Day 1
    # 交通費：開車油錢過路費
    transport1 = Expense.objects.create(
        amount=Decimal('1200.00'),
        type='EXPENSE',
        date=base_date - timedelta(hours=1),
        description='開車到清境農場 油錢+過路費',
        user=users['bob'],
        category=categories['交通'],
        event=activity,
        group=activity.group
    )
    create_equal_split(transport1, users, participants)
    
    # 午餐：埔里小鎮
    lunch1 = Expense.objects.create(
        amount=Decimal('800.00'),
        type='EXPENSE',
        date=base_date + timedelta(hours=3),
        description='埔里小鎮午餐',
        user=users['alice'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(lunch1, users, participants)
    
    # 住宿：清境民宿
    hotel1 = Expense.objects.create(
        amount=Decimal('4800.00'),
        type='EXPENSE',
        date=base_date + timedelta(hours=5),
        description='清境民宿 2間房 2晚',
        user=users['charlie'],
        category=categories['住宿'],
        event=activity,
        group=activity.group
    )
    create_equal_split(hotel1, users, participants)
    
    # 門票：清境農場
    ticket1 = Expense.objects.create(
        amount=Decimal('640.00'),
        type='EXPENSE',
        date=base_date + timedelta(hours=6),
        description='清境農場門票 4張',
        user=users['diana'],
        category=categories['娛樂'],
        event=activity,
        group=activity.group
    )
    create_equal_split(ticket1, users, participants)
    
    # 晚餐：民宿餐廳
    dinner1 = Expense.objects.create(
        amount=Decimal('1600.00'),
        type='EXPENSE',
        date=base_date + timedelta(hours=12),
        description='民宿餐廳晚餐',
        user=users['bob'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(dinner1, users, participants)
    
    # Day 2
    # 早餐：民宿早餐
    breakfast2 = Expense.objects.create(
        amount=Decimal('400.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=8),
        description='民宿早餐 4位',
        user=users['alice'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(breakfast2, users, participants)
    
    # 門票：合歡山
    ticket2 = Expense.objects.create(
        amount=Decimal('200.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=10),
        description='合歡山停車費',
        user=users['charlie'],
        category=categories['交通'],
        event=activity,
        group=activity.group
    )
    create_equal_split(ticket2, users, participants)
    
    # 午餐：山上餐廳
    lunch2 = Expense.objects.create(
        amount=Decimal('1200.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=13),
        description='合歡山餐廳午餐',
        user=users['diana'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(lunch2, users, participants)
    
    # 購物：高山高麗菜
    shopping1 = Expense.objects.create(
        amount=Decimal('600.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=15),
        description='高山高麗菜和水果',
        user=users['alice'],
        category=categories['購物'],
        event=activity,
        group=activity.group
    )
    create_equal_split(shopping1, users, participants)
    
    # 晚餐：清境餐廳
    dinner2 = Expense.objects.create(
        amount=Decimal('2000.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=19),
        description='清境景觀餐廳晚餐',
        user=users['bob'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(dinner2, users, participants)
    
    # Day 3
    # 早餐：民宿早餐
    breakfast3 = Expense.objects.create(
        amount=Decimal('400.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=2, hours=8),
        description='民宿早餐 4位',
        user=users['charlie'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(breakfast3, users, participants)
    
    # 門票：小瑞士花園
    ticket3 = Expense.objects.create(
        amount=Decimal('480.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=2, hours=10),
        description='小瑞士花園門票 4張',
        user=users['diana'],
        category=categories['娛樂'],
        event=activity,
        group=activity.group
    )
    create_equal_split(ticket3, users, participants)
    
    # 午餐：回程路上
    lunch3 = Expense.objects.create(
        amount=Decimal('600.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=2, hours=14),
        description='回程午餐',
        user=users['alice'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(lunch3, users, participants)

def create_taroko_expenses(activity, users, categories, now):
    """創建花蓮太魯閣之旅的詳細支出記錄（進行中）"""
    base_date = activity.start_date
    participants = ['alice', 'bob', 'charlie', 'diana', 'edward', 'george']
    
    # Day 1 - 已發生的支出
    transport1 = Expense.objects.create(
        amount=Decimal('3600.00'),
        type='EXPENSE',
        date=base_date - timedelta(hours=1),
        description='台鐵自強號台北-花蓮來回車票 6張',
        user=users['edward'],
        category=categories['交通'],
        event=activity,
        group=activity.group
    )
    create_equal_split(transport1, users, participants)
    
    lunch1 = Expense.objects.create(
        amount=Decimal('900.00'),
        type='EXPENSE',
        date=base_date + timedelta(hours=4),
        description='花蓮火車站便當',
        user=users['alice'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(lunch1, users, participants)
    
    hotel1 = Expense.objects.create(
        amount=Decimal('7200.00'),
        type='EXPENSE',
        date=base_date + timedelta(hours=6),
        description='花蓮市區飯店 3間房 2晚',
        user=users['george'],
        category=categories['住宿'],
        event=activity,
        group=activity.group
    )
    create_equal_split(hotel1, users, participants)
    
    dinner1 = Expense.objects.create(
        amount=Decimal('1800.00'),
        type='EXPENSE',
        date=base_date + timedelta(hours=12),
        description='花蓮東大門夜市晚餐',
        user=users['bob'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(dinner1, users, participants)
    
    # Day 2 - 已發生的支出  
    breakfast2 = Expense.objects.create(
        amount=Decimal('480.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=8),
        description='飯店早餐 6位',
        user=users['charlie'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(breakfast2, users, participants)
    
    # 包車遊太魯閣
    car_tour = Expense.objects.create(
        amount=Decimal('2400.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=9),
        description='包車遊太魯閣一日遊',
        user=users['diana'],
        category=categories['交通'],
        event=activity,
        group=activity.group
    )
    create_equal_split(car_tour, users, participants)
    
    lunch2 = Expense.objects.create(
        amount=Decimal('1200.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=13),
        description='天祥餐廳午餐',
        user=users['edward'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(lunch2, users, participants)
    
    shopping1 = Expense.objects.create(
        amount=Decimal('1500.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=16),
        description='花蓮名產：花蓮薯、麻糬等',
        user=users['alice'],
        category=categories['購物'],
        event=activity,
        group=activity.group
    )
    create_equal_split(shopping1, users, participants)
    
    dinner2 = Expense.objects.create(
        amount=Decimal('2400.00'),
        type='EXPENSE',
        date=base_date + timedelta(days=1, hours=19),
        description='原住民料理餐廳晚餐',
        user=users['george'],
        category=categories['餐飲'],
        event=activity,
        group=activity.group
    )
    create_equal_split(dinner2, users, participants)

def create_alishan_expenses(activity, users, categories, now):
    """創建阿里山之旅的預付支出"""
    base_date = activity.start_date
    participants = ['alice', 'bob', 'charlie', 'diana', 'edward', 'fiona', 'george']
    
    # 預訂支出
    hotel_deposit = Expense.objects.create(
        amount=Decimal('6000.00'),
        type='EXPENSE',
        date=now - timedelta(days=10),
        description='阿里山賓館訂房訂金',
        user=users['charlie'],
        category=categories['住宿'],
        event=activity,
        group=activity.group
    )
    create_equal_split(hotel_deposit, users, participants)
    
    train_tickets = Expense.objects.create(
        amount=Decimal('2100.00'),
        type='EXPENSE',
        date=now - timedelta(days=5),
        description='阿里山森林鐵路車票預訂',
        user=users['alice'],
        category=categories['交通'],
        event=activity,
        group=activity.group
    )
    create_equal_split(train_tickets, users, participants)

def create_daily_expenses(users, categories, now):
    """創建日常小額支出記錄，增加資料豐富度"""
    
    # 過去6個月的日常支出
    for i in range(180):  # 180天
        expense_date = now - timedelta(days=i)
        
        # 隨機決定是否有支出（70%機率）
        if random.random() < 0.7:
            # 隨機選擇用戶
            user = random.choice(list(users.values()))
            
            # 根據日期決定支出類型和金額
            if expense_date.weekday() < 5:  # 平日
                # 工作日常見支出
                expense_types = [
                    ('早餐', '餐飲', 80, 150),
                    ('午餐', '餐飲', 120, 300),
                    ('晚餐', '餐飲', 200, 500),
                    ('交通費', '交通', 50, 200),
                    ('咖啡', '餐飲', 60, 120),
                ]
            else:  # 週末
                # 週末休閒支出
                expense_types = [
                    ('早午餐', '餐飲', 200, 600),
                    ('看電影', '娛樂', 280, 350),
                    ('購物', '購物', 500, 2000),
                    ('聚餐', '餐飲', 400, 1200),
                    ('咖啡廳', '餐飲', 150, 400),
                ]
            
            # 隨機選擇支出類型
            desc, cat_name, min_amount, max_amount = random.choice(expense_types)
            amount = Decimal(str(random.randint(min_amount, max_amount)))
            
            # 創建支出記錄（不屬於任何活動）
            Expense.objects.create(
                amount=amount,
                type='EXPENSE',
                date=expense_date,
                description=f'{desc} - 日常支出',
                user=user,
                category=categories[cat_name],
                event=None,  # 日常支出不屬於活動
                group=None
            )

def create_equal_split(expense, users, participant_usernames):
    """創建平均分攤記錄"""
    amount_per_person = expense.amount / len(participant_usernames)
    
    for username in participant_usernames:
        ExpenseSplit.objects.create(
            expense=expense,
            participant=users[username],
            split_type='AVERAGE',
            split_value=1,
            calculated_amount=amount_per_person
        )

def print_visualization_summary():
    """印出視覺化資料摘要"""
    print("\n" + "="*60)
    print("📊 視覺化資料摘要")
    print("="*60)
    
    # 活動統計
    activities = Event.objects.all().order_by('start_date')
    print(f"\n🎉 活動總數: {activities.count()}")
    for activity in activities:
        expense_count = Expense.objects.filter(event=activity).count()
        total_amount = sum(exp.amount for exp in Expense.objects.filter(event=activity))
        participant_count = ActivityParticipant.objects.filter(activity=activity).count()
        print(f"   📍 {activity.name}")
        print(f"      狀態: {activity.get_status_display()}")
        print(f"      參與人數: {participant_count}人")
        print(f"      支出記錄: {expense_count}筆")
        print(f"      總金額: NT${total_amount}")
    
    # 用戶支出統計
    print(f"\n👥 用戶支出統計:")
    for username, user in [('alice', User.objects.get(username='alice')), 
                          ('bob', User.objects.get(username='bob')),
                          ('charlie', User.objects.get(username='charlie')),
                          ('diana', User.objects.get(username='diana')),
                          ('edward', User.objects.get(username='edward')),
                          ('fiona', User.objects.get(username='fiona')),
                          ('george', User.objects.get(username='george'))]:
        expense_count = Expense.objects.filter(user=user).count()
        total_paid = sum(exp.amount for exp in Expense.objects.filter(user=user))
        total_owed = sum(split.calculated_amount for split in ExpenseSplit.objects.filter(participant=user))
        print(f"   💸 {user.name}: 支付{expense_count}筆 NT${total_paid}, 分攤欠款 NT${total_owed}")
    
    # 分類支出統計  
    print(f"\n📊 支出分類統計:")
    for category in Category.objects.filter(type='EXPENSE'):
        expense_count = Expense.objects.filter(category=category).count()
        total_amount = sum(exp.amount for exp in Expense.objects.filter(category=category))
        if expense_count > 0:
            print(f"   📈 {category.name}: {expense_count}筆, NT${total_amount}")
    
    # 月份支出統計
    print(f"\n📅 近6個月支出趨勢:")
    from django.db.models import Sum, Count
    from django.db.models.functions import TruncMonth
    
    monthly_stats = (Expense.objects
                    .filter(date__gte=timezone.now() - timedelta(days=180))
                    .annotate(month=TruncMonth('date'))
                    .values('month')
                    .annotate(total=Sum('amount'), count=Count('id'))
                    .order_by('month'))
    
    for stat in monthly_stats:
        month_str = stat['month'].strftime('%Y年%m月')
        print(f"   📊 {month_str}: {stat['count']}筆, NT${stat['total']}")

if __name__ == '__main__':
    try:
        create_rich_visualization_data()
        print_visualization_summary()
        print("\n🎨 豐富的視覺化測試資料創建成功！")
        print("💡 現在可以開始實作數據視覺化功能")
        print("\n📈 建議的視覺化圖表:")
        print("1. 月份支出趨勢線圖")
        print("2. 支出分類圓餅圖") 
        print("3. 用戶支出比較長條圖")
        print("4. 活動支出統計圖")
        print("5. 每日支出熱力圖")
    except Exception as e:
        print(f"❌ 創建視覺化資料時發生錯誤: {e}")
        import traceback
        traceback.print_exc()
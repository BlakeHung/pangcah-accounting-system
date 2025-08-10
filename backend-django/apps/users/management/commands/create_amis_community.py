from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.groups.models import Group, GroupMember
from apps.categories.models import Category
from apps.events.models import Event
from apps.expenses.models import Expense, ExpenseSplit
from django.utils import timezone
from datetime import datetime, timedelta
import random
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = '創建海岸阿美族社群模擬資料'
    
    def __init__(self):
        super().__init__()
        self.users_created = {}
        self.families = {}
        self.events = {}
        
        # 長光部落六大家族名稱
        self.family_names = [
            'Cilangasan', 'Paketaolan', 'Nakao', 'Lifok', 'Tayal', 'Sakizaya'
        ]
        
        # 對應中文名
        self.family_chinese_names = {
            'Cilangasan': '奇拉雅善',
            'Paketaolan': '巴格豆蘭', 
            'Nakao': '那告',
            'Lifok': '立霧',
            'Tayal': '太魯閣',
            'Sakizaya': '撒奇萊雅'
        }
        
        # 阿美族常見名字
        self.amis_male_names = [
            '拉罕', '達利', '巴奈', '布農', '吉娃', '拉黑',
            '阿布', '馬躍', '達摩', '卡照', '夏曼', '撒基'
        ]
        
        self.amis_female_names = [
            '芭翁', '依布', '莎韻', '伊祈', '樂娃', '娜麗',
            '哈妮', '慕伊', '阿美', '娃哈', '芭娜', '露伊'
        ]
        
        self.amis_surnames = [
            '潘志', '林志', '廖守', '范振', '張進', '郭明'
        ]

    def handle(self, *args, **options):
        self.stdout.write('🏔️ 開始創建海岸阿美族社群資料...\n')
        
        # 1. 創建長光部落主群組
        self.create_main_group()
        
        # 2. 創建六大家族
        self.create_families()
        
        # 3. 創建家族成員 (三代人)
        self.create_family_members()
        
        # 4. 創建文化相關支出分類
        self.create_cultural_categories()
        
        # 5. 創建一年四季的活動
        self.create_seasonal_events()
        
        # 6. 創建活動相關支出
        self.create_event_expenses()
        
        # 7. 創建日常交易記錄
        self.create_daily_transactions()
        
        # 8. 創建家族間借貸記錄
        self.create_family_lending()
        
        # 9. 創建季節性收入記錄
        self.create_seasonal_income()
        
        self.stdout.write(self.style.SUCCESS('\n✨ 長光部落社群資料創建完成！'))
        self.display_summary()

    def create_main_group(self):
        """創建長光部落主群組"""
        self.stdout.write('🏘️ 創建長光部落主群組...')
        
        admin = User.objects.get(username='admin')
        
        self.main_group, created = Group.objects.get_or_create(
            name='長光部落 Cilangasan',
            defaults={
                'description': '海岸阿美族長光部落，包含六大傳統家族，定期舉辦季節性文化活動與祭典',
                'created_by': admin
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('✅ 長光部落群組創建成功'))
            # 系統管理員也是部落總管理者
            self.main_group.managers.add(admin)
            self.stdout.write('    👤 指定系統管理員為部落總管理者')
        else:
            self.stdout.write(self.style.WARNING('⚠️ 長光部落群組已存在'))

    def create_families(self):
        """創建六大家族群組"""
        self.stdout.write('\n👨‍👩‍👧‍👦 創建長光部落六大家族...')
        
        admin = User.objects.get(username='admin')
        
        for family_name in self.family_names:
            chinese_name = self.family_chinese_names[family_name]
            family_group, created = Group.objects.get_or_create(
                name=f'{family_name}家族 ({chinese_name})',
                defaults={
                    'description': f'{family_name} ({chinese_name}) - 長光部落傳統家族，參與所有季節性文化活動與祭典',
                    'created_by': admin
                }
            )
            
            self.families[family_name] = family_group
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ {family_name} ({chinese_name}) 家族創建成功'))

    def create_family_members(self):
        """為每個家族創建三代成員"""
        self.stdout.write('\n👥 為每個家族創建三代成員...')
        
        for family_name, family_group in self.families.items():
            self.stdout.write(f'\n  創建 {family_name}家族成員:')
            
            # 隨機決定家族成員數量和缺失情況
            has_grandfather = random.choice([True, False, True])  # 66% 有爺爺
            has_grandmother = random.choice([True, False, True])  # 66% 有奶奶
            has_father = True  # 家族一定有父親
            has_mother = random.choice([True, False, True, True])  # 75% 有母親
            num_children = random.randint(1, 4)  # 1-4個孫子女
            
            family_members = []
            
            # 爺爺 (70-85歲)
            if has_grandfather:
                grandfather = self.create_user(
                    family_name, '爺爺', 'M', 
                    random.randint(70, 85)
                )
                family_members.append(grandfather)
            
            # 奶奶 (65-80歲)
            if has_grandmother:
                grandmother = self.create_user(
                    family_name, '奶奶', 'F', 
                    random.randint(65, 80)
                )
                family_members.append(grandmother)
            
            # 父親 (40-60歲)
            father = self.create_user(
                family_name, '父親', 'M', 
                random.randint(40, 60)
            )
            family_members.append(father)
            
            # 母親 (38-55歲)
            if has_mother:
                mother = self.create_user(
                    family_name, '母親', 'F', 
                    random.randint(38, 55)
                )
                family_members.append(mother)
            
            # 孫子女 (8-25歲)
            for i in range(num_children):
                gender = random.choice(['M', 'F'])
                role = '兒子' if gender == 'M' else '女兒'
                child = self.create_user(
                    family_name, f'{role}{i+1}', gender, 
                    random.randint(8, 25)
                )
                family_members.append(child)
            
            # 將成員加入家族群組
            for member in family_members:
                GroupMember.objects.get_or_create(
                    group=family_group,
                    name=member.name,
                    user=member
                )
                
                # 也加入主要派系群組
                GroupMember.objects.get_or_create(
                    group=self.main_group,
                    name=member.name,
                    user=member
                )
            
            # 設定家族管理者 (父親和有些情況下的母親)
            family_group.managers.add(father)
            if has_mother:
                family_group.managers.add(mother)
            
            self.stdout.write(f'    👤 創建了 {len(family_members)} 位家族成員')

    def create_user(self, family_name, role, gender, age):
        """創建單個用戶"""
        # 生成阿美族風格的姓名
        surname = random.choice(self.amis_surnames)
        if gender == 'M':
            first_name = random.choice(self.amis_male_names)
        else:
            first_name = random.choice(self.amis_female_names)
        
        full_name = f'{surname}·{first_name}'
        username = f'{family_name}_{role}_{first_name}'.lower()
        
        # 確保用戶名唯一
        original_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f'{original_username}_{counter}'
            counter += 1
        
        user = User.objects.create_user(
            username=username,
            password='amis123',  # 統一密碼
            name=full_name,
            email=f'{username}@amis-community.tw',
            role='USER',
            is_active=True
        )
        
        self.users_created[username] = user
        return user

    def create_cultural_categories(self):
        """創建文化相關的支出分類"""
        self.stdout.write('\n📂 創建阿美族文化相關支出分類...')
        
        cultural_categories = [
            {'name': '祭典用品', 'description': '傳統服飾、祭器、裝飾品等'},
            {'name': '祭典食材', 'description': '糯米、檳榔、米酒、豬肉等祭祀食材'},
            {'name': '文化表演', 'description': '舞蹈道具、樂器、演出費用'},
            {'name': '住宿費用', 'description': '4天3夜活動的住宿安排'},
            {'name': '交通費用', 'description': '族人往返交通、物資運送'},
            {'name': '場地費用', 'description': '祭祀場地、活動會場租用'},
            {'name': '禮品交換', 'description': '家族間的禮品互贈'},
            {'name': '長者照護', 'description': '長者參與活動的特殊需求'},
            {'name': '傳統工藝', 'description': '編織材料、雕刻工具等'},
            {'name': '文化教育', 'description': '族語教學、文化傳承活動'},
        ]
        
        for cat_data in cultural_categories:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'type': 'EXPENSE',
                    'description': cat_data['description'],
                    'is_default': False
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ 創建分類: {cat_data["name"]}'))

    def create_seasonal_events(self):
        """創建一年四季的文化活動"""
        self.stdout.write('\n🎭 創建一年四季的阿美族文化活動...')
        
        # 2024年的活動時間
        base_year = 2024
        
        seasonal_events = [
            {
                'name': '播種祭 Misapalaway',
                'month': 3,  # 春季 - 3月
                'description': '春季播種祭典，祈求一年豐收，準備開始耕作',
                'duration_days': 4,
                'lead_families': ['Cilangasan', 'Nakao']  # 主辦家族
            },
            {
                'name': '豐年祭 Ilisin', 
                'month': 7,  # 夏季 - 7月
                'description': '年度最重要的豐年祭典，慶祝豐收與祖靈祭祀',
                'duration_days': 4,
                'lead_families': ['Cilangasan', 'Paketaolan', 'Tayal']  # 最重要祭典，多家族主辦
            },
            {
                'name': '收穫祭 Misaopisaw',
                'month': 10,  # 秋季 - 10月
                'description': '秋季收穫祭典，感謝豐收，家族間交換禮物',
                'duration_days': 4,
                'lead_families': ['Lifok', 'Sakizaya']  # 主辦家族
            },
            {
                'name': '團聚祭 Misakero',
                'month': 12,  # 冬季 - 12月
                'description': '冬季團聚祭典，家族聚會，長者分享智慧',
                'duration_days': 4,
                'lead_families': ['Tayal', 'Paketaolan']  # 主辦家族
            }
        ]
        
        for event_data in seasonal_events:
            # 設定活動開始日期
            start_date = datetime(base_year, event_data['month'], 15)  # 每月15號開始
            end_date = start_date + timedelta(days=event_data['duration_days']-1)
            
            event, created = Event.objects.get_or_create(
                name=event_data['name'],
                group=self.main_group,
                defaults={
                    'description': event_data['description'] + '\n地點：海岸阿美族傳統祭祀場地',
                    'start_date': start_date,
                    'end_date': end_date,
                    'created_by': User.objects.get(username='admin')
                }
            )
            
            # 指定活動管理者（來自主辦家族）
            if created:
                for family_name in event_data['lead_families']:
                    if family_name in self.families:
                        family_group = self.families[family_name]
                        # 從主辦家族中選擇管理者（父親和母親）
                        family_managers = family_group.managers.all()
                        for manager in family_managers:
                            event.managers.add(manager)
                            self.stdout.write(f'    👤 指定 {manager.name} ({family_name}家族) 為活動管理者')
            
            self.events[event_data['name']] = event
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ 創建活動: {event_data["name"]}'))

    def create_event_expenses(self):
        """為每個活動創建相關支出"""
        self.stdout.write('\n💰 為每個活動創建支出記錄...')
        
        # 獲取文化相關分類
        cultural_categories = {
            cat.name: cat for cat in Category.objects.filter(
                name__in=['祭典用品', '祭典食材', '文化表演', '住宿費用', '交通費用', 
                         '場地費用', '禮品交換', '長者照護', '傳統工藝', '文化教育']
            )
        }
        
        for event_name, event in self.events.items():
            self.stdout.write(f'\n  為 {event_name} 創建支出:')
            
            # 根據活動類型創建不同的支出
            if '播種祭' in event_name:
                expenses_data = [
                    {'category': '祭典用品', 'amount': 15000, 'description': '播種祭祭器與傳統服飾'},
                    {'category': '祭典食材', 'amount': 25000, 'description': '祭祀用糯米、米酒、豬肉'},
                    {'category': '住宿費用', 'amount': 45000, 'description': '4天3夜六家族住宿'},
                    {'category': '交通費用', 'amount': 12000, 'description': '族人交通與物資運送'},
                    {'category': '場地費用', 'amount': 8000, 'description': '祭祀場地租用'},
                ]
            elif '豐年祭' in event_name:
                expenses_data = [
                    {'category': '祭典用品', 'amount': 35000, 'description': '豐年祭盛裝與祭器'},
                    {'category': '祭典食材', 'amount': 60000, 'description': '豐年祭豐盛祭品'},
                    {'category': '文化表演', 'amount': 28000, 'description': '傳統舞蹈表演道具'},
                    {'category': '住宿費用', 'amount': 55000, 'description': '豐年祭4天3夜住宿'},
                    {'category': '交通費用', 'amount': 18000, 'description': '大型活動交通安排'},
                    {'category': '場地費用', 'amount': 15000, 'description': '主祭場地與表演場地'},
                    {'category': '長者照護', 'amount': 12000, 'description': '長者參與活動照護'},
                ]
            elif '收穫祭' in event_name:
                expenses_data = [
                    {'category': '祭典用品', 'amount': 18000, 'description': '收穫祭祭器與裝飾'},
                    {'category': '祭典食材', 'amount': 32000, 'description': '收穫感恩祭品'},
                    {'category': '禮品交換', 'amount': 40000, 'description': '家族間禮品交換'},
                    {'category': '住宿費用', 'amount': 48000, 'description': '收穫祭4天3夜住宿'},
                    {'category': '傳統工藝', 'amount': 15000, 'description': '編織與雕刻材料'},
                ]
            else:  # 團聚祭
                expenses_data = [
                    {'category': '祭典用品', 'amount': 12000, 'description': '團聚祭簡約祭器'},
                    {'category': '祭典食材', 'amount': 38000, 'description': '團聚祭溫馨餐點'},
                    {'category': '住宿費用', 'amount': 42000, 'description': '團聚祭4天3夜住宿'},
                    {'category': '文化教育', 'amount': 20000, 'description': '長者智慧分享活動'},
                    {'category': '長者照護', 'amount': 15000, 'description': '冬季長者特別照護'},
                ]
            
            # 創建支出記錄
            for exp_data in expenses_data:
                if exp_data['category'] in cultural_categories:
                    # 隨機選擇付款家族
                    paying_family = random.choice(list(self.families.values()))
                    family_members = list(paying_family.members.filter(user__isnull=False))
                    
                    if family_members:
                        payer = family_members[0].user
                        
                        expense = Expense.objects.create(
                            group=self.main_group,
                            event=event,
                            category=cultural_categories[exp_data['category']],
                            amount=Decimal(str(exp_data['amount'])),
                            description=exp_data['description'],
                            date=event.start_date + timedelta(days=random.randint(0, 3)),
                            paid_by=payer,
                            created_by=payer
                        )
                        
                        # 創建支出分攤 (六大家族平分)
                        amount_per_family = expense.amount / len(self.families)
                        
                        for family_group in self.families.values():
                            family_members = list(family_group.members.filter(user__isnull=False))
                            if family_members:
                                ExpenseSplit.objects.create(
                                    expense=expense,
                                    user=family_members[0].user,  # 家族代表
                                    amount=amount_per_family,
                                    percentage=Decimal(str(round(100 / len(self.families), 2)))  # 100/6 ≈ 16.67%
                                )
                        
                        self.stdout.write(f'    💰 {exp_data["category"]}: NT$ {exp_data["amount"]:,}')

    def create_daily_transactions(self):
        """創建日常交易記錄"""
        self.stdout.write('\n🛒 創建日常交易記錄...')
        
        # 日常支出分類
        daily_categories = {
            cat.name: cat for cat in Category.objects.filter(
                name__in=['餐飲', '交通', '生活用品', '其他']
            )
        }
        
        # 為每個家族創建一年的日常支出
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 12, 31)
        current_date = start_date
        
        daily_transactions = []
        
        while current_date <= end_date:
            # 每天有30%機率有家族日常支出
            if random.random() < 0.3:
                # 隨機選擇家族
                family_name = random.choice(list(self.families.keys()))
                family_group = self.families[family_name]
                family_members = list(family_group.members.filter(user__isnull=False))
                
                if family_members:
                    payer = random.choice(family_members).user
                    
                    # 隨機選擇支出類型
                    category_name = random.choice(list(daily_categories.keys()))
                    category = daily_categories[category_name]
                    
                    # 根據類型設定金額範圍
                    if category_name == '餐飲':
                        amount = random.randint(500, 3000)
                        descriptions = [
                            f'{family_name}家族聚餐', f'購買{family_name}家族食材',
                            f'{family_name}家族外食', f'傳統食物製作材料'
                        ]
                    elif category_name == '交通':
                        amount = random.randint(200, 1500)
                        descriptions = [
                            f'{family_name}家族交通費', f'前往部落交通',
                            f'長者就醫交通', f'採買物資交通'
                        ]
                    elif category_name == '生活用品':
                        amount = random.randint(300, 2500)
                        descriptions = [
                            f'{family_name}家族生活用品', f'傳統工藝材料',
                            f'家族服飾購買', f'日常清潔用品'
                        ]
                    else:  # 其他
                        amount = random.randint(100, 2000)
                        descriptions = [
                            f'{family_name}家族雜項支出', f'文化學習費用',
                            f'長者照護用品', f'家族維護費用'
                        ]
                    
                    description = random.choice(descriptions)
                    
                    expense = Expense.objects.create(
                        group=family_group,
                        category=category,
                        amount=Decimal(str(amount)),
                        description=description,
                        date=current_date,
                        paid_by=payer,
                        created_by=payer
                    )
                    
                    # 家族內部分攤（只有成年人分攤）
                    adult_members = [m for m in family_members if m.user.name and ('父親' in m.user.name or '母親' in m.user.name or '爺爺' in m.user.name or '奶奶' in m.user.name)]
                    
                    if adult_members:
                        amount_per_adult = expense.amount / len(adult_members)
                        for member in adult_members:
                            ExpenseSplit.objects.create(
                                expense=expense,
                                user=member.user,
                                amount=amount_per_adult,
                                percentage=Decimal(str(100 / len(adult_members)))
                            )
                    
                    daily_transactions.append(expense)
            
            current_date += timedelta(days=1)
        
        self.stdout.write(self.style.SUCCESS(f'✅ 創建了 {len(daily_transactions)} 筆日常交易'))

    def create_family_lending(self):
        """創建家族間借貸記錄"""
        self.stdout.write('\n💸 創建家族間借貸記錄...')
        
        # 創建借貸分類
        lending_category, _ = Category.objects.get_or_create(
            name='家族借貸',
            defaults={
                'type': 'EXPENSE',
                'description': '家族間的金錢借貸往來',
                'is_default': False
            }
        )
        
        repayment_category, _ = Category.objects.get_or_create(
            name='借貸償還',
            defaults={
                'type': 'EXPENSE',
                'description': '償還家族間的借貸',
                'is_default': False
            }
        )
        
        lending_records = []
        
        # 模擬一年內的借貸情況
        for month in range(1, 13):
            # 每月有40%機率發生家族間借貸
            if random.random() < 0.4:
                # 隨機選擇借出和借入家族
                lending_family = random.choice(list(self.families.values()))
                borrowing_family = random.choice(list(self.families.values()))
                
                # 確保不是同一家族
                while borrowing_family == lending_family:
                    borrowing_family = random.choice(list(self.families.values()))
                
                lending_members = list(lending_family.members.filter(user__isnull=False))
                borrowing_members = list(borrowing_family.members.filter(user__isnull=False))
                
                if lending_members and borrowing_members:
                    lender = random.choice(lending_members).user
                    borrower = random.choice(borrowing_members).user
                    
                    # 借貸金額 (5000-50000)
                    amount = random.randint(5000, 50000)
                    
                    lending_date = datetime(2024, month, random.randint(1, 28))
                    
                    lending_reasons = [
                        '準備祭典活動資金',
                        '家族緊急醫療費用',
                        '傳統工藝材料購買',
                        '子女教育費用',
                        '長者照護支出',
                        '房屋修繕費用'
                    ]
                    
                    reason = random.choice(lending_reasons)
                    
                    # 創建借出記錄 (對借出家族來說是支出)
                    lending_expense = Expense.objects.create(
                        group=lending_family,
                        category=lending_category,
                        amount=Decimal(str(amount)),
                        description=f'借給{borrower.name} - {reason}',
                        date=lending_date,
                        paid_by=lender,
                        created_by=lender
                    )
                    
                    # 創建借入記錄 (對借入家族來說也是支出，但實際是負債)
                    borrowing_expense = Expense.objects.create(
                        group=borrowing_family,
                        category=lending_category,
                        amount=Decimal(str(amount)),
                        description=f'向{lender.name}借款 - {reason}',
                        date=lending_date,
                        paid_by=borrower,
                        created_by=borrower
                    )
                    
                    lending_records.append((lending_expense, borrowing_expense))
                    
                    # 70%機率在3-6個月內償還
                    if random.random() < 0.7:
                        repayment_month = min(12, month + random.randint(3, 6))
                        repayment_date = datetime(2024, repayment_month, random.randint(1, 28))
                        
                        # 創建償還記錄
                        repayment_expense = Expense.objects.create(
                            group=borrowing_family,
                            category=repayment_category,
                            amount=Decimal(str(amount)),
                            description=f'償還{lender.name}借款 - {reason}',
                            date=repayment_date,
                            paid_by=borrower,
                            created_by=borrower
                        )
        
        self.stdout.write(self.style.SUCCESS(f'✅ 創建了 {len(lending_records)} 筆借貸記錄'))

    def create_seasonal_income(self):
        """創建季節性收入記錄"""
        self.stdout.write('\n🌾 創建季節性收入記錄...')
        
        # 創建收入相關分類
        income_categories = {}
        
        income_types = [
            {'name': '農產品銷售', 'description': '稻米、蔬果等農產品銷售收入'},
            {'name': '手工藝品銷售', 'description': '傳統編織、雕刻作品銷售'},
            {'name': '觀光導覽', 'description': '文化觀光導覽服務收入'},
            {'name': '補助津貼', 'description': '政府原住民補助與津貼'},
            {'name': '季節性工作', 'description': '農忙期間的季節性工作收入'},
        ]
        
        for income_type in income_types:
            # 注意：在這個系統中我們用支出來記錄，但金額為負數表示收入
            category, _ = Category.objects.get_or_create(
                name=income_type['name'],
                defaults={
                    'type': 'EXPENSE',
                    'description': income_type['description'],
                    'is_default': False
                }
            )
            income_categories[income_type['name']] = category
        
        income_records = []
        
        # 為每個家族創建季節性收入
        for family_name, family_group in self.families.items():
            family_members = list(family_group.members.filter(user__isnull=False))
            if not family_members:
                continue
            
            # 農產品銷售 (春季和秋季)
            for month in [4, 5, 10, 11]:  # 4-5月春收, 10-11月秋收
                if random.random() < 0.8:  # 80%機率有收入
                    earner = random.choice(family_members).user
                    amount = random.randint(15000, 45000)  # 農產品收入
                    date = datetime(2024, month, random.randint(1, 28))
                    
                    # 負數表示收入
                    expense = Expense.objects.create(
                        group=family_group,
                        category=income_categories['農產品銷售'],
                        amount=Decimal(str(-amount)),  # 負數表示收入
                        description=f'{family_name}家族 {["春季", "春季", "", "", "", "", "", "", "", "", "秋季", "秋季"][month-1]}農產品銷售',
                        date=date,
                        paid_by=earner,
                        created_by=earner
                    )
                    income_records.append(expense)
            
            # 手工藝品銷售 (全年)
            for month in range(1, 13):
                if random.random() < 0.3:  # 30%機率有手工藝收入
                    earner = random.choice(family_members).user
                    amount = random.randint(3000, 12000)
                    date = datetime(2024, month, random.randint(1, 28))
                    
                    crafts = ['傳統編織包', '木雕藝品', '陶瓷作品', '竹編器具', '傳統服飾']
                    craft = random.choice(crafts)
                    
                    expense = Expense.objects.create(
                        group=family_group,
                        category=income_categories['手工藝品銷售'],
                        amount=Decimal(str(-amount)),
                        description=f'{family_name}家族{craft}銷售',
                        date=date,
                        paid_by=earner,
                        created_by=earner
                    )
                    income_records.append(expense)
            
            # 觀光導覽 (夏季旺季)
            for month in [6, 7, 8, 9]:  # 夏季觀光旺季
                if random.random() < 0.6:  # 60%機率有導覽收入
                    earner = random.choice(family_members).user
                    amount = random.randint(5000, 20000)
                    date = datetime(2024, month, random.randint(1, 28))
                    
                    expense = Expense.objects.create(
                        group=family_group,
                        category=income_categories['觀光導覽'],
                        amount=Decimal(str(-amount)),
                        description=f'{family_name}家族文化導覽服務',
                        date=date,
                        paid_by=earner,
                        created_by=earner
                    )
                    income_records.append(expense)
            
            # 政府補助 (每季一次)
            for month in [3, 6, 9, 12]:
                if random.random() < 0.9:  # 90%機率有補助
                    earner = random.choice(family_members).user
                    amount = random.randint(8000, 25000)
                    date = datetime(2024, month, 15)  # 固定每季15號
                    
                    subsidies = ['原住民族綜合發展基金', '文化傳承補助', '長者照護津貼', '農業補助']
                    subsidy = random.choice(subsidies)
                    
                    expense = Expense.objects.create(
                        group=family_group,
                        category=income_categories['補助津貼'],
                        amount=Decimal(str(-amount)),
                        description=f'{family_name}家族{subsidy}',
                        date=date,
                        paid_by=earner,
                        created_by=earner
                    )
                    income_records.append(expense)
            
            # 季節性工作 (不定期)
            for _ in range(random.randint(3, 8)):  # 每家族3-8次季節性工作
                month = random.randint(1, 12)
                earner = random.choice(family_members).user
                amount = random.randint(8000, 35000)
                date = datetime(2024, month, random.randint(1, 28))
                
                jobs = ['採果工作', '建築臨時工', '餐廳服務', '市場擺攤', '祭典表演']
                job = random.choice(jobs)
                
                expense = Expense.objects.create(
                    group=family_group,
                    category=income_categories['季節性工作'],
                    amount=Decimal(str(-amount)),
                    description=f'{family_name}家族{job}收入',
                    date=date,
                    paid_by=earner,
                    created_by=earner
                )
                income_records.append(expense)
        
        self.stdout.write(self.style.SUCCESS(f'✅ 創建了 {len(income_records)} 筆收入記錄'))

    def display_summary(self):
        """顯示創建結果摘要"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('🏔️ 長光部落社群資料創建摘要'))
        self.stdout.write('='*60)
        
        self.stdout.write(f'\n👥 創建用戶數量: {len(self.users_created)}')
        self.stdout.write(f'👨‍👩‍👧‍👦 創建家族數量: {len(self.families)}')
        self.stdout.write(f'🎭 創建文化活動: {len(self.events)}')
        
        # 統計所有交易記錄
        all_expenses = Expense.objects.all()
        total_expenses = all_expenses.count()
        
        # 分別統計收入和支出
        expense_records = [exp for exp in all_expenses if exp.amount > 0]
        income_records = [exp for exp in all_expenses if exp.amount < 0]
        
        total_expense_amount = sum([exp.amount for exp in expense_records])
        total_income_amount = abs(sum([exp.amount for exp in income_records]))
        
        # 統計各類型交易
        event_expenses = Expense.objects.filter(event__isnull=False).count()
        daily_expenses = Expense.objects.filter(event__isnull=True, amount__gt=0).count()
        income_transactions = len(income_records)
        
        self.stdout.write(f'💰 總交易記錄: {total_expenses}')
        self.stdout.write(f'📤 支出記錄: {len(expense_records)} 筆，NT$ {total_expense_amount:,}')
        self.stdout.write(f'📥 收入記錄: {income_transactions} 筆，NT$ {total_income_amount:,}')
        self.stdout.write(f'🎭 活動支出: {event_expenses} 筆')
        self.stdout.write(f'🛒 日常交易: {daily_expenses} 筆')
        
        self.stdout.write('\n🏘️ 家族結構:')
        for family_name, family_group in self.families.items():
            member_count = family_group.members.count()
            self.stdout.write(f'   {family_name}家族: {member_count} 位成員')
        
        self.stdout.write('\n🎭 季節活動:')
        for event_name, event in self.events.items():
            event_expenses = Expense.objects.filter(event=event).count()
            event_amount = sum([exp.amount for exp in Expense.objects.filter(event=event)])
            self.stdout.write(f'   {event_name}: {event_expenses} 項支出, NT$ {event_amount:,}')
        
        self.stdout.write('\n🔑 登入資訊:')
        self.stdout.write('   所有族人密碼: amis123')
        self.stdout.write('   系統管理員: admin / admin123')
        
        self.stdout.write('\n🏔️ 長光部落六大家族:')
        for family_name in self.family_names:
            chinese_name = self.family_chinese_names[family_name]
            self.stdout.write(f'   {family_name} ({chinese_name})')
        
        self.stdout.write('\n🌟 現在可以開始體驗長光部落記帳系統了！')
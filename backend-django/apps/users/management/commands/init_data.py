from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.categories.models import Category
from apps.groups.models import Group, GroupMember

User = get_user_model()

class Command(BaseCommand):
    help = '初始化系統資料（管理員、測試用戶、分類）'

    def handle(self, *args, **options):
        self.stdout.write('🚀 開始初始化系統資料...\n')
        
        # 1. 創建管理員帳號
        self.stdout.write('👤 創建管理員帳號...')
        admin_created = False
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@pangcah-accounting.com',
                password='admin123',
                name='系統管理員',
                role='ADMIN'
            )
            admin_created = True
            self.stdout.write(self.style.SUCCESS('✅ 管理員帳號創建成功'))
            self.stdout.write(f'   用戶名: admin')
            self.stdout.write(f'   密碼: admin123')
        else:
            admin_user = User.objects.get(username='admin')
            self.stdout.write(self.style.WARNING('⚠️  管理員帳號已存在'))
        
        # 2. 創建測試用戶
        self.stdout.write('\n👥 創建測試用戶...')
        test_users_data = [
            {'username': 'test1', 'password': 'test123', 'name': '測試用戶一', 'email': 'test1@example.com'},
            {'username': 'test2', 'password': 'test123', 'name': '測試用戶二', 'email': 'test2@example.com'},
            {'username': 'alice', 'password': 'alice123', 'name': '愛麗絲', 'email': 'alice@example.com'},
            {'username': 'bob', 'password': 'bob123', 'name': '鮑伯', 'email': 'bob@example.com'},
        ]
        
        created_users = {}
        for user_data in test_users_data:
            if not User.objects.filter(username=user_data['username']).exists():
                user = User.objects.create_user(
                    username=user_data['username'],
                    password=user_data['password'],
                    name=user_data['name'],
                    email=user_data['email'],
                    role='USER',
                    is_active=True
                )
                created_users[user_data['username']] = user
                self.stdout.write(self.style.SUCCESS(f'✅ 創建用戶: {user_data["username"]} / {user_data["password"]}'))
            else:
                created_users[user_data['username']] = User.objects.get(username=user_data['username'])
                self.stdout.write(self.style.WARNING(f'⚠️  用戶已存在: {user_data["username"]}'))
        
        # 3. 創建預設分類
        self.stdout.write('\n📂 創建預設分類...')
        categories_data = [
            {'name': '餐飲', 'type': 'EXPENSE', 'description': '餐廳、飲料、食材等'},
            {'name': '交通', 'type': 'EXPENSE', 'description': '油資、大眾運輸、停車費等'},
            {'name': '娛樂', 'type': 'EXPENSE', 'description': '電影、遊戲、旅遊等'},
            {'name': '生活用品', 'type': 'EXPENSE', 'description': '日常用品、衣物等'},
            {'name': '醫療', 'type': 'EXPENSE', 'description': '看診、藥品、保健品等'},
            {'name': '教育', 'type': 'EXPENSE', 'description': '書籍、課程、學費等'},
            {'name': '居家', 'type': 'EXPENSE', 'description': '房租、水電、維修等'},
            {'name': '其他', 'type': 'EXPENSE', 'description': '其他支出'},
        ]
        
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'type': cat_data['type'],
                    'description': cat_data['description'],
                    'is_default': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ 創建分類: {cat_data["name"]}'))
            else:
                self.stdout.write(self.style.WARNING(f'⚠️  分類已存在: {cat_data["name"]}'))
        
        # 4. 創建示範群組
        self.stdout.write('\n👨‍👩‍👧‍👦 創建示範群組...')
        groups_data = [
            {
                'name': '示範家庭',
                'description': '系統示範用家庭群組',
                'managers': ['alice'],
                'members': ['alice', 'bob', 'test1']
            },
            {
                'name': '測試群組',
                'description': '測試功能用群組',
                'managers': ['test1'],
                'members': ['test1', 'test2']
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
                self.stdout.write(self.style.SUCCESS(f'✅ 創建群組: {group_data["name"]}'))
                
                # 添加管理者
                for manager_username in group_data['managers']:
                    if manager_username in created_users:
                        group.managers.add(created_users[manager_username])
                        self.stdout.write(f'   👑 管理者: {manager_username}')
                
                # 添加成員
                for member_username in group_data['members']:
                    if member_username in created_users:
                        member, _ = GroupMember.objects.get_or_create(
                            group=group,
                            name=created_users[member_username].name,
                            user=created_users[member_username]
                        )
                        self.stdout.write(f'   👤 成員: {member_username}')
            else:
                self.stdout.write(self.style.WARNING(f'⚠️  群組已存在: {group_data["name"]}'))
        
        # 5. 顯示總結
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('✨ 資料初始化完成！'))
        self.stdout.write('\n📋 帳號資訊總結：')
        self.stdout.write('管理員帳號:')
        self.stdout.write('  admin / admin123')
        self.stdout.write('\n測試帳號:')
        self.stdout.write('  test1 / test123')
        self.stdout.write('  test2 / test123')
        self.stdout.write('  alice / alice123')
        self.stdout.write('  bob / bob123')
        self.stdout.write('\n可以開始測試系統了！')
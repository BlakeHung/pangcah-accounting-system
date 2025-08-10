from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.groups.models import Group, GroupMember
from apps.categories.models import Category
from apps.events.models import Event

User = get_user_model()

class Command(BaseCommand):
    help = '創建精簡版阿美族社群資料進行測試'
    
    def handle(self, *args, **options):
        self.stdout.write('🏔️ 開始創建精簡版阿美族社群資料...')
        
        admin = User.objects.get(username='admin')
        
        # 1. 創建主群組
        main_group, created = Group.objects.get_or_create(
            name='長光部落測試',
            defaults={
                'description': '精簡版長光部落測試群組',
                'created_by': admin
            }
        )
        
        if created:
            main_group.managers.add(admin)
            self.stdout.write(self.style.SUCCESS('✅ 長光部落測試群組創建成功'))
        
        # 2. 創建一個測試家族
        family_group, created = Group.objects.get_or_create(
            name='Cilangasan測試家族',
            defaults={
                'description': 'Cilangasan測試家族群組',
                'created_by': admin
            }
        )
        
        # 3. 創建幾個測試族人
        test_users = [
            {'username': 'cilangasan_父親_拉罕', 'name': '潘志·拉罕', 'role': '父親'},
            {'username': 'cilangasan_母親_芭翁', 'name': '潘志·芭翁', 'role': '母親'},
            {'username': 'cilangasan_兒子_達利', 'name': '潘志·達利', 'role': '兒子'}
        ]
        
        created_users = []
        for user_data in test_users:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'password': 'pbkdf2_sha256$720000$dummysalt123$dummyhash456',  # amis123的hash
                    'name': user_data['name'],
                    'email': f'{user_data["username"]}@amis-test.tw',
                    'role': 'USER',
                    'is_active': True
                }
            )
            
            if created:
                user.set_password('amis123')  # 設定密碼
                user.save()
                created_users.append(user)
                self.stdout.write(f'✅ 創建用戶: {user_data["name"]}')
        
        # 4. 將用戶加入群組
        for user in created_users:
            GroupMember.objects.get_or_create(
                group=family_group,
                name=user.name,
                user=user
            )
            
            GroupMember.objects.get_or_create(
                group=main_group,
                name=user.name,
                user=user
            )
        
        # 設定家族管理者
        if len(created_users) > 0:
            family_group.managers.add(created_users[0])  # 父親作為管理者
            
        # 5. 創建一個測試活動
        from datetime import datetime
        event, created = Event.objects.get_or_create(
            name='豐年祭測試',
            group=main_group,
            defaults={
                'description': '測試用豐年祭活動',
                'start_date': datetime(2024, 7, 15),
                'end_date': datetime(2024, 7, 18),
                'location': '測試祭祀場地',
                'created_by': admin
            }
        )
        
        if created and len(created_users) > 0:
            event.managers.add(created_users[0])  # 指定管理者
            self.stdout.write(self.style.SUCCESS('✅ 創建測試活動: 豐年祭測試'))
        
        self.stdout.write(self.style.SUCCESS('\n✨ 精簡版阿美族資料創建完成！'))
        self.stdout.write(f'創建了 {len(created_users)} 個用戶')
        self.stdout.write(f'創建了 2 個群組')
        self.stdout.write(f'創建了 1 個活動')
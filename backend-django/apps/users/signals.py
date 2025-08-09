"""
用戶相關信號處理器
"""
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_migrate)
def create_initial_admin(sender, **kwargs):
    """
    遷移後自動創建初始管理員帳號
    """
    if sender.name == 'apps.users':
        # 檢查是否已有管理員
        if not User.objects.filter(role='ADMIN').exists():
            try:
                admin_user = User.objects.create_user(
                    username='admin',
                    email='admin@pangcah-accounting.com',
                    password='admin123',
                    first_name='系統',
                    last_name='管理員',
                    name='系統管理員',
                    role='ADMIN',
                    is_staff=True,
                    is_superuser=True,
                    is_active=True
                )
                print(f'✅ 成功創建管理員帳號: {admin_user.username} / admin123')
            except Exception as e:
                print(f'❌ 創建管理員帳號失敗: {e}')
        else:
            print('⚠️ 管理員帳號已存在，跳過創建')
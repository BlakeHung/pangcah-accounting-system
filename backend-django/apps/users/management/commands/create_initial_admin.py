"""
創建初始管理員帳號的 Django 管理命令
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = '創建初始管理員帳號'

    def handle(self, *args, **options):
        # 檢查是否已有管理員
        if User.objects.filter(role='ADMIN').exists():
            self.stdout.write(
                self.style.WARNING('管理員帳號已存在，跳過創建')
            )
            return

        # 創建預設管理員帳號
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

        self.stdout.write(
            self.style.SUCCESS(
                f'成功創建管理員帳號:\n'
                f'用戶名: {admin_user.username}\n'
                f'密碼: admin123\n'
                f'請登入後立即修改密碼！'
            )
        )
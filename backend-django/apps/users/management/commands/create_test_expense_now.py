from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.groups.models import Group
from apps.categories.models import Category
from apps.expenses.models import Expense
from django.utils import timezone
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = '立即創建一筆測試支出'
    
    def handle(self, *args, **options):
        try:
            self.stdout.write('💰 創建測試支出...')
            
            # 獲取第一個可用的用戶
            user = User.objects.filter(username='admin').first()
            if not user:
                user = User.objects.first()
                
            # 獲取第一個群組
            group = Group.objects.filter(name__contains='長光部落').first()
            if not group:
                group = Group.objects.first()
                
            # 獲取第一個分類
            category = Category.objects.filter(type='EXPENSE').first()
            
            if not user or not group or not category:
                self.stdout.write(self.style.ERROR(f'缺少必要資料: user={user}, group={group}, category={category}'))
                return
                
            # 創建支出
            expense = Expense.objects.create(
                group=group,
                category=category,
                amount=Decimal('5000'),
                description='Railway測試支出',
                date=timezone.now(),
                user=user  # 正確的欄位名稱
            )
            
            self.stdout.write(self.style.SUCCESS(f'✅ 成功創建支出 ID: {expense.id}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ 創建失敗: {str(e)}'))
            import traceback
            self.stdout.write(traceback.format_exc())
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.groups.models import Group
from apps.categories.models import Category
from apps.events.models import Event
from apps.expenses.models import Expense
from datetime import datetime
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = '創建簡單的測試支出記錄'
    
    def handle(self, *args, **options):
        self.stdout.write('💰 開始創建簡單測試支出記錄...')
        
        # 獲取已存在的資料
        admin = User.objects.get(username='admin')
        main_group = Group.objects.filter(name__contains='長光部落').first()
        
        if not main_group:
            self.stdout.write(self.style.ERROR('❌ 找不到長光部落群組'))
            return
            
        # 創建簡單的分類
        category, created = Category.objects.get_or_create(
            name='測試支出',
            defaults={
                'type': 'EXPENSE',
                'is_default': False
            }
        )
        
        if created:
            self.stdout.write('✅ 創建分類: 測試支出')
        
        # 創建幾筆測試支出
        expenses_data = [
            {'amount': 1000, 'description': '測試支出1'},
            {'amount': 2000, 'description': '測試支出2'},
            {'amount': 3000, 'description': '測試支出3'},
        ]
        
        created_count = 0
        for expense_data in expenses_data:
            expense = Expense.objects.create(
                group=main_group,
                category=category,
                amount=Decimal(str(expense_data['amount'])),
                description=expense_data['description'],
                date=datetime.now(),
                paid_by=admin,
                created_by=admin
            )
            created_count += 1
            self.stdout.write(f'✅ 創建支出: {expense_data["description"]} - NT$ {expense_data["amount"]}')
        
        self.stdout.write(self.style.SUCCESS(f'\n🎉 成功創建 {created_count} 筆測試支出記錄！'))
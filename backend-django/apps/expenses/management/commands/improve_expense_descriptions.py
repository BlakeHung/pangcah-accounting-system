from django.core.management.base import BaseCommand
from apps.expenses.models import Expense
import random

class Command(BaseCommand):
    help = '改善支出記錄的描述名稱，移除醜陋的測試字樣'
    
    def handle(self, *args, **options):
        self.stdout.write('🎨 開始改善支出記錄描述...')
        
        # 定義自然的描述替換模式
        natural_descriptions = {
            '餐飲': [
                '家族聚餐', '購買食材', '家人外食', '傳統食物材料',
                '部落慶典餐費', '長者營養品', '節慶食品採購'
            ],
            '交通': [
                '家族交通費', '前往部落交通', '長者就醫交通', '採買物資交通',
                '部落會議交通', '文化活動交通', '探親交通費'
            ],
            '生活用品': [
                '家族生活用品', '傳統工藝材料', '家族服飾', '日常清潔用品',
                '編織材料', '傳統服飾', '家用器具'
            ],
            '醫療': [
                '長者健檢費用', '家人看診', '藥品費用', '健康保養品',
                '傳統草藥', '保健用品'
            ],
            '教育': [
                '文化學習費用', '語言課程', '技藝傳承', '部落教育支持',
                '青年培育', '文化保存活動'
            ],
            '其他': [
                '家族雜項支出', '長者照護用品', '家族維護費用',
                '部落事務費用', '文化器具維護', '傳統慶典用品'
            ]
        }
        
        # 查找需要改善的支出記錄
        ugly_keywords = ['Railway', '測試', 'test', 'Test', 'railway']
        expenses_to_fix = Expense.objects.filter(
            description__iregex='|'.join(ugly_keywords)
        )
        
        self.stdout.write(f'📋 找到 {expenses_to_fix.count()} 筆需要改善的支出記錄')
        
        fixed_count = 0
        for expense in expenses_to_fix:
            old_description = expense.description
            
            # 根據分類選擇合適的描述
            category_name = expense.category.name if expense.category else '其他'
            
            # 找到匹配的分類或使用其他
            descriptions = natural_descriptions.get(category_name, natural_descriptions['其他'])
            new_description = random.choice(descriptions)
            
            # 確保不會產生重複的描述（在同一群組中）
            similar_expenses = Expense.objects.filter(
                group=expense.group,
                description=new_description
            ).exclude(id=expense.id)
            
            if similar_expenses.exists():
                # 如果已存在，加上數字後綴
                new_description = f"{new_description} {random.randint(1, 99)}"
            
            expense.description = new_description
            expense.save()
            
            fixed_count += 1
            self.stdout.write(f'✅ 更新: "{old_description}" → "{new_description}"')
        
        # 也處理一些常見的不自然描述
        other_expenses = Expense.objects.filter(
            description__iregex='支出[0-9]+|項目[0-9]+|記錄[0-9]+'
        )
        
        for expense in other_expenses:
            old_description = expense.description
            category_name = expense.category.name if expense.category else '其他'
            descriptions = natural_descriptions.get(category_name, natural_descriptions['其他'])
            new_description = random.choice(descriptions)
            
            # 避免重複
            similar_expenses = Expense.objects.filter(
                group=expense.group,
                description=new_description
            ).exclude(id=expense.id)
            
            if similar_expenses.exists():
                new_description = f"{new_description} {random.randint(1, 99)}"
            
            expense.description = new_description
            expense.save()
            
            fixed_count += 1
            self.stdout.write(f'✅ 更新: "{old_description}" → "{new_description}"')
        
        self.stdout.write(self.style.SUCCESS(f'\n🎉 成功改善 {fixed_count} 筆支出記錄的描述！'))
        self.stdout.write('現在支出記錄的描述更自然、更符合阿美族社群使用習慣。')
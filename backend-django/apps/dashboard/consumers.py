"""
Dashboard WebSocket Consumers
"""

import json
import asyncio
from datetime import datetime, timedelta
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings

User = get_user_model()


class DashboardConsumer(AsyncWebsocketConsumer):
    """儀表板即時更新 Consumer"""
    
    async def connect(self):
        """WebSocket 連線"""
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.dashboard_group_name = f'dashboard_{self.user_id}'
        
        # 驗證用戶身份
        user = await self.get_user(self.user_id)
        if not user:
            await self.close()
            return
        
        self.user = user
        
        # 加入群組
        await self.channel_layer.group_add(
            self.dashboard_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # 發送歡迎訊息
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': '儀表板連線已建立',
            'user_id': self.user_id,
            'timestamp': timezone.now().isoformat()
        }))
        
        # 開始心跳檢測
        if hasattr(settings, 'WEBSOCKET_HEARTBEAT_INTERVAL'):
            asyncio.create_task(self.heartbeat())

    async def disconnect(self, close_code):
        """WebSocket 斷線"""
        # 離開群組
        await self.channel_layer.group_discard(
            self.dashboard_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """接收訊息"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # 回應 ping
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': timezone.now().isoformat()
                }))
            
            elif message_type == 'subscribe':
                # 訂閱特定數據類型
                await self.handle_subscription(data)
            
            elif message_type == 'request_data':
                # 請求特定資料
                await self.handle_data_request(data)
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': '無效的 JSON 格式'
            }))

    async def handle_subscription(self, data):
        """處理訂閱請求"""
        subscription_type = data.get('subscription_type')
        
        if subscription_type == 'dashboard_metrics':
            # 發送當前儀表板指標
            metrics = await self.get_dashboard_metrics()
            await self.send(text_data=json.dumps({
                'type': 'dashboard_metrics',
                'data': metrics,
                'timestamp': timezone.now().isoformat()
            }))

    async def handle_data_request(self, data):
        """處理資料請求"""
        request_type = data.get('request_type')
        
        if request_type == 'expense_summary':
            summary = await self.get_expense_summary()
            await self.send(text_data=json.dumps({
                'type': 'expense_summary',
                'data': summary,
                'timestamp': timezone.now().isoformat()
            }))

    async def heartbeat(self):
        """心跳檢測"""
        while True:
            try:
                await asyncio.sleep(settings.WEBSOCKET_HEARTBEAT_INTERVAL)
                await self.send(text_data=json.dumps({
                    'type': 'heartbeat',
                    'timestamp': timezone.now().isoformat()
                }))
            except:
                break

    # 群組消息處理方法
    async def dashboard_update(self, event):
        """處理儀表板更新訊息"""
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'data': event['data'],
            'timestamp': event.get('timestamp', timezone.now().isoformat())
        }))

    async def expense_created(self, event):
        """處理新增支出訊息"""
        await self.send(text_data=json.dumps({
            'type': 'expense_created',
            'data': event['data'],
            'timestamp': event.get('timestamp', timezone.now().isoformat())
        }))

    async def expense_updated(self, event):
        """處理更新支出訊息"""
        await self.send(text_data=json.dumps({
            'type': 'expense_updated',
            'data': event['data'],
            'timestamp': event.get('timestamp', timezone.now().isoformat())
        }))

    # 資料庫查詢方法
    @database_sync_to_async
    def get_user(self, user_id):
        """取得用戶"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def get_dashboard_metrics(self):
        """取得儀表板指標"""
        from apps.expenses.models import Expense
        from django.db.models import Sum, Count
        
        # 本月支出統計
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        monthly_expenses = Expense.objects.filter(
            user=self.user,
            date__gte=month_start.date()
        )
        
        total_amount = monthly_expenses.aggregate(Sum('amount'))['amount__sum'] or 0
        expense_count = monthly_expenses.count()
        
        return {
            'monthly_total': float(total_amount),
            'expense_count': expense_count,
            'last_updated': timezone.now().isoformat()
        }

    @database_sync_to_async
    def get_expense_summary(self):
        """取得支出摘要"""
        from apps.expenses.models import Expense
        from django.db.models import Sum
        
        # 最近7天的支出
        week_ago = timezone.now() - timedelta(days=7)
        
        recent_expenses = Expense.objects.filter(
            user=self.user,
            created_at__gte=week_ago
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        return {
            'recent_total': float(recent_expenses['total'] or 0),
            'recent_count': recent_expenses['count'],
            'period': '最近7天'
        }


class NotificationConsumer(AsyncWebsocketConsumer):
    """通知系統 Consumer"""
    
    async def connect(self):
        """WebSocket 連線"""
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.notification_group_name = f'notifications_{self.user_id}'
        
        # 驗證用戶身份
        user = await self.get_user(self.user_id)
        if not user:
            await self.close()
            return
        
        self.user = user
        
        # 加入群組
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # 發送未讀通知
        await self.send_unread_notifications()

    async def disconnect(self, close_code):
        """WebSocket 斷線"""
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """接收訊息"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'mark_read':
                # 標記通知為已讀
                notification_id = data.get('notification_id')
                await self.mark_notification_read(notification_id)
            
            elif message_type == 'get_notifications':
                # 取得通知列表
                await self.send_unread_notifications()
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': '無效的 JSON 格式'
            }))

    async def send_unread_notifications(self):
        """發送未讀通知"""
        notifications = await self.get_unread_notifications()
        await self.send(text_data=json.dumps({
            'type': 'notifications_list',
            'data': notifications,
            'timestamp': timezone.now().isoformat()
        }))

    # 群組消息處理方法
    async def new_notification(self, event):
        """處理新通知訊息"""
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'data': event['data'],
            'timestamp': event.get('timestamp', timezone.now().isoformat())
        }))

    async def alert_notification(self, event):
        """處理系統告警通知"""
        await self.send(text_data=json.dumps({
            'type': 'alert_notification',
            'data': event['data'],
            'timestamp': event.get('timestamp', timezone.now().isoformat())
        }))

    # 資料庫查詢方法
    @database_sync_to_async
    def get_user(self, user_id):
        """取得用戶"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def get_unread_notifications(self):
        """取得未讀通知"""
        # 這裡應該從通知系統取得資料
        # 目前返回模擬資料
        return [
            {
                'id': '1',
                'title': '支出提醒',
                'message': '您本月的支出已超過預算的80%',
                'type': 'warning',
                'created_at': timezone.now().isoformat(),
                'read': False
            }
        ]

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """標記通知為已讀"""
        # 實際實作中應該更新資料庫
        pass


class RealtimeStatsConsumer(AsyncWebsocketConsumer):
    """即時統計 Consumer - 輕量化版本"""
    
    async def connect(self):
        """WebSocket 連線"""
        await self.accept()
        
        # 發送簡單的連線確認訊息
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'data': {
                'status': 'connected',
                'message': 'WebSocket 連線成功',
                'server_time': timezone.now().isoformat()
            },
            'timestamp': timezone.now().isoformat()
        }))

    async def disconnect(self, close_code):
        """WebSocket 斷線"""
        pass

    async def receive(self, text_data):
        """接收客戶端訊息"""
        try:
            data = json.loads(text_data)
            
            # 簡單的 ping-pong 機制
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': timezone.now().isoformat()
                }))
        except json.JSONDecodeError:
            pass
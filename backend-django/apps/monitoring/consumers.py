"""
Monitoring WebSocket Consumers
"""

import json
import asyncio
import psutil
from datetime import datetime, timedelta
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings

User = get_user_model()


class SystemMonitorConsumer(AsyncWebsocketConsumer):
    """系統監控 Consumer"""
    
    async def connect(self):
        """WebSocket 連線"""
        self.system_group_name = 'system_monitor'
        
        # 加入群組
        await self.channel_layer.group_add(
            self.system_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # 開始系統監控
        asyncio.create_task(self.monitor_system())

    async def disconnect(self, close_code):
        """WebSocket 斷線"""
        await self.channel_layer.group_discard(
            self.system_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """接收訊息"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'get_system_info':
                # 立即發送系統資訊
                await self.send_system_metrics()
            
            elif message_type == 'set_update_interval':
                # 設定更新間隔
                interval = data.get('interval', 30)
                self.update_interval = max(5, min(300, interval))  # 5-300 秒之間
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': '無效的 JSON 格式'
            }))

    async def monitor_system(self):
        """系統監控循環"""
        self.update_interval = 30  # 預設30秒更新一次
        
        while True:
            try:
                await self.send_system_metrics()
                await asyncio.sleep(self.update_interval)
            except:
                break

    async def send_system_metrics(self):
        """發送系統指標"""
        try:
            # 取得系統資源使用情況
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # 網路統計
            net_io = psutil.net_io_counters()
            
            # 程序資訊
            process_count = len(psutil.pids())
            
            # 系統負載（Linux/Unix）
            try:
                load_avg = psutil.getloadavg()
            except:
                load_avg = [0, 0, 0]
            
            metrics = {
                'cpu_usage': cpu_percent,
                'memory': {
                    'total': memory.total,
                    'used': memory.used,
                    'available': memory.available,
                    'percent': memory.percent
                },
                'disk': {
                    'total': disk.total,
                    'used': disk.used,
                    'free': disk.free,
                    'percent': disk.percent
                },
                'network': {
                    'bytes_sent': net_io.bytes_sent,
                    'bytes_recv': net_io.bytes_recv,
                    'packets_sent': net_io.packets_sent,
                    'packets_recv': net_io.packets_recv
                },
                'process_count': process_count,
                'load_average': load_avg,
                'timestamp': timezone.now().isoformat()
            }
            
            # 儲存指標到資料庫
            await self.save_system_metrics(metrics)
            
            # 發送給所有連線的客戶端
            await self.channel_layer.group_send(
                self.system_group_name,
                {
                    'type': 'system_metrics_update',
                    'data': metrics
                }
            )
            
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'系統監控錯誤: {str(e)}'
            }))

    async def system_metrics_update(self, event):
        """處理系統指標更新訊息"""
        await self.send(text_data=json.dumps({
            'type': 'system_metrics',
            'data': event['data']
        }))

    @database_sync_to_async
    def save_system_metrics(self, metrics):
        """儲存系統指標到資料庫"""
        from .models import SystemMetric
        
        # 儲存主要指標
        SystemMetric.objects.create(
            metric_type='cpu_usage',
            value=metrics['cpu_usage'],
            unit='%'
        )
        
        SystemMetric.objects.create(
            metric_type='memory_usage',
            value=metrics['memory']['percent'],
            unit='%'
        )
        
        SystemMetric.objects.create(
            metric_type='disk_usage',
            value=metrics['disk']['percent'],
            unit='%'
        )


class AlertConsumer(AsyncWebsocketConsumer):
    """告警監控 Consumer"""
    
    async def connect(self):
        """WebSocket 連線"""
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.alert_group_name = f'alerts_{self.user_id}'
        
        # 驗證用戶身份
        user = await self.get_user(self.user_id)
        if not user:
            await self.close()
            return
        
        self.user = user
        
        # 加入群組
        await self.channel_layer.group_add(
            self.alert_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # 發送當前活躍告警
        await self.send_active_alerts()

    async def disconnect(self, close_code):
        """WebSocket 斷線"""
        await self.channel_layer.group_discard(
            self.alert_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """接收訊息"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'acknowledge_alert':
                # 確認告警
                alert_id = data.get('alert_id')
                await self.acknowledge_alert(alert_id)
            
            elif message_type == 'get_alerts':
                # 取得告警列表
                await self.send_active_alerts()
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': '無效的 JSON 格式'
            }))

    async def send_active_alerts(self):
        """發送活躍告警"""
        alerts = await self.get_active_alerts()
        await self.send(text_data=json.dumps({
            'type': 'active_alerts',
            'data': alerts,
            'timestamp': timezone.now().isoformat()
        }))

    async def new_alert(self, event):
        """處理新告警訊息"""
        await self.send(text_data=json.dumps({
            'type': 'new_alert',
            'data': event['data'],
            'timestamp': event.get('timestamp', timezone.now().isoformat())
        }))

    async def alert_resolved(self, event):
        """處理告警解決訊息"""
        await self.send(text_data=json.dumps({
            'type': 'alert_resolved',
            'data': event['data'],
            'timestamp': event.get('timestamp', timezone.now().isoformat())
        }))

    @database_sync_to_async
    def get_user(self, user_id):
        """取得用戶"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def get_active_alerts(self):
        """取得活躍告警"""
        from .models import Alert
        
        alerts = Alert.objects.filter(
            status__in=['active', 'acknowledged']
        ).order_by('-created_at')[:10]
        
        alert_list = []
        for alert in alerts:
            alert_list.append({
                'id': str(alert.id),
                'title': alert.title,
                'description': alert.description,
                'severity': alert.severity,
                'status': alert.status,
                'created_at': alert.created_at.isoformat()
            })
        
        return alert_list

    @database_sync_to_async
    def acknowledge_alert(self, alert_id):
        """確認告警"""
        from .models import Alert
        
        try:
            alert = Alert.objects.get(id=alert_id)
            alert.acknowledge(self.user)
            return True
        except Alert.DoesNotExist:
            return False


class ActivityMonitorConsumer(AsyncWebsocketConsumer):
    """活動監控 Consumer"""
    
    async def connect(self):
        """WebSocket 連線"""
        self.activity_group_name = 'activity_monitor'
        
        # 加入群組
        await self.channel_layer.group_add(
            self.activity_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # 發送最近活動
        await self.send_recent_activities()

    async def disconnect(self, close_code):
        """WebSocket 斷線"""
        await self.channel_layer.group_discard(
            self.activity_group_name,
            self.channel_name
        )

    async def send_recent_activities(self):
        """發送最近活動"""
        activities = await self.get_recent_activities()
        await self.send(text_data=json.dumps({
            'type': 'recent_activities',
            'data': activities,
            'timestamp': timezone.now().isoformat()
        }))

    async def new_activity(self, event):
        """處理新活動訊息"""
        await self.send(text_data=json.dumps({
            'type': 'new_activity',
            'data': event['data'],
            'timestamp': event.get('timestamp', timezone.now().isoformat())
        }))

    @database_sync_to_async
    def get_recent_activities(self):
        """取得最近活動"""
        from .models import UserActivity
        
        activities = UserActivity.objects.select_related('user').order_by('-timestamp')[:20]
        
        activity_list = []
        for activity in activities:
            activity_list.append({
                'id': str(activity.id),
                'user_name': activity.user.name,
                'action': activity.get_action_display(),
                'object_type': activity.object_type,
                'success': activity.success,
                'timestamp': activity.timestamp.isoformat()
            })
        
        return activity_list
"""
Dashboard 工具函數
"""

import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from django.conf import settings


class RealtimeNotificationService:
    """即時通知服務"""
    
    def __init__(self):
        self.channel_layer = get_channel_layer()
    
    def send_dashboard_update(self, user_id, data):
        """發送儀表板更新通知"""
        if not settings.REALTIME_NOTIFICATIONS.get('DASHBOARD_METRICS', True):
            return
        
        async_to_sync(self.channel_layer.group_send)(
            f'dashboard_{user_id}',
            {
                'type': 'dashboard_update',
                'data': data,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    def send_expense_notification(self, user_id, expense_data, action='created'):
        """發送支出相關通知"""
        if not settings.REALTIME_NOTIFICATIONS.get('EXPENSE_UPDATES', True):
            return
        
        async_to_sync(self.channel_layer.group_send)(
            f'dashboard_{user_id}',
            {
                'type': f'expense_{action}',
                'data': expense_data,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    def send_notification(self, user_id, notification_data):
        """發送通用通知"""
        async_to_sync(self.channel_layer.group_send)(
            f'notifications_{user_id}',
            {
                'type': 'new_notification',
                'data': notification_data,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    def send_system_alert(self, user_id, alert_data):
        """發送系統告警通知"""
        if not settings.REALTIME_NOTIFICATIONS.get('SYSTEM_ALERTS', True):
            return
        
        async_to_sync(self.channel_layer.group_send)(
            f'notifications_{user_id}',
            {
                'type': 'alert_notification',
                'data': alert_data,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    def broadcast_stats_update(self, stats_data):
        """廣播統計資料更新"""
        async_to_sync(self.channel_layer.group_send)(
            'realtime_stats',
            {
                'type': 'stats_update',
                'data': stats_data,
                'timestamp': timezone.now().isoformat()
            }
        )


class WebSocketManager:
    """WebSocket 連線管理器"""
    
    @staticmethod
    def get_user_connections(user_id):
        """取得用戶的 WebSocket 連線數量"""
        # 實際實作中可能需要使用 Redis 來追蹤連線
        # 這裡返回模擬資料
        return 1
    
    @staticmethod
    def is_user_online(user_id):
        """檢查用戶是否在線"""
        return WebSocketManager.get_user_connections(user_id) > 0
    
    @staticmethod
    def get_all_online_users():
        """取得所有在線用戶"""
        # 實際實作中應該從 channel layer 或 Redis 取得
        return []


# 全域服務實例
notification_service = RealtimeNotificationService()


def send_dashboard_update(user_id, data):
    """發送儀表板更新（便捷函數）"""
    notification_service.send_dashboard_update(user_id, data)


def send_expense_notification(user_id, expense_data, action='created'):
    """發送支出通知（便捷函數）"""
    notification_service.send_expense_notification(user_id, expense_data, action)


def send_notification(user_id, title, message, notification_type='info'):
    """發送通知（便捷函數）"""
    notification_data = {
        'title': title,
        'message': message,
        'type': notification_type,
        'created_at': timezone.now().isoformat()
    }
    notification_service.send_notification(user_id, notification_data)


def send_system_alert(user_id, alert_title, alert_message, severity='warning'):
    """發送系統告警（便捷函數）"""
    alert_data = {
        'title': alert_title,
        'message': alert_message,
        'severity': severity,
        'created_at': timezone.now().isoformat()
    }
    notification_service.send_system_alert(user_id, alert_data)


def broadcast_stats_update(stats_data):
    """廣播統計更新（便捷函數）"""
    notification_service.broadcast_stats_update(stats_data)
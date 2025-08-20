"""
Monitoring 工具函數
"""

import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from django.conf import settings


class MonitoringService:
    """監控服務"""
    
    def __init__(self):
        self.channel_layer = get_channel_layer()
    
    def send_system_metrics(self, metrics_data):
        """發送系統指標更新"""
        async_to_sync(self.channel_layer.group_send)(
            'system_monitor',
            {
                'type': 'system_metrics_update',
                'data': metrics_data
            }
        )
    
    def send_new_alert(self, user_id, alert_data):
        """發送新告警通知"""
        async_to_sync(self.channel_layer.group_send)(
            f'alerts_{user_id}',
            {
                'type': 'new_alert',
                'data': alert_data,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    def send_alert_resolved(self, user_id, alert_data):
        """發送告警解決通知"""
        async_to_sync(self.channel_layer.group_send)(
            f'alerts_{user_id}',
            {
                'type': 'alert_resolved',
                'data': alert_data,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    def send_activity_update(self, activity_data):
        """發送活動更新"""
        if not settings.REALTIME_NOTIFICATIONS.get('USER_ACTIVITIES', True):
            return
        
        async_to_sync(self.channel_layer.group_send)(
            'activity_monitor',
            {
                'type': 'new_activity',
                'data': activity_data,
                'timestamp': timezone.now().isoformat()
            }
        )


class AlertManager:
    """告警管理器"""
    
    def __init__(self):
        self.monitoring_service = MonitoringService()
    
    def create_alert(self, title, description, severity='warning', source_type='system', condition=None, current_value=None):
        """創建新告警"""
        from .models import Alert
        
        # 檢查是否已有相同的活躍告警
        existing_alert = Alert.objects.filter(
            title=title,
            status__in=['active', 'acknowledged'],
            source_type=source_type
        ).first()
        
        if existing_alert:
            # 更新現有告警的當前值
            if current_value:
                existing_alert.current_value = current_value
                existing_alert.save()
            return existing_alert
        
        # 創建新告警
        alert = Alert.objects.create(
            title=title,
            description=description,
            severity=severity,
            source_type=source_type,
            condition=condition or {},
            current_value=current_value or {}
        )
        
        # 發送告警通知給所有管理員
        self.notify_administrators(alert)
        
        return alert
    
    def resolve_alert(self, alert_id, user, notes=''):
        """解決告警"""
        from .models import Alert
        
        try:
            alert = Alert.objects.get(id=alert_id)
            alert.resolve(user, notes)
            
            # 發送告警解決通知
            alert_data = {
                'id': str(alert.id),
                'title': alert.title,
                'resolved_by': user.name,
                'resolution_notes': notes
            }
            
            # 通知所有管理員
            self.notify_administrators_resolved(alert_data)
            
            return alert
        except Alert.DoesNotExist:
            return None
    
    def notify_administrators(self, alert):
        """通知管理員新告警"""
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # 取得所有管理員
        administrators = User.objects.filter(is_staff=True, is_active=True)
        
        alert_data = {
            'id': str(alert.id),
            'title': alert.title,
            'description': alert.description,
            'severity': alert.severity,
            'source_type': alert.source_type,
            'created_at': alert.created_at.isoformat()
        }
        
        # 發送給每個管理員
        for admin in administrators:
            self.monitoring_service.send_new_alert(str(admin.id), alert_data)
    
    def notify_administrators_resolved(self, alert_data):
        """通知管理員告警已解決"""
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        administrators = User.objects.filter(is_staff=True, is_active=True)
        
        for admin in administrators:
            self.monitoring_service.send_alert_resolved(str(admin.id), alert_data)


class PerformanceMonitor:
    """效能監控器"""
    
    def __init__(self):
        self.alert_manager = AlertManager()
    
    def check_system_metrics(self, metrics):
        """檢查系統指標並生成告警"""
        
        # 檢查 CPU 使用率
        if metrics.get('cpu_usage', 0) > 90:
            self.alert_manager.create_alert(
                title='CPU 使用率過高',
                description=f'系統 CPU 使用率達到 {metrics["cpu_usage"]:.1f}%',
                severity='critical',
                source_type='system',
                condition={'threshold': 90, 'metric': 'cpu_usage'},
                current_value={'cpu_usage': metrics['cpu_usage']}
            )
        elif metrics.get('cpu_usage', 0) > 70:
            self.alert_manager.create_alert(
                title='CPU 使用率警告',
                description=f'系統 CPU 使用率達到 {metrics["cpu_usage"]:.1f}%',
                severity='warning',
                source_type='system',
                condition={'threshold': 70, 'metric': 'cpu_usage'},
                current_value={'cpu_usage': metrics['cpu_usage']}
            )
        
        # 檢查記憶體使用率
        memory_percent = metrics.get('memory', {}).get('percent', 0)
        if memory_percent > 90:
            self.alert_manager.create_alert(
                title='記憶體使用率過高',
                description=f'系統記憶體使用率達到 {memory_percent:.1f}%',
                severity='critical',
                source_type='system',
                condition={'threshold': 90, 'metric': 'memory_usage'},
                current_value={'memory_usage': memory_percent}
            )
        
        # 檢查磁碟使用率
        disk_percent = metrics.get('disk', {}).get('percent', 0)
        if disk_percent > 85:
            self.alert_manager.create_alert(
                title='磁碟空間不足',
                description=f'系統磁碟使用率達到 {disk_percent:.1f}%',
                severity='warning',
                source_type='system',
                condition={'threshold': 85, 'metric': 'disk_usage'},
                current_value={'disk_usage': disk_percent}
            )
    
    def check_response_time(self, path, response_time):
        """檢查 API 回應時間"""
        # 如果回應時間超過 5 秒，產生告警
        if response_time > 5000:  # 5 秒 = 5000 毫秒
            self.alert_manager.create_alert(
                title='API 回應時間過長',
                description=f'API 端點 {path} 回應時間為 {response_time:.0f} 毫秒',
                severity='warning',
                source_type='api',
                condition={'threshold': 5000, 'metric': 'response_time', 'path': path},
                current_value={'response_time': response_time, 'path': path}
            )


class ActivityTracker:
    """活動追蹤器"""
    
    def __init__(self):
        self.monitoring_service = MonitoringService()
    
    def track_user_activity(self, user, action, object_type=None, object_id=None, 
                          ip_address=None, user_agent=None, details=None, success=True):
        """記錄用戶活動"""
        from .models import UserActivity
        
        # 創建活動記錄
        activity = UserActivity.objects.create(
            user=user,
            action=action,
            object_type=object_type or '',
            object_id=object_id or '',
            ip_address=ip_address,
            user_agent=user_agent or '',
            details=details or {},
            success=success
        )
        
        # 發送即時活動更新
        activity_data = {
            'id': str(activity.id),
            'user_name': user.name,
            'action': activity.get_action_display(),
            'object_type': activity.object_type,
            'success': activity.success,
            'timestamp': activity.timestamp.isoformat()
        }
        
        self.monitoring_service.send_activity_update(activity_data)
        
        return activity
    
    def track_api_call(self, request, response, response_time):
        """記錄 API 呼叫"""
        from .models import APIMetric
        
        # 取得請求資訊
        method = request.method
        path = request.path
        user = getattr(request, 'user', None) if hasattr(request, 'user') and request.user.is_authenticated else None
        status_code = getattr(response, 'status_code', 0)
        
        # 計算請求/回應大小
        request_size = len(request.body) if hasattr(request, 'body') else 0
        response_size = len(getattr(response, 'content', b''))
        
        # 取得客戶端資訊
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # 創建 API 指標記錄
        api_metric = APIMetric.objects.create(
            method=method,
            path=path,
            user=user,
            status_code=status_code,
            response_time=response_time,
            request_size=request_size,
            response_size=response_size,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # 檢查回應時間是否異常
        performance_monitor = PerformanceMonitor()
        performance_monitor.check_response_time(path, response_time)
        
        return api_metric


# 全域服務實例
monitoring_service = MonitoringService()
alert_manager = AlertManager()
performance_monitor = PerformanceMonitor()
activity_tracker = ActivityTracker()


# 便捷函數
def track_user_activity(user, action, **kwargs):
    """追蹤用戶活動（便捷函數）"""
    return activity_tracker.track_user_activity(user, action, **kwargs)


def create_alert(title, description, severity='warning', **kwargs):
    """創建告警（便捷函數）"""
    return alert_manager.create_alert(title, description, severity, **kwargs)


def check_system_health(metrics):
    """檢查系統健康狀況（便捷函數）"""
    performance_monitor.check_system_metrics(metrics)
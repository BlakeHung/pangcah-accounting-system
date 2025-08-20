"""
Dashboard WebSocket URL 配置
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/realtime-stats/$', consumers.RealtimeStatsConsumer.as_asgi()),
    re_path(r'^ws/dashboard/(?P<user_id>\w+)/$', consumers.DashboardConsumer.as_asgi()),
    re_path(r'^ws/notifications/(?P<user_id>\w+)/$', consumers.NotificationConsumer.as_asgi()),
]
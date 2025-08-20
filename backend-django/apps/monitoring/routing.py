"""
Monitoring WebSocket URL 配置
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/monitoring/system/$', consumers.SystemMonitorConsumer.as_asgi()),
    re_path(r'^ws/monitoring/alerts/(?P<user_id>\w+)/$', consumers.AlertConsumer.as_asgi()),
    re_path(r'^ws/monitoring/activities/$', consumers.ActivityMonitorConsumer.as_asgi()),
]
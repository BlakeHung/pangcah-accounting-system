"""
監控管理 URL 配置
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SystemMetricViewSet, UserActivityViewSet, APIMetricViewSet,
    AlertViewSet, PerformanceBaselineViewSet
)

router = DefaultRouter()
router.register(r'system-metrics', SystemMetricViewSet, basename='system-metrics')
router.register(r'user-activities', UserActivityViewSet, basename='user-activities')
router.register(r'api-metrics', APIMetricViewSet, basename='api-metrics')
router.register(r'alerts', AlertViewSet, basename='alerts')
router.register(r'baselines', PerformanceBaselineViewSet, basename='performance-baselines')

urlpatterns = [
    path('', include(router.urls)),
]
"""
儀表板 URL 配置
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardConfigViewSet, AlertNotificationViewSet, 
    FinancialGoalViewSet, DashboardAPIView
)

router = DefaultRouter()
router.register(r'config', DashboardConfigViewSet, basename='dashboard-config')
router.register(r'notifications', AlertNotificationViewSet, basename='alert-notifications')
router.register(r'goals', FinancialGoalViewSet, basename='financial-goals')
router.register(r'api', DashboardAPIView, basename='dashboard-api')

urlpatterns = [
    path('', include(router.urls)),
]
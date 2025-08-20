"""
報表管理 URL 配置
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReportTemplateViewSet, ReportConfigViewSet, 
    ReportGenerationViewSet, ReportShareViewSet
)

router = DefaultRouter()
router.register(r'templates', ReportTemplateViewSet, basename='report-templates')
router.register(r'configs', ReportConfigViewSet, basename='report-configs')
router.register(r'generations', ReportGenerationViewSet, basename='report-generations')
router.register(r'shares', ReportShareViewSet, basename='report-shares')

urlpatterns = [
    path('', include(router.urls)),
]
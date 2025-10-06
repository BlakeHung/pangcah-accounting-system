"""
Pangcah Accounting URL Configuration
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

def api_root(request):
    return JsonResponse({
        'message': 'Pangcah Accounting API',
        'version': '1.0.0',
        'endpoints': {
            'api_docs': '/api/docs/',
            'api_redoc': '/api/redoc/',
            'admin': '/admin/',
            'categories': '/api/v1/categories/',
            'events': '/api/v1/events/',
            'expenses': '/api/v1/expenses/',
            'groups': '/api/v1/groups/',
            'auth': '/api/v1/auth/',
            'dashboard': '/api/v1/dashboard/',
            'reports': '/api/v1/reports/',
            'monitoring': '/api/v1/monitoring/',
        }
    })

def health_check(request):
    """簡單的健康檢查端點，用於 Railway serverless"""
    return JsonResponse({
        'status': 'healthy',
        'message': 'Pangcah Accounting API is running',
        'mode': 'serverless'
    })

urlpatterns = [
    # Root API info
    path('', api_root, name='api-root'),

    # Health check for Railway serverless
    path('api/health/', health_check, name='health-check'),

    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API Routes
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/categories/', include('apps.categories.urls')),
    path('api/v1/events/', include('apps.events.urls')),
    path('api/v1/expenses/', include('apps.expenses.urls')),
    path('api/v1/groups/', include('apps.groups.urls')),
    path('api/v1/dashboard/', include('apps.dashboard.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/monitoring/', include('apps.monitoring.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Debug toolbar
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
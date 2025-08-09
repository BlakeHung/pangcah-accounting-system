"""
開發環境設定
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# CORS settings for development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React 開發服務器
    "http://localhost:5173",  # Vite 開發服務器
]

CORS_ALLOW_ALL_ORIGINS = True  # 開發環境允許所有來源

# Additional apps for development
INSTALLED_APPS += [
    'django_extensions',
    'debug_toolbar',
]

MIDDLEWARE += [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

# Debug toolbar settings
INTERNAL_IPS = [
    '127.0.0.1',
]

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Cache (使用本地記憶體快取)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
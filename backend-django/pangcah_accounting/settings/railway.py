"""
Railway-specific settings
"""
from .base import *
import os
import dj_database_url

DEBUG = False
ALLOWED_HOSTS = ['*']

# Get DATABASE_URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    # Clean up any template syntax artifacts
    DATABASE_URL = DATABASE_URL.replace('}}', '').replace('{{', '')
    print(f"✅ Using DATABASE_URL from environment: {DATABASE_URL[:50]}...")
    
    try:
        DATABASES = {
            'default': dj_database_url.parse(DATABASE_URL)
        }
        print(f"✅ Database parsed successfully: {DATABASES['default']['NAME']}")
    except Exception as e:
        print(f"❌ Database parsing failed: {e}")
        raise
else:
    raise Exception("DATABASE_URL environment variable not found!")

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# WhiteNoise - 插入在 SecurityMiddleware 之後
# 找到 SecurityMiddleware 的位置並在其後插入 WhiteNoise
for i, mw in enumerate(MIDDLEWARE):
    if 'SecurityMiddleware' in mw:
        MIDDLEWARE.insert(i + 1, 'whitenoise.middleware.WhiteNoiseMiddleware')
        break
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# CORS - 確保 middleware 順序正確
# corsheaders.middleware.CorsMiddleware 必須在 CommonMiddleware 之前

CORS_ALLOWED_ORIGINS = [
    "https://pangcah-accounting-system.vercel.app",  # 你的 Vercel 前端
    "https://pangcah-accounting-frontend.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# 暫時允許所有來源以進行測試
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Security
SECURE_SSL_REDIRECT = False  # Railway handles HTTPS
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
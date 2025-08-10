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

# CORS 設定 - 最寬鬆的設定來修復問題
CORS_ALLOW_ALL_ORIGINS = True  # 允許所有來源
CORS_ALLOW_CREDENTIALS = True  # 允許 cookies
CORS_ALLOW_METHODS = ['*']  # 允許所有方法
CORS_ALLOW_HEADERS = ['*']  # 允許所有 headers

# 如果上面的設定還不行，明確列出來源
CORS_ALLOWED_ORIGINS = [
    "https://pangcah-accounting-system.vercel.app",
    "https://pangcah-accounting-frontend.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
]

# 確保 CORS middleware 在最前面
if 'corsheaders.middleware.CorsMiddleware' in MIDDLEWARE:
    MIDDLEWARE.remove('corsheaders.middleware.CorsMiddleware')
MIDDLEWARE.insert(0, 'corsheaders.middleware.CorsMiddleware')

# Security
SECURE_SSL_REDIRECT = False  # Railway handles HTTPS
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
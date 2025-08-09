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

# WhiteNoise
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# CORS
CORS_ALLOWED_ORIGINS = [
    "https://*.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
]

CORS_ALLOW_ALL_ORIGINS = True  # Temporary for testing

# Security
SECURE_SSL_REDIRECT = False  # Railway handles HTTPS
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
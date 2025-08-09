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
    print("✅ Using DATABASE_URL from environment variables")
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
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
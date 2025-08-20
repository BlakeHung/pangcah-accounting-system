"""
ASGI config for pangcah_accounting project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pangcah_accounting.settings.production')

django_asgi_app = get_asgi_application()

# WebSocket routing
from apps.dashboard import routing as dashboard_routing
from apps.monitoring import routing as monitoring_routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter([
                *dashboard_routing.websocket_urlpatterns,
                *monitoring_routing.websocket_urlpatterns,
            ])
        )
    ),
})
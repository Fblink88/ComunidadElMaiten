"""
Módulo de Middleware.

Este módulo contiene los middlewares de la aplicación,
incluyendo la autenticación de requests.
"""

from .auth_middleware import get_current_user, get_admin_user
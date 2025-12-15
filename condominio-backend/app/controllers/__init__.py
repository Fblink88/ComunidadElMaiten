"""
Módulo de Controladores.

Este módulo contiene los controladores (routers) de la API.
Cada controlador maneja un grupo de endpoints relacionados.
"""

from .auth_controller import router as auth_router
from .departamento_controller import router as departamento_router
from .usuario_controller import router as usuario_router
from .pago_controller import router as pago_router
from .gasto_controller import router as gasto_router
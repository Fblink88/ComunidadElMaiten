"""
Módulo de Servicios.

Este módulo contiene la lógica de negocio de la aplicación.
Los servicios son el intermediario entre los controladores y los repositorios.

Responsabilidades de los servicios:
- Validar reglas de negocio
- Verificar permisos de usuario
- Coordinar operaciones entre múltiples repositorios
- Llamar a servicios externos (Flow, Email, etc.)
"""

from .auth_service import AuthService
from .departamento_service import DepartamentoService
from .usuario_service import UsuarioService
from .pago_service import PagoService
from .gasto_service import GastoService
"""
Módulo de Repositorios.

Este módulo contiene los repositorios que manejan el acceso a datos.
Los repositorios encapsulan todas las operaciones de Firestore,
proporcionando una capa de abstracción sobre la base de datos.

Patrón Repository:
- Separa la lógica de acceso a datos de la lógica de negocio
- Facilita testing (se puede mockear el repositorio)
- Permite cambiar de base de datos sin afectar los servicios
"""

from .base_repository import BaseRepository
from .departamento_repository import DepartamentoRepository
from .usuario_repository import UsuarioRepository
from .pago_repository import PagoRepository
from .gasto_repository import GastoRepository
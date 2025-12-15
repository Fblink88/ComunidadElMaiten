"""
Módulo de Modelos (Schemas Pydantic).

Este módulo contiene los modelos de datos de la aplicación.
Los modelos definen la estructura de los datos que se reciben
y envían a través de la API, con validación automática.

Tipos de modelos:
- Base: Campos comunes compartidos
- Create: Para crear nuevos registros (sin ID)
- Update: Para actualizar (campos opcionales)
- Response: Para respuestas de la API (con ID y timestamps)
"""

from .usuario import (
    UsuarioBase,
    UsuarioCreate,
    UsuarioUpdate,
    UsuarioResponse,
    UsuarioInDB
)

from .departamento import (
    DepartamentoBase,
    DepartamentoCreate,
    DepartamentoUpdate,
    DepartamentoResponse
)

from .pago import (
    PagoBase,
    PagoCreate,
    PagoUpdate,
    PagoResponse
)

from .gasto import (
    GastoMensualBase,
    GastoMensualCreate,
    GastoMensualResponse,
    GastoExtraordinarioBase,
    GastoExtraordinarioCreate,
    GastoExtraordinarioResponse,
    ItemGasto
)
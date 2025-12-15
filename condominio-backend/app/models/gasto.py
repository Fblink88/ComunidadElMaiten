"""
Modelos de Gasto.

Este archivo contiene los schemas Pydantic para los gastos del condominio.
Hay dos tipos de gastos:
- GastoMensual: Gastos comunes recurrentes (agua, luz, personal, etc.)
- GastoExtraordinario: Gastos únicos (reparaciones, mejoras, etc.)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class ItemGasto(BaseModel):
    """
    Representa un item individual dentro de los gastos mensuales.
    
    Ejemplos: 'Remuneración personal aseo', 'Agua', 'Electricidad'
    """
    concepto: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Descripción del gasto"
    )
    monto: int = Field(
        ...,
        ge=0,
        description="Monto del gasto en CLP"
    )


# ============================================
# GASTOS MENSUALES
# ============================================

class GastoMensualBase(BaseModel):
    """
    Campos base del gasto mensual.
    """
    periodo: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}$",
        description="Periodo en formato 'YYYY-MM'"
    )
    items: List[ItemGasto] = Field(
        ...,
        min_length=1,
        description="Lista de items de gasto del mes"
    )


class GastoMensualCreate(GastoMensualBase):
    """
    Schema para crear un nuevo gasto mensual.
    
    El total y valor por m² se calculan automáticamente.
    """
    pass


class GastoMensualUpdate(BaseModel):
    """
    Schema para actualizar un gasto mensual.
    """
    items: Optional[List[ItemGasto]] = None


class GastoMensualResponse(GastoMensualBase):
    """
    Schema para respuestas de la API.
    """
    id: str = Field(..., description="ID del gasto (igual al periodo)")
    total: int = Field(..., description="Suma total de todos los items")
    valor_por_m2: float = Field(
        ...,
        description="Valor calculado por metro cuadrado"
    )
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# GASTOS EXTRAORDINARIOS
# ============================================

class PagoExtraordinario(BaseModel):
    """
    Registro de pago de un gasto extraordinario por departamento.
    """
    pagado: bool = Field(default=False)
    fecha_pago: Optional[datetime] = None


class GastoExtraordinarioBase(BaseModel):
    """
    Campos base del gasto extraordinario.
    """
    concepto: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Descripción del gasto extraordinario"
    )
    monto_total: int = Field(
        ...,
        gt=0,
        description="Monto total del gasto en CLP"
    )
    monto_por_depto: int = Field(
        ...,
        gt=0,
        description="Monto que debe pagar cada departamento en CLP"
    )


class GastoExtraordinarioCreate(GastoExtraordinarioBase):
    """
    Schema para crear un nuevo gasto extraordinario.
    """
    pass


class GastoExtraordinarioUpdate(BaseModel):
    """
    Schema para actualizar un gasto extraordinario.
    """
    concepto: Optional[str] = Field(None, min_length=2, max_length=200)
    monto_total: Optional[int] = Field(None, gt=0)
    monto_por_depto: Optional[int] = Field(None, gt=0)


class GastoExtraordinarioResponse(GastoExtraordinarioBase):
    """
    Schema para respuestas de la API.
    """
    id: str = Field(..., description="ID único del gasto extraordinario")
    fecha: datetime = Field(..., description="Fecha en que se registró")
    pagos: Dict[str, PagoExtraordinario] = Field(
        default={},
        description="Estado de pago por departamento: {'depto_id': {pagado, fecha}}"
    )
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
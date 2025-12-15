"""
Modelos de Pago.

Este archivo contiene los schemas Pydantic para la entidad Pago.
Los pagos registran las transacciones de gastos comunes de cada departamento.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class EstadoPago(str, Enum):
    """
    Estados posibles de un pago.
    """
    PENDIENTE = "pendiente"
    PAGADO = "pagado"
    VERIFICANDO = "verificando"
    RECHAZADO = "rechazado"


class MetodoPago(str, Enum):
    """
    Métodos de pago disponibles.
    """
    FLOW = "flow"
    TRANSFERENCIA_MANUAL = "transferencia_manual"


class PagoBase(BaseModel):
    """
    Campos base del pago.
    """
    departamento_id: str = Field(
        ...,
        description="ID del departamento que realiza el pago"
    )
    monto: int = Field(
        ...,
        gt=0,
        description="Monto del pago en CLP"
    )
    periodo: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}$",
        description="Periodo del pago en formato 'YYYY-MM' (ej: '2025-01')"
    )


class PagoCreate(PagoBase):
    """
    Schema para crear un nuevo pago.
    
    El estado inicial siempre es 'pendiente'.
    """
    metodo: MetodoPago = Field(
        default=MetodoPago.FLOW,
        description="Método de pago a utilizar"
    )


class PagoUpdate(BaseModel):
    """
    Schema para actualizar un pago.
    
    Principalmente usado por admin para verificar pagos manuales.
    """
    estado: Optional[EstadoPago] = None
    verificado_por: Optional[str] = Field(
        None,
        description="ID del admin que verificó el pago"
    )
    notas: Optional[str] = Field(
        None,
        max_length=500,
        description="Notas adicionales sobre el pago"
    )


class PagoResponse(PagoBase):
    """
    Schema para respuestas de la API.
    """
    id: str = Field(..., description="ID único del pago")
    estado: EstadoPago = Field(..., description="Estado actual del pago")
    metodo: MetodoPago = Field(..., description="Método de pago utilizado")
    flow_payment_id: Optional[str] = Field(
        None,
        description="ID de transacción de Flow (si aplica)"
    )
    flow_payment_url: Optional[str] = Field(
        None,
        description="URL de pago de Flow (si aplica)"
    )
    fecha_pago: Optional[datetime] = Field(
        None,
        description="Fecha en que se realizó el pago"
    )
    verificado_por: Optional[str] = Field(
        None,
        description="ID del admin que verificó el pago"
    )
    notas: Optional[str] = None
    created_at: datetime = Field(..., description="Fecha de creación del registro")

    class Config:
        from_attributes = True
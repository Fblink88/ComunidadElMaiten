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
    PROYECTADO = "proyectado"


class MetodoPago(str, Enum):
    """
    Métodos de pago disponibles.
    """
    FLOW = "flow"
    KHIPU = "khipu"
    TRANSFERENCIA_MANUAL = "transferencia_manual"
    IMPORTACION_HISTORICA = "importacion_historica"
    AJUSTE_MANUAL = "ajuste_manual"


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
        default=MetodoPago.KHIPU,
        description="Método de pago a utilizar"
    )

class PagoOnlineRequest(BaseModel):
    """
    Schema para iniciar un pago online a la billetera.
    """
    departamento_id: str = Field(
        ...,
        description="ID del departamento que recargará saldo"
    )
    monto: int = Field(
        ...,
        gt=0,
        description="Monto a recargar en CLP"
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
    metodo: Optional[MetodoPago] = Field(None, description="Método de pago utilizado")
    monto_pagado: Optional[float] = Field(0, description="Monto ya pagado del total")
    khipu_payment_id: Optional[str] = Field(
        None,
        description="ID de transacción de Khipu (si aplica)"
    )
    khipu_payment_url: Optional[str] = Field(
        None,
        description="URL de pago de Khipu (si aplica)"
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
    created_at: Optional[datetime] = Field(
        None, 
        description="Fecha de creación del registro"
    )
    updated_at: Optional[datetime] = Field(
        None,
        description="Fecha de actualización"
    )

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
        "from_attributes": True
    }
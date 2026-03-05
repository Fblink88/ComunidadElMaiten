"""
Modelos de Autorización de Pagos.

Este módulo contiene los modelos relacionados con el sistema de autorización
que permite a los propietarios autorizar a arrendatarios para pagar gastos comunes.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TipoAutorizacion(str, Enum):
    """
    Tipos de autorización disponibles.
    """
    PERMANENTE = "permanente"  # Para todos los periodos futuros
    OCASIONAL = "ocasional"    # Para periodos específicos


class EstadoAutorizacion(str, Enum):
    """
    Estados posibles de una autorización.
    """
    PENDIENTE = "pendiente"    # Esperando aprobación del propietario
    APROBADA = "aprobada"      # Autorización activa
    RECHAZADA = "rechazada"    # Rechazada por el propietario
    REVOCADA = "revocada"      # Revocada después de haber sido aprobada


class AutorizacionBase(BaseModel):
    """
    Modelo base de autorización.
    Campos comunes para crear y responder.
    """
    departamento_id: str = Field(..., description="ID del departamento")
    propietario_id: str = Field(..., description="ID del propietario que autoriza")
    arrendatario_id: str = Field(..., description="ID del arrendatario autorizado")
    tipo: TipoAutorizacion = Field(..., description="Tipo de autorización")
    periodos_autorizados: Optional[List[str]] = Field(
        None,
        description="Periodos autorizados (solo para ocasional). Formato: ['2025-01', '2025-03']"
    )
    nota_solicitud: Optional[str] = Field(
        None,
        max_length=500,
        description="Nota del arrendatario al solicitar"
    )


class AutorizacionCreate(BaseModel):
    """
    Modelo para crear una solicitud de autorización (desde arrendatario).
    """
    tipo: TipoAutorizacion = Field(..., description="Tipo de autorización solicitada")
    periodos_autorizados: Optional[List[str]] = Field(
        None,
        description="Periodos solicitados (requerido si tipo es 'ocasional')"
    )
    nota_solicitud: Optional[str] = Field(
        None,
        max_length=500,
        description="Mensaje para el propietario"
    )


class AutorizacionDirectaCreate(BaseModel):
    """
    Modelo para crear una autorización directa (propietario autoriza sin solicitud).
    """
    arrendatario_id: str = Field(..., description="ID del arrendatario a autorizar")
    tipo: TipoAutorizacion = Field(..., description="Tipo de autorización")
    periodos_autorizados: Optional[List[str]] = Field(
        None,
        description="Periodos autorizados (requerido si tipo es 'ocasional')"
    )
    nota: Optional[str] = Field(
        None,
        max_length=500,
        description="Nota del propietario"
    )


class AutorizacionRespuesta(BaseModel):
    """
    Modelo para aprobar/rechazar una solicitud.
    """
    nota_respuesta: Optional[str] = Field(
        None,
        max_length=500,
        description="Motivo de la aprobación o rechazo (opcional)"
    )


class AutorizacionRevocacion(BaseModel):
    """
    Modelo para revocar una autorización aprobada.
    """
    motivo: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Motivo de la revocación"
    )


class AutorizacionResponse(BaseModel):
    """
    Modelo de respuesta de autorización.
    Incluye todos los campos incluyendo ID y timestamps.
    """
    id: str = Field(..., description="ID único de la autorización")
    departamento_id: str = Field(..., description="ID del departamento")
    propietario_id: str = Field(..., description="ID del propietario")
    arrendatario_id: str = Field(..., description="ID del arrendatario")
    tipo: TipoAutorizacion = Field(..., description="Tipo de autorización")
    estado: EstadoAutorizacion = Field(..., description="Estado actual")

    periodos_autorizados: Optional[List[str]] = Field(
        None,
        description="Periodos autorizados (solo ocasional)"
    )

    nota_solicitud: Optional[str] = Field(
        None,
        description="Nota del arrendatario al solicitar"
    )
    nota_respuesta: Optional[str] = Field(
        None,
        description="Respuesta del propietario"
    )

    fue_solicitada: bool = Field(
        ...,
        description="True si arrendatario solicitó, False si propietario autorizó directamente"
    )

    fecha_creacion: datetime = Field(..., description="Fecha de creación")
    fecha_respuesta: Optional[datetime] = Field(
        None,
        description="Fecha de aprobación/rechazo"
    )
    fecha_revocacion: Optional[datetime] = Field(
        None,
        description="Fecha de revocación (si aplica)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "auth123",
                "departamento_id": "depto11",
                "propietario_id": "user123",
                "arrendatario_id": "user456",
                "tipo": "ocasional",
                "estado": "aprobada",
                "periodos_autorizados": ["2025-01", "2025-03", "2025-06"],
                "nota_solicitud": "Necesito pagar estos meses",
                "nota_respuesta": "Aprobado sin problemas",
                "fue_solicitada": True,
                "fecha_creacion": "2025-01-15T10:30:00",
                "fecha_respuesta": "2025-01-15T14:20:00",
                "fecha_revocacion": None
            }
        }


class PuedePagarResponse(BaseModel):
    """
    Respuesta para verificar si un usuario puede pagar un periodo.
    """
    puede_pagar: bool = Field(..., description="True si puede pagar, False si no")
    motivo: str = Field(
        ...,
        description="Explicación del motivo (ej: 'Tienes autorización permanente')"
    )
    autorizacion_id: Optional[str] = Field(
        None,
        description="ID de la autorización activa (si existe)"
    )

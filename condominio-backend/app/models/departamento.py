"""
Modelos de Departamento.

Este archivo contiene los schemas Pydantic para la entidad Departamento.
Cada departamento representa una unidad del condominio con su
información de propietario, superficie y cuota mensual.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DepartamentoBase(BaseModel):
    """
    Campos base del departamento.
    
    Estos campos son comunes para crear, actualizar y responder.
    """
    numero: str = Field(
        ...,
        min_length=1,
        max_length=10,
        description="Número del departamento (ej: '11', '21')"
    )
    propietario: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Nombre del propietario actual"
    )
    metros_cuadrados: float = Field(
        ...,
        gt=0,
        description="Superficie del departamento en m²"
    )
    cuota_mensual: int = Field(
        default=0,
        ge=0,
        description="Monto de la cuota mensual en CLP (se calcula automáticamente)"
    )
    activo: bool = Field(
        default=True,
        description="Indica si el departamento está activo"
    )


class DepartamentoCreate(DepartamentoBase):
    """
    Schema para crear un nuevo departamento.
    
    No incluye ID ni lista de usuarios porque:
    - El ID lo genera Firestore automáticamente
    - Los usuarios se agregan después con endpoint separado
    """
    pass


class DepartamentoUpdate(BaseModel):
    """
    Schema para actualizar un departamento.
    
    Todos los campos son opcionales para permitir actualizaciones parciales.
    """
    numero: Optional[str] = Field(None, min_length=1, max_length=10)
    propietario: Optional[str] = Field(None, min_length=2, max_length=100)
    metros_cuadrados: Optional[float] = Field(None, gt=0)
    cuota_mensual: Optional[int] = Field(None, ge=0)
    activo: Optional[bool] = None


class DepartamentoResponse(DepartamentoBase):
    """
    Schema para respuestas de la API.
    
    Incluye el ID y la lista de usuarios asociados.
    """
    id: str = Field(..., description="ID único del departamento")
    usuarios_ids: List[str] = Field(
        default=[],
        description="Lista de IDs de usuarios asociados (máximo 5)"
    )
    created_at: Optional[datetime] = Field(None, description="Fecha de creación")
    updated_at: Optional[datetime] = Field(None, description="Fecha de última actualización")

    class Config:
        """Permite crear el modelo desde objetos de Firestore"""
        from_attributes = True
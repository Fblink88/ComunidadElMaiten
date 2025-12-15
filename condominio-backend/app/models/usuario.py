"""
Modelos de Usuario.

Este archivo contiene los schemas Pydantic para la entidad Usuario.
Define cómo se estructuran los datos de usuarios en la API.

Roles disponibles:
- admin: Puede gestionar todo el sistema
- propietario: Dueño de un departamento, puede agregar arrendatarios
- arrendatario: Usuario asociado a un departamento
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class RolUsuario(str, Enum):
    """
    Roles disponibles en el sistema.
    
    Usar Enum asegura que solo se puedan asignar valores válidos.
    """
    ADMIN = "ADMIN"
    PROPIETARIO = "PROPIETARIO"
    ARRENDATARIO = "ARRENDATARIO"


class UsuarioBase(BaseModel):
    """
    Campos base del usuario.
    
    Estos campos son comunes para crear, actualizar y responder.
    """
    email: EmailStr = Field(
        ..., 
        description="Correo electrónico del usuario"
    )
    nombre: str = Field(
        ..., 
        min_length=2, 
        max_length=100,
        description="Nombre completo del usuario"
    )
    departamento_id: Optional[str] = Field(
    None,
    alias="departamentoId",
    description="ID del departamento asociado (null si es admin sin depto)"
    )
    rol: RolUsuario = Field(
        default=RolUsuario.ARRENDATARIO,
        description="Rol del usuario en el sistema"
    )
    es_admin: bool = Field(
    default=False,
    alias="esAdmin",
    description="Indica si tiene permisos de administrador"
    )


class UsuarioCreate(UsuarioBase):
    """
    Schema para crear un nuevo usuario.
    
    No incluye ID ni fechas porque el sistema los genera automáticamente.
    """
    pass


class UsuarioUpdate(BaseModel):
    """
    Schema para actualizar un usuario.
    
    Todos los campos son opcionales para permitir actualizaciones parciales.
    Solo se actualizan los campos que se envían.
    """
    nombre: Optional[str] = Field(
        None, 
        min_length=2, 
        max_length=100
    )
    departamento_id: Optional[str] = None
    rol: Optional[RolUsuario] = None
    es_admin: Optional[bool] = None


class UsuarioResponse(UsuarioBase):
    """
    Schema para respuestas de la API.
    
    Incluye el ID y las fechas de auditoría.
    """
    id: str = Field(..., description="ID único del usuario (UID de Firebase)")
    fecha_registro: Optional[datetime] = Field(
        None, 
        alias="fechaRegistro",
        description="Fecha de creación"
    )
    
    class Config:
        """Permite crear el modelo desde objetos de Firestore"""
        from_attributes = True
        populate_by_name = True


class UsuarioInDB(UsuarioResponse):
    """
    Schema que representa el usuario tal como está en la base de datos.
    
    Útil para operaciones internas donde necesitamos todos los campos.
    """
    pass
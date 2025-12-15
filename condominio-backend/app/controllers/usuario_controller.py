"""
Controlador de Usuarios.

Este controlador maneja los endpoints CRUD de usuarios
y la gestión de roles.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.middleware import get_current_user, get_admin_user
from app.services import UsuarioService
from app.models import (
    UsuarioCreate,
    UsuarioUpdate,
    UsuarioResponse
)

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)

# Instancia del servicio
usuario_service = UsuarioService()


@router.get("", response_model=List[UsuarioResponse])
async def listar_usuarios(
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Lista todos los usuarios.
    
    Solo administradores pueden ver todos los usuarios.
    
    Returns:
        Lista de usuarios
    """
    return usuario_service.obtener_todos()


@router.get("/departamento/{departamento_id}", response_model=List[UsuarioResponse])
async def listar_usuarios_por_departamento(
    departamento_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Lista los usuarios de un departamento.
    
    Admin puede ver cualquier departamento.
    Usuarios normales solo pueden ver su propio departamento.
    
    Args:
        departamento_id: ID del departamento
        
    Returns:
        Lista de usuarios del departamento
    """
    # Verificar permisos
    es_admin = current_user.get('es_admin', False)
    depto_usuario = current_user.get('departamento_id')
    
    if not es_admin and depto_usuario != departamento_id:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para ver usuarios de otros departamentos"
        )
    
    return usuario_service.obtener_por_departamento(departamento_id)


@router.get("/{usuario_id}", response_model=UsuarioResponse)
async def obtener_usuario(
    usuario_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Obtiene un usuario por su ID.
    
    Admin puede ver cualquier usuario.
    Usuarios normales solo pueden verse a sí mismos.
    
    Args:
        usuario_id: ID del usuario
        
    Returns:
        Datos del usuario
    """
    # Verificar permisos
    es_admin = current_user.get('es_admin', False)
    
    if not es_admin and current_user.get('id') != usuario_id:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para ver este usuario"
        )
    
    usuario = usuario_service.obtener_por_id(usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioResponse)
async def actualizar_usuario(
    usuario_id: str,
    data: UsuarioUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Actualiza un usuario.
    
    Admin puede actualizar cualquier usuario.
    Usuarios normales solo pueden actualizar su nombre.
    
    Args:
        usuario_id: ID del usuario
        data: Datos a actualizar
        
    Returns:
        Usuario actualizado
    """
    try:
        usuario = usuario_service.actualizar(usuario_id, data, current_user)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return usuario
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_usuario(
    usuario_id: str,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Elimina un usuario.
    
    Solo administradores pueden eliminar usuarios.
    
    Args:
        usuario_id: ID del usuario
    """
    try:
        if not usuario_service.eliminar(usuario_id, current_user):
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{usuario_id}/rol")
async def cambiar_rol_usuario(
    usuario_id: str,
    rol: str,
    es_admin: bool = False,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Cambia el rol de un usuario.
    
    Solo administradores pueden cambiar roles.
    
    Args:
        usuario_id: ID del usuario
        rol: Nuevo rol ('admin', 'propietario', 'arrendatario')
        es_admin: Si tiene permisos de administrador
        
    Returns:
        Usuario actualizado
    """
    try:
        usuario = usuario_service.cambiar_rol(
            usuario_id,
            rol,
            es_admin,
            current_user
        )
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return usuario
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
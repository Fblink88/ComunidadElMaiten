"""
Controlador de Departamentos.

Este controlador maneja los endpoints CRUD de departamentos
y la gestión de usuarios asociados.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.middleware import get_current_user, get_admin_user
from app.services import DepartamentoService
from app.models import (
    DepartamentoCreate,
    DepartamentoUpdate,
    DepartamentoResponse
)

router = APIRouter(
    prefix="/departamentos",
    tags=["Departamentos"]
)

# Instancia del servicio
departamento_service = DepartamentoService()


@router.post(
    "",
    response_model=DepartamentoResponse,
    status_code=status.HTTP_201_CREATED
)
async def crear_departamento(
    data: DepartamentoCreate,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Crea un nuevo departamento.
    
    Solo administradores pueden crear departamentos.
    
    Args:
        data: Datos del departamento a crear
        
    Returns:
        Departamento creado
    """
    try:
        return departamento_service.crear(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[DepartamentoResponse])
async def listar_departamentos(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Lista todos los departamentos.
    
    Cualquier usuario autenticado puede ver los departamentos.
    
    Returns:
        Lista de departamentos
    """
    return departamento_service.obtener_todos()


@router.get("/activos", response_model=List[DepartamentoResponse])
async def listar_departamentos_activos(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Lista los departamentos activos.
    
    Returns:
        Lista de departamentos con activo=True
    """
    return departamento_service.obtener_activos()


@router.get("/{departamento_id}", response_model=DepartamentoResponse)
async def obtener_departamento(
    departamento_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Obtiene un departamento por su ID.
    
    Args:
        departamento_id: ID del departamento
        
    Returns:
        Datos del departamento
    """
    depto = departamento_service.obtener_por_id(departamento_id)
    if not depto:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    return depto


@router.put("/{departamento_id}", response_model=DepartamentoResponse)
async def actualizar_departamento(
    departamento_id: str,
    data: DepartamentoUpdate,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Actualiza un departamento.
    
    Solo administradores pueden actualizar departamentos.
    
    Args:
        departamento_id: ID del departamento
        data: Datos a actualizar
        
    Returns:
        Departamento actualizado
    """
    try:
        depto = departamento_service.actualizar(departamento_id, data)
        if not depto:
            raise HTTPException(status_code=404, detail="Departamento no encontrado")
        return depto
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{departamento_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_departamento(
    departamento_id: str,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Elimina un departamento.
    
    Solo administradores pueden eliminar departamentos.
    No se puede eliminar si tiene usuarios asociados.
    
    Args:
        departamento_id: ID del departamento
    """
    try:
        if not departamento_service.eliminar(departamento_id):
            raise HTTPException(status_code=404, detail="Departamento no encontrado")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{departamento_id}/usuarios/{usuario_id}")
async def agregar_usuario_a_departamento(
    departamento_id: str,
    usuario_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Agrega un usuario a un departamento.
    
    Admin puede agregar a cualquier departamento.
    Propietario solo puede agregar a su propio departamento.
    Máximo 5 usuarios por departamento.
    
    Args:
        departamento_id: ID del departamento
        usuario_id: ID del usuario a agregar
        
    Returns:
        Mensaje de confirmación
    """
    try:
        success = departamento_service.agregar_usuario(
            departamento_id,
            usuario_id,
            current_user
        )
        if success:
            return {"message": "Usuario agregado al departamento"}
        raise HTTPException(status_code=400, detail="No se pudo agregar el usuario")
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{departamento_id}/usuarios/{usuario_id}")
async def remover_usuario_de_departamento(
    departamento_id: str,
    usuario_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Remueve un usuario de un departamento.
    
    Admin puede remover de cualquier departamento.
    Propietario solo puede remover de su propio departamento.
    
    Args:
        departamento_id: ID del departamento
        usuario_id: ID del usuario a remover
        
    Returns:
        Mensaje de confirmación
    """
    try:
        success = departamento_service.remover_usuario(
            departamento_id,
            usuario_id,
            current_user
        )
        if success:
            return {"message": "Usuario removido del departamento"}
        raise HTTPException(status_code=400, detail="No se pudo remover el usuario")
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
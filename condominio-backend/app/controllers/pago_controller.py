"""
Controlador de Pagos.

Este controlador maneja los endpoints de pagos de gastos comunes,
incluyendo la integración con Khipu.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from app.middleware import get_current_user, get_admin_user
from app.services import PagoService
from app.services.khipu_service import khipu_service
from app.models import (
    PagoCreate,
    PagoResponse
)
from app.config import settings

router = APIRouter(
    prefix="/pagos",
    tags=["Pagos"]
)

# Instancia del servicio
pago_service = PagoService()


@router.post(
    "",
    response_model=PagoResponse,
    status_code=status.HTTP_201_CREATED
)
async def crear_pago(
    data: PagoCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Crea un nuevo pago.
    
    El usuario solo puede crear pagos para su departamento.
    Admin puede crear pagos para cualquier departamento.
    
    Args:
        data: Datos del pago a crear
        
    Returns:
        Pago creado con estado 'pendiente'
    """
    try:
        return await pago_service.crear(data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[PagoResponse])
async def listar_pagos(
    limit: int = 1000,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Lista todos los pagos (solo admin).
    """
    return await pago_service.obtener_todos(limit=limit)

@router.get("/transacciones", response_model=List[Dict[str, Any]])
async def listar_todas_transacciones(
    limit: int = 500,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Lista todos los abonos/transacciones reales (solo admin).
    """
    return await pago_service.obtener_todas_transacciones(limit=limit)

@router.get("/transacciones/departamento/{departamento_id}", response_model=List[Dict[str, Any]])
async def listar_transacciones_departamento(
    departamento_id: str,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Lista todos los movimientos/transacciones de la billetera de un departamento específico (solo admin).
    """
    return await pago_service.obtener_transacciones_por_departamento(departamento_id, current_user)

@router.get("/mis-pagos", response_model=List[PagoResponse])
async def obtener_mis_pagos(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Obtiene los pagos del departamento del usuario actual.
    
    Returns:
        Lista de pagos del departamento
    """
    departamento_id = current_user.get('departamento_id')
    
    if not departamento_id:
        raise HTTPException(
            status_code=400,
            detail="No tienes un departamento asociado"
        )
    
    return await pago_service.obtener_por_departamento(departamento_id, current_user)

@router.get("/mis-transacciones", response_model=List[Dict[str, Any]])
async def obtener_mis_transacciones(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Obtiene el historial de abonos (billetera virtual) del departamento.
    """
    departamento_id = current_user.get('departamento_id')
    
    if not departamento_id:
        raise HTTPException(
            status_code=400,
            detail="No tienes un departamento asociado"
        )
    
    return await pago_service.obtener_transacciones_por_departamento(departamento_id, current_user)


@router.get("/pendientes", response_model=List[PagoResponse])
async def obtener_pagos_pendientes(
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Obtiene todos los pagos pendientes.
    
    Solo administradores.
    
    Returns:
        Lista de pagos pendientes
    """
    return await pago_service.obtener_pendientes()


@router.get("/periodo/{periodo}", response_model=List[PagoResponse])
async def obtener_pagos_por_periodo(
    periodo: str,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Obtiene los pagos de un periodo específico.
    
    Solo administradores.
    
    Args:
        periodo: Periodo en formato 'YYYY-MM'
        
    Returns:
        Lista de pagos del periodo
    """
    return await pago_service.obtener_por_periodo(periodo)


@router.get("/departamento/{departamento_id}", response_model=List[PagoResponse])
async def obtener_pagos_por_departamento(
    departamento_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Obtiene los pagos de un departamento.
    
    Admin puede ver cualquier departamento.
    Usuarios solo pueden ver su propio departamento.
    
    Args:
        departamento_id: ID del departamento
        
    Returns:
        Lista de pagos del departamento
    """
    try:
        return await pago_service.obtener_por_departamento(departamento_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{pago_id}", response_model=PagoResponse)
async def obtener_pago(
    pago_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Obtiene un pago por su ID.
    
    Args:
        pago_id: ID del pago
        
    Returns:
        Datos del pago
    """
    pago = await pago_service.obtener_por_id(pago_id)
    
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    # Verificar permisos
    es_admin = current_user.get('es_admin', False)
    depto_usuario = current_user.get('departamento_id')
    
    if not es_admin and pago.get('departamento_id') != depto_usuario:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para ver este pago"
        )
    
    return pago


@router.post("/{pago_id}/verificar")
async def verificar_pago_manual(
    pago_id: str,
    aprobado: bool,
    notas: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Verifica un pago manual (transferencia).
    
    Solo administradores.
    
    Args:
        pago_id: ID del pago
        aprobado: Si el pago fue aprobado
        notas: Notas adicionales
        
    Returns:
        Pago actualizado
    """
    try:
        pago = await pago_service.verificar_pago_manual(
            pago_id,
            aprobado,
            notas,
            current_user
        )
        if not pago:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        return pago
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
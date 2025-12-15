"""
Controlador de Pagos.

Este controlador maneja los endpoints de pagos de gastos comunes,
incluyendo la integración con Flow.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from app.middleware import get_current_user, get_admin_user
from app.services import PagoService
from app.models import (
    PagoCreate,
    PagoResponse
)

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
        return pago_service.crear(data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


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
    
    return pago_service.obtener_por_departamento(departamento_id, current_user)


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
    return pago_service.obtener_pendientes()


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
    return pago_service.obtener_por_periodo(periodo)


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
        return pago_service.obtener_por_departamento(departamento_id, current_user)
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
    pago = pago_service.obtener_por_id(pago_id)
    
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
        pago = pago_service.verificar_pago_manual(
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


@router.post("/webhook/flow")
async def webhook_flow(payload: Dict[str, Any]):
    """
    Webhook para recibir notificaciones de Flow.
    
    Flow llama a este endpoint cuando el estado de un pago cambia.
    
    Args:
        payload: Datos enviados por Flow
        
    Returns:
        Confirmación de recepción
    """
    # TODO: Implementar verificación de firma de Flow
    # TODO: Implementar lógica de actualización de pago
    
    pago_id = payload.get('commerceOrder')
    flow_payment_id = payload.get('flowOrder')
    estado = payload.get('status')
    
    if pago_id and flow_payment_id:
        pago_service.actualizar_desde_flow(pago_id, flow_payment_id, estado)
    
    return {"received": True}
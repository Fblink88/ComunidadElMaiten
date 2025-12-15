"""
Controlador de Gastos.

Este controlador maneja los endpoints de gastos mensuales
y gastos extraordinarios del condominio.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.middleware import get_current_user, get_admin_user
from app.services import GastoService
from app.models import (
    GastoMensualCreate,
    GastoMensualResponse,
    GastoExtraordinarioCreate,
    GastoExtraordinarioResponse
)

router = APIRouter(
    prefix="/gastos",
    tags=["Gastos"]
)

# Instancia del servicio
gasto_service = GastoService()


# ============================================
# GASTOS MENSUALES
# ============================================

@router.post(
    "/mensuales",
    response_model=GastoMensualResponse,
    status_code=status.HTTP_201_CREATED
)
async def crear_gasto_mensual(
    data: GastoMensualCreate,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Crea un nuevo gasto mensual.
    
    Solo administradores.
    Automáticamente genera los pagos pendientes para cada departamento.
    
    Args:
        data: Datos del gasto mensual
        
    Returns:
        Gasto mensual creado
    """
    try:
        return gasto_service.crear_gasto_mensual(data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/mensuales", response_model=List[GastoMensualResponse])
async def listar_gastos_mensuales(
    cantidad: int = 12,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Lista los últimos gastos mensuales.
    
    Args:
        cantidad: Número de periodos a obtener (default 12)
        
    Returns:
        Lista de gastos mensuales
    """
    return gasto_service.obtener_ultimos_gastos(cantidad)


@router.get("/mensuales/{periodo}", response_model=GastoMensualResponse)
async def obtener_gasto_mensual(
    periodo: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Obtiene el gasto mensual de un periodo.
    
    Args:
        periodo: Periodo en formato 'YYYY-MM'
        
    Returns:
        Datos del gasto mensual
    """
    gasto = gasto_service.obtener_gasto_mensual(periodo)
    
    if not gasto:
        raise HTTPException(
            status_code=404,
            detail=f"No existe gasto para el periodo {periodo}"
        )
    
    return gasto


# ============================================
# GASTOS EXTRAORDINARIOS
# ============================================

@router.post(
    "/extraordinarios",
    response_model=GastoExtraordinarioResponse,
    status_code=status.HTTP_201_CREATED
)
async def crear_gasto_extraordinario(
    data: GastoExtraordinarioCreate,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Crea un nuevo gasto extraordinario.
    
    Solo administradores.
    
    Args:
        data: Datos del gasto extraordinario
        
    Returns:
        Gasto extraordinario creado
    """
    try:
        return gasto_service.crear_gasto_extraordinario(data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/extraordinarios", response_model=List[GastoExtraordinarioResponse])
async def listar_gastos_extraordinarios(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Lista todos los gastos extraordinarios.
    
    Returns:
        Lista de gastos extraordinarios
    """
    return gasto_service.obtener_gastos_extraordinarios()


@router.get("/extraordinarios/{gasto_id}", response_model=GastoExtraordinarioResponse)
async def obtener_gasto_extraordinario(
    gasto_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Obtiene un gasto extraordinario por su ID.
    
    Args:
        gasto_id: ID del gasto
        
    Returns:
        Datos del gasto extraordinario
    """
    gasto = gasto_service.obtener_gasto_extraordinario(gasto_id)
    
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto extraordinario no encontrado")
    
    return gasto


@router.post("/extraordinarios/{gasto_id}/pagar/{departamento_id}")
async def marcar_pago_extraordinario(
    gasto_id: str,
    departamento_id: str,
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Marca el pago de un gasto extraordinario para un departamento.
    
    Solo administradores.
    
    Args:
        gasto_id: ID del gasto extraordinario
        departamento_id: ID del departamento que pagó
        
    Returns:
        Confirmación del pago
    """
    try:
        success = gasto_service.marcar_pago_extraordinario(
            gasto_id,
            departamento_id,
            current_user
        )
        if success:
            return {"message": "Pago extraordinario registrado"}
        raise HTTPException(status_code=400, detail="No se pudo registrar el pago")
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
"""
Controlador del Dashboard.

Este controlador maneja los endpoints para el dashboard financiero
del administrador.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.middleware import get_admin_user
from app.services.dashboard_service import dashboard_service

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/resumen-financiero")
async def obtener_resumen_financiero(
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Obtiene el resumen financiero global (La 'Caja').
    
    Solo administradores.
    
    Returns:
        Diccionario con:
        - total_recaudado: Suma total de pagos recibidos
        - total_gastos: Suma total de gastos generados
        - balance_actual: Disponibilidad actual (recaudado - gastado)
        - morosidad_total: Total de deuda pendiente
    """
    try:
        return dashboard_service.obtener_resumen_global()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

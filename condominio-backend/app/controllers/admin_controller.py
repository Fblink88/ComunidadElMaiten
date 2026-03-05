from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.middleware import get_admin_user
from app.services.seed_data_service import seed_data_service

router = APIRouter(
    prefix="/admin",
    tags=["Administración"]
)

@router.post("/seed-data")
async def seed_data(
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Genera datos de prueba (Departamentos, Usuarios, Pagos).
    Solo administradores.
    """
    try:
        result = await seed_data_service.seed_data()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generando datos: {str(e)}"
        )

@router.post("/clear-data")
async def clear_data(
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Elimina datos de prueba (Mantiene usuarios admin).
    Solo administradores.
    """
    try:
        result = await seed_data_service.clear_data()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error limpiando datos: {str(e)}"
        )

"""
Controlador de Autenticación.

Este controlador maneja los endpoints relacionados con
la autenticación y verificación de usuarios.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.middleware import get_current_user
from app.models import UsuarioResponse

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)


@router.get("/me", response_model=UsuarioResponse)
async def obtener_usuario_actual(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Obtiene los datos del usuario autenticado.
    
    Este endpoint permite al frontend obtener la información
    completa del usuario después de iniciar sesión.
    
    Returns:
        Datos del usuario autenticado
    """
    return current_user


@router.get("/verificar")
async def verificar_token(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Verifica si el token es válido.
    
    Útil para que el frontend verifique si la sesión sigue activa.
    
    Returns:
        Mensaje de confirmación y rol del usuario
    """
    return {
        "valid": True,
        "user_id": current_user.get('id'),
        "es_admin": current_user.get('es_admin', False),
        "rol": current_user.get('rol')
    }
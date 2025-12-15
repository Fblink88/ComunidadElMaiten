"""
Middleware de Autenticación.

Este middleware verifica los tokens de Firebase Auth en cada request
y extrae la información del usuario autenticado.
"""

from typing import Dict, Any
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services import AuthService

# Esquema de seguridad para extraer el token Bearer
security = HTTPBearer()

# Instancia del servicio de autenticación
auth_service = AuthService()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Dependency que obtiene el usuario actual desde el token.
    
    Extrae el token Bearer del header Authorization,
    lo verifica con Firebase Auth y retorna los datos del usuario.
    
    Args:
        credentials: Credenciales HTTP con el token Bearer
        
    Returns:
        Diccionario con los datos del usuario autenticado
        
    Raises:
        HTTPException 401: Si el token es inválido o expirado
        HTTPException 404: Si el usuario no existe en Firestore
    """
    token = credentials.credentials
    
    # Verificar token con Firebase
    usuario = auth_service.obtener_usuario_por_token(token)
    
    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return usuario


async def get_admin_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency que verifica que el usuario sea administrador.
    
    Usa get_current_user primero para obtener el usuario,
    luego verifica que tenga permisos de admin.
    
    Args:
        current_user: Usuario actual obtenido de get_current_user
        
    Returns:
        Diccionario con los datos del usuario administrador
        
    Raises:
        HTTPException 403: Si el usuario no es administrador
    """
    if not current_user.get('es_admin', False):
        raise HTTPException(
            status_code=403,
            detail="Se requieren permisos de administrador"
        )
    
    return current_user
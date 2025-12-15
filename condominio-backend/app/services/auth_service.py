"""
Servicio de Autenticación.

Este servicio maneja la verificación de tokens de Firebase Auth
y la obtención de información del usuario autenticado.
"""

from typing import Optional, Dict, Any
from firebase_admin import auth
from firebase_admin.exceptions import FirebaseError
from app.repositories import UsuarioRepository


class AuthService:
    """
    Servicio para operaciones de autenticación.
    
    Verifica tokens JWT de Firebase y obtiene datos del usuario.
    """
    
    def __init__(self):
        """Inicializa el servicio con el repositorio de usuarios."""
        self.usuario_repo = UsuarioRepository()
    
    def verificar_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verifica un token de Firebase Auth.
        
        Args:
            token: Token JWT de Firebase Auth
            
        Returns:
            Diccionario con los datos del token decodificado o None si es inválido
        """
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except FirebaseError:
            return None
        except Exception:
            return None
    
    def obtener_usuario_por_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene el usuario completo a partir de un token.
        
        Primero verifica el token, luego busca el usuario en Firestore.
        
        Args:
            token: Token JWT de Firebase Auth
            
        Returns:
            Diccionario con los datos del usuario o None
        """
        decoded = self.verificar_token(token)
        if not decoded:
            return None
        
        uid = decoded.get('uid')
        if not uid:
            return None
        
        return self.usuario_repo.get_by_id(uid)
    
    def es_admin(self, usuario: Dict[str, Any]) -> bool:
        """
        Verifica si un usuario es administrador.
        
        Args:
            usuario: Diccionario con los datos del usuario
            
        Returns:
            True si el usuario es admin
        """
        return usuario.get('es_admin', False)
    
    def es_propietario(self, usuario: Dict[str, Any]) -> bool:
        """
        Verifica si un usuario es propietario.
        
        Args:
            usuario: Diccionario con los datos del usuario
            
        Returns:
            True si el usuario es propietario
        """
        return usuario.get('rol') == 'propietario'
    
    def puede_gestionar_departamento(
        self, 
        usuario: Dict[str, Any], 
        departamento_id: str
    ) -> bool:
        """
        Verifica si un usuario puede gestionar un departamento.
        
        Un usuario puede gestionar un departamento si:
        - Es administrador, o
        - Es propietario de ese departamento
        
        Args:
            usuario: Diccionario con los datos del usuario
            departamento_id: ID del departamento
            
        Returns:
            True si puede gestionar el departamento
        """
        if self.es_admin(usuario):
            return True
        
        if self.es_propietario(usuario):
            return usuario.get('departamento_id') == departamento_id
        
        return False
"""
Repositorio de Usuarios.

Este repositorio maneja todas las operaciones de base de datos
relacionadas con los usuarios del sistema.
"""

from typing import Optional, List, Dict, Any
from .base_repository import BaseRepository


class UsuarioRepository(BaseRepository):
    """
    Repositorio para la colección 'usuarios' en Firestore.
    
    Los usuarios se crean con el UID de Firebase Auth como ID del documento,
    lo que facilita la relación entre autenticación y datos del usuario.
    """
    
    def __init__(self):
        """Inicializa el repositorio con la colección 'usuarios'."""
        super().__init__('usuarios')
    
    async def create_with_uid(self, uid: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crea un usuario usando el UID de Firebase Auth como ID.
        
        Args:
            uid: UID del usuario en Firebase Auth
            data: Datos del usuario a crear
            
        Returns:
            Diccionario con los datos creados incluyendo el ID
        """
        return await self.create(data, doc_id=uid)
    
    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Busca un usuario por su email.
        
        Args:
            email: Correo electrónico del usuario
            
        Returns:
            Diccionario con los datos del usuario o None
        """
        results = await self.find_by_field('email', email, limit=1)
        return results[0] if results else None
    
    async def get_by_departamento(self, departamento_id: str) -> List[Dict[str, Any]]:
        """
        Obtiene todos los usuarios de un departamento.
        
        Args:
            departamento_id: ID del departamento
            
        Returns:
            Lista de usuarios asociados al departamento
        """
        return await self.find_by_field('departamento_id', departamento_id)
    
    async def get_admins(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los usuarios administradores.
        
        Returns:
            Lista de usuarios con es_admin=True
        """
        return await self.find_by_field('es_admin', True)
    
    async def get_propietarios(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los propietarios.
        
        Returns:
            Lista de usuarios con rol='propietario'
        """
        return await self.find_by_field('rol', 'propietario')
    
    async def es_propietario_de(self, usuario_id: str, departamento_id: str) -> bool:
        """
        Verifica si un usuario es propietario de un departamento.
        
        Args:
            usuario_id: ID del usuario a verificar
            departamento_id: ID del departamento
            
        Returns:
            True si el usuario es propietario del departamento
        """
        usuario = await self.get_by_id(usuario_id)
        if not usuario:
            return False
        
        return (
            usuario.get('departamento_id') == departamento_id and
            usuario.get('rol') == 'propietario'
        )
    
    async def actualizar_rol(self, usuario_id: str, rol: str, es_admin: bool = False) -> bool:
        """
        Actualiza el rol de un usuario.
        
        Args:
            usuario_id: ID del usuario
            rol: Nuevo rol ('admin', 'propietario', 'arrendatario')
            es_admin: Si tiene permisos de administrador
            
        Returns:
            True si se actualizó correctamente
        """
        result = await self.update(usuario_id, {
            'rol': rol,
            'es_admin': es_admin
        })
        return result is not None
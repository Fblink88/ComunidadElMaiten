"""
Servicio de Usuarios.

Este servicio contiene la lógica de negocio relacionada con
los usuarios del sistema.
"""

from typing import Optional, List, Dict, Any
from app.repositories import UsuarioRepository, DepartamentoRepository
from app.models import UsuarioCreate, UsuarioUpdate


class UsuarioService:
    """
    Servicio para operaciones de usuarios.
    
    Maneja la lógica de negocio como validaciones de roles,
    permisos y relación con departamentos.
    """
    
    def __init__(self):
        """Inicializa el servicio con los repositorios necesarios."""
        self.usuario_repo = UsuarioRepository()
        self.depto_repo = DepartamentoRepository()
    
    def crear(self, uid: str, data: UsuarioCreate) -> Dict[str, Any]:
        """
        Crea un nuevo usuario.
        
        Args:
            uid: UID de Firebase Auth
            data: Datos del usuario a crear
            
        Returns:
            Diccionario con el usuario creado
            
        Raises:
            ValueError: Si el email ya está registrado
        """
        # Verificar que no exista otro con el mismo email
        existente = self.usuario_repo.get_by_email(data.email)
        if existente:
            raise ValueError(f"Ya existe un usuario con email {data.email}")
        
        # Preparar datos
        usuario_data = data.model_dump()
        
        return self.usuario_repo.create_with_uid(uid, usuario_data)
    
    def obtener_por_id(self, usuario_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un usuario por su ID.
        
        Args:
            usuario_id: ID del usuario (UID de Firebase)
            
        Returns:
            Diccionario con el usuario o None
        """
        return self.usuario_repo.get_by_id(usuario_id)
    
    def obtener_por_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un usuario por su email.
        
        Args:
            email: Email del usuario
            
        Returns:
            Diccionario con el usuario o None
        """
        return self.usuario_repo.get_by_email(email)
    
    def obtener_todos(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los usuarios.
        
        Returns:
            Lista de todos los usuarios
        """
        return self.usuario_repo.get_all()
    
    def obtener_por_departamento(self, departamento_id: str) -> List[Dict[str, Any]]:
        """
        Obtiene los usuarios de un departamento.
        
        Args:
            departamento_id: ID del departamento
            
        Returns:
            Lista de usuarios del departamento
        """
        return self.usuario_repo.get_by_departamento(departamento_id)
    
    def actualizar(
        self, 
        usuario_id: str, 
        data: UsuarioUpdate,
        usuario_solicitante: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Actualiza un usuario.
        
        Args:
            usuario_id: ID del usuario a actualizar
            data: Datos a actualizar
            usuario_solicitante: Usuario que realiza la operación
            
        Returns:
            Diccionario con el usuario actualizado o None
            
        Raises:
            PermissionError: Si no tiene permisos
        """
        # Solo admin puede cambiar roles y es_admin
        es_admin = usuario_solicitante.get('es_admin', False)
        
        if not es_admin:
            # Usuario normal solo puede actualizar su propio nombre
            if usuario_id != usuario_solicitante.get('id'):
                raise PermissionError("No tienes permisos para actualizar este usuario")
            
            # No puede cambiar su rol ni es_admin
            if data.rol is not None or data.es_admin is not None:
                raise PermissionError("No tienes permisos para cambiar roles")
        
        # Filtrar solo campos con valor
        update_data = data.model_dump(exclude_unset=True)
        
        return self.usuario_repo.update(usuario_id, update_data)
    
    def eliminar(
        self, 
        usuario_id: str,
        usuario_solicitante: Dict[str, Any]
    ) -> bool:
        """
        Elimina un usuario.
        
        Args:
            usuario_id: ID del usuario a eliminar
            usuario_solicitante: Usuario que realiza la operación
            
        Returns:
            True si se eliminó correctamente
            
        Raises:
            PermissionError: Si no tiene permisos
            ValueError: Si intenta eliminarse a sí mismo
        """
        # Solo admin puede eliminar usuarios
        if not usuario_solicitante.get('es_admin', False):
            raise PermissionError("Solo administradores pueden eliminar usuarios")
        
        # No puede eliminarse a sí mismo
        if usuario_id == usuario_solicitante.get('id'):
            raise ValueError("No puedes eliminarte a ti mismo")
        
        # Si está asociado a un departamento, removerlo primero
        usuario = self.usuario_repo.get_by_id(usuario_id)
        if usuario and usuario.get('departamento_id'):
            self.depto_repo.remover_usuario(usuario['departamento_id'], usuario_id)
        
        return self.usuario_repo.delete(usuario_id)
    
    def cambiar_rol(
        self,
        usuario_id: str,
        nuevo_rol: str,
        es_admin: bool,
        usuario_solicitante: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Cambia el rol de un usuario.
        
        Args:
            usuario_id: ID del usuario
            nuevo_rol: Nuevo rol ('admin', 'propietario', 'arrendatario')
            es_admin: Si tiene permisos de administrador
            usuario_solicitante: Usuario que realiza la operación
            
        Returns:
            Diccionario con el usuario actualizado
            
        Raises:
            PermissionError: Si no es admin
        """
        if not usuario_solicitante.get('es_admin', False):
            raise PermissionError("Solo administradores pueden cambiar roles")
        
        return self.usuario_repo.update(usuario_id, {
            'rol': nuevo_rol,
            'es_admin': es_admin
        })
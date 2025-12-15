"""
Repositorio de Departamentos.

Este repositorio maneja todas las operaciones de base de datos
relacionadas con los departamentos del condominio.
"""

from typing import Optional, List, Dict, Any
from .base_repository import BaseRepository


class DepartamentoRepository(BaseRepository):
    """
    Repositorio para la colección 'departamentos' en Firestore.
    
    Hereda las operaciones CRUD básicas de BaseRepository
    y agrega métodos específicos para departamentos.
    """
    
    def __init__(self):
        """Inicializa el repositorio con la colección 'departamentos'."""
        super().__init__('departamentos')
    
    def get_by_numero(self, numero: str) -> Optional[Dict[str, Any]]:
        """
        Busca un departamento por su número.
        
        Args:
            numero: Número del departamento (ej: '11', '21')
            
        Returns:
            Diccionario con los datos del departamento o None
        """
        results = self.find_by_field('numero', numero, limit=1)
        return results[0] if results else None
    
    def get_activos(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los departamentos activos.
        
        Returns:
            Lista de departamentos con activo=True
        """
        return self.find_by_field('activo', True)
    
    def get_usuarios_count(self, departamento_id: str) -> int:
        """
        Cuenta los usuarios asociados a un departamento.
        
        Args:
            departamento_id: ID del departamento
            
        Returns:
            Número de usuarios asociados
        """
        depto = self.get_by_id(departamento_id)
        if not depto:
            return 0
        return len(depto.get('usuarios_ids', []))
    
    def agregar_usuario(self, departamento_id: str, usuario_id: str) -> bool:
        """
        Agrega un usuario al departamento.
        
        Valida que no se exceda el límite de 5 usuarios.
        
        Args:
            departamento_id: ID del departamento
            usuario_id: ID del usuario a agregar
            
        Returns:
            True si se agregó exitosamente, False si falló
        """
        from google.cloud.firestore_v1 import ArrayUnion
        
        depto = self.get_by_id(departamento_id)
        if not depto:
            return False
        
        usuarios_actuales = depto.get('usuarios_ids', [])
        
        # Validar límite de 5 usuarios
        if len(usuarios_actuales) >= 5:
            return False
        
        # Validar que no esté ya agregado
        if usuario_id in usuarios_actuales:
            return False
        
        # Agregar usuario
        self.collection.document(departamento_id).update({
            'usuarios_ids': ArrayUnion([usuario_id])
        })
        
        return True
    
    def remover_usuario(self, departamento_id: str, usuario_id: str) -> bool:
        """
        Remueve un usuario del departamento.
        
        Args:
            departamento_id: ID del departamento
            usuario_id: ID del usuario a remover
            
        Returns:
            True si se removió exitosamente, False si falló
        """
        from google.cloud.firestore_v1 import ArrayRemove
        
        depto = self.get_by_id(departamento_id)
        if not depto:
            return False
        
        usuarios_actuales = depto.get('usuarios_ids', [])
        
        # Validar que el usuario esté en el departamento
        if usuario_id not in usuarios_actuales:
            return False
        
        # Remover usuario
        self.collection.document(departamento_id).update({
            'usuarios_ids': ArrayRemove([usuario_id])
        })
        
        return True
    
    def get_total_metros_cuadrados(self) -> float:
        """
        Calcula el total de metros cuadrados del condominio.
        
        Útil para calcular el valor por m² de los gastos comunes.
        
        Returns:
            Suma de metros cuadrados de todos los departamentos activos
        """
        departamentos = self.get_activos()
        return sum(d.get('metros_cuadrados', 0) for d in departamentos)
"""
Servicio de Departamentos.

Este servicio contiene la lógica de negocio relacionada con
los departamentos del condominio.
"""

from typing import Optional, List, Dict, Any
from app.repositories import DepartamentoRepository, UsuarioRepository
from app.models import DepartamentoCreate, DepartamentoUpdate


class DepartamentoService:
    """
    Servicio para operaciones de departamentos.
    
    Maneja la lógica de negocio como validaciones,
    cálculos de cuotas y gestión de usuarios asociados.
    """
    
    def __init__(self):
        """Inicializa el servicio con los repositorios necesarios."""
        self.depto_repo = DepartamentoRepository()
        self.usuario_repo = UsuarioRepository()
    
    def crear(self, data: DepartamentoCreate) -> Dict[str, Any]:
        """
        Crea un nuevo departamento.
        
        Args:
            data: Datos del departamento a crear
            
        Returns:
            Diccionario con el departamento creado
            
        Raises:
            ValueError: Si el número de departamento ya existe
        """
        # Verificar que no exista otro con el mismo número
        existente = self.depto_repo.get_by_numero(data.numero)
        if existente:
            raise ValueError(f"Ya existe un departamento con número {data.numero}")
        
        # Preparar datos
        depto_data = data.model_dump()
        depto_data['usuarios_ids'] = []
        
        return self.depto_repo.create(depto_data)
    
    def obtener_por_id(self, departamento_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un departamento por su ID.
        
        Args:
            departamento_id: ID del departamento
            
        Returns:
            Diccionario con el departamento o None
        """
        return self.depto_repo.get_by_id(departamento_id)
    
    def obtener_todos(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los departamentos.
        
        Returns:
            Lista de todos los departamentos
        """
        return self.depto_repo.get_all()
    
    def obtener_activos(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los departamentos activos.
        
        Returns:
            Lista de departamentos activos
        """
        return self.depto_repo.get_activos()
    
    def actualizar(
        self, 
        departamento_id: str, 
        data: DepartamentoUpdate
    ) -> Optional[Dict[str, Any]]:
        """
        Actualiza un departamento.
        
        Args:
            departamento_id: ID del departamento
            data: Datos a actualizar
            
        Returns:
            Diccionario con el departamento actualizado o None
            
        Raises:
            ValueError: Si se intenta cambiar a un número que ya existe
        """
        # Si se está actualizando el número, verificar que no exista
        if data.numero:
            existente = self.depto_repo.get_by_numero(data.numero)
            if existente and existente['id'] != departamento_id:
                raise ValueError(f"Ya existe un departamento con número {data.numero}")
        
        # Filtrar solo campos con valor
        update_data = data.model_dump(exclude_unset=True)
        
        return self.depto_repo.update(departamento_id, update_data)
    
    def eliminar(self, departamento_id: str) -> bool:
        """
        Elimina un departamento.
        
        Args:
            departamento_id: ID del departamento
            
        Returns:
            True si se eliminó correctamente
            
        Raises:
            ValueError: Si el departamento tiene usuarios asociados
        """
        # Verificar que no tenga usuarios asociados
        usuarios = self.usuario_repo.get_by_departamento(departamento_id)
        if usuarios:
            raise ValueError("No se puede eliminar un departamento con usuarios asociados")
        
        return self.depto_repo.delete(departamento_id)
    
    def agregar_usuario(
        self, 
        departamento_id: str, 
        usuario_id: str,
        usuario_solicitante: Dict[str, Any]
    ) -> bool:
        """
        Agrega un usuario a un departamento.
        
        Args:
            departamento_id: ID del departamento
            usuario_id: ID del usuario a agregar
            usuario_solicitante: Usuario que realiza la operación
            
        Returns:
            True si se agregó correctamente
            
        Raises:
            PermissionError: Si no tiene permisos
            ValueError: Si se excede el límite de usuarios
        """
        # Verificar permisos
        es_admin = usuario_solicitante.get('es_admin', False)
        es_propietario_depto = (
            usuario_solicitante.get('rol') == 'propietario' and
            usuario_solicitante.get('departamento_id') == departamento_id
        )
        
        if not es_admin and not es_propietario_depto:
            raise PermissionError("No tienes permisos para agregar usuarios a este departamento")
        
        # Verificar límite de 5 usuarios
        count = self.depto_repo.get_usuarios_count(departamento_id)
        if count >= 5:
            raise ValueError("El departamento ya tiene el máximo de 5 usuarios")
        
        # Agregar usuario
        success = self.depto_repo.agregar_usuario(departamento_id, usuario_id)
        
        if success:
            # Actualizar el departamento_id del usuario
            self.usuario_repo.update(usuario_id, {'departamento_id': departamento_id})
        
        return success
    
    def remover_usuario(
        self, 
        departamento_id: str, 
        usuario_id: str,
        usuario_solicitante: Dict[str, Any]
    ) -> bool:
        """
        Remueve un usuario de un departamento.
        
        Args:
            departamento_id: ID del departamento
            usuario_id: ID del usuario a remover
            usuario_solicitante: Usuario que realiza la operación
            
        Returns:
            True si se removió correctamente
            
        Raises:
            PermissionError: Si no tiene permisos
        """
        # Verificar permisos
        es_admin = usuario_solicitante.get('es_admin', False)
        es_propietario_depto = (
            usuario_solicitante.get('rol') == 'propietario' and
            usuario_solicitante.get('departamento_id') == departamento_id
        )
        
        if not es_admin and not es_propietario_depto:
            raise PermissionError("No tienes permisos para remover usuarios de este departamento")
        
        # No permitir que un propietario se remueva a sí mismo
        if usuario_id == usuario_solicitante.get('id'):
            raise ValueError("No puedes removerte a ti mismo del departamento")
        
        # Remover usuario
        success = self.depto_repo.remover_usuario(departamento_id, usuario_id)
        
        if success:
            # Limpiar el departamento_id del usuario
            self.usuario_repo.update(usuario_id, {'departamento_id': None})
        
        return success
    
    def calcular_cuotas(self, total_gastos: int) -> Dict[str, int]:
        """
        Calcula la cuota de cada departamento basado en metros cuadrados.
        
        Args:
            total_gastos: Monto total de gastos del mes en CLP
            
        Returns:
            Diccionario {departamento_id: cuota_mensual}
        """
        departamentos = self.obtener_activos()
        total_m2 = sum(d.get('metros_cuadrados', 0) for d in departamentos)
        
        if total_m2 == 0:
            return {}
        
        valor_por_m2 = total_gastos / total_m2
        
        cuotas = {}
        for depto in departamentos:
            m2 = depto.get('metros_cuadrados', 0)
            cuota = round(m2 * valor_por_m2)
            cuotas[depto['id']] = cuota
        
        return cuotas
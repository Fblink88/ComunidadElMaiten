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
    
    async def crear(self, data: DepartamentoCreate) -> Dict[str, Any]:
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
        existente = await self.depto_repo.get_by_numero(data.numero)
        if existente:
            raise ValueError(f"Ya existe un departamento con número {data.numero}")
        
        # Preparar datos
        depto_data = data.model_dump()
        depto_data['usuarios_ids'] = []
        
        return await self.depto_repo.create(depto_data)
    
    async def obtener_por_id(self, departamento_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un departamento por su ID.
        
        Args:
            departamento_id: ID del departamento
            
        Returns:
            Diccionario con el departamento o None
        """
        return await self.depto_repo.get_by_id(departamento_id)
    
    async def obtener_todos(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los departamentos.
        
        Returns:
            Lista de todos los departamentos
        """
        return await self.depto_repo.get_all()
    
    async def obtener_activos(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los departamentos activos.
        
        Returns:
            Lista de departamentos activos
        """
        return await self.depto_repo.get_activos()
    
    async def actualizar(
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
            existente = await self.depto_repo.get_by_numero(data.numero)
            if existente and existente['id'] != departamento_id:
                raise ValueError(f"Ya existe un departamento con número {data.numero}")
        
        # Filtrar solo campos con valor
        update_data = data.model_dump(exclude_unset=True)
        
        return await self.depto_repo.update(departamento_id, update_data)
    
    async def eliminar(self, departamento_id: str) -> bool:
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
        usuarios = await self.usuario_repo.get_by_departamento(departamento_id)
        if usuarios:
            raise ValueError("No se puede eliminar un departamento con usuarios asociados")
        
        return await self.depto_repo.delete(departamento_id)
    
    async def agregar_usuario(
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
        count = await self.depto_repo.get_usuarios_count(departamento_id)
        if count >= 5:
            raise ValueError("El departamento ya tiene el máximo de 5 usuarios")
        
        # Agregar usuario
        success = await self.depto_repo.agregar_usuario(departamento_id, usuario_id)
        
        if success:
            # Actualizar el departamento_id del usuario
            await self.usuario_repo.update(usuario_id, {'departamento_id': departamento_id})
        
        return success
    
    async def remover_usuario(
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
        success = await self.depto_repo.remover_usuario(departamento_id, usuario_id)
        
        if success:
            # Limpiar el departamento_id del usuario
            await self.usuario_repo.update(usuario_id, {'departamento_id': None})
        
        return success
    
    async def calcular_cuotas(self, total_gastos: int) -> Dict[str, int]:
        """
        Calcula la cuota de cada departamento basado en metros cuadrados.
        
        Args:
            total_gastos: Monto total de gastos del mes en CLP
            
        Returns:
            Diccionario {departamento_id: cuota_mensual}
        """
        departamentos = await self.obtener_activos()
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

    async def aplicar_aumento_masivo(
        self,
        request: Any,
        usuario_solicitante: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Aplica un aumento masivo a la cuota mensual de todos los departamentos,
        afectando a pagos proyectados futuros si existen.
        """
        if not usuario_solicitante.get('es_admin', False):
            raise PermissionError("Solo administradores pueden aplicar un aumento masivo")
            
        departamentos = await self.obtener_activos()
        
        factor = 1 + (request.porcentaje / 100)
        
        deptos_actualizados = 0
        from app.repositories.pago_repository import PagoRepository
        pago_repo = PagoRepository()
        
        for depto in departamentos:
            actual_cuota = depto.get('cuota_mensual', 0)
            nueva_cuota = round(actual_cuota * factor)
            
            await self.depto_repo.update(depto['id'], {'cuota_mensual': nueva_cuota})
            deptos_actualizados += 1
            
            # Actualizar pagos proyectados futuros
            pagos = await pago_repo.get_by_departamento(depto['id'])
            # Assuming format YYYY-MM
            futuros = [p for p in pagos if p.get('estado') == 'proyectado' and p.get('periodo', '') >= request.periodo_inicio]
            for p in futuros:
                await pago_repo.update(p['id'], {'monto': nueva_cuota})
                
        return {
            "departamentos_actualizados": deptos_actualizados,
            "porcentaje_aplicado": request.porcentaje,
            "periodo_inicio": request.periodo_inicio
        }
        
    async def ajustar_saldo(self, departamento_id: str, request: Any, usuario_solicitante: Dict[str, Any]) -> Dict[str, Any]:
        if not usuario_solicitante.get('es_admin', False):
            raise PermissionError("Solo admin puede ajustar saldo manualmente")
        
        from app.repositories.billetera_repository import BilleteraRepository
        b_repo = BilleteraRepository()
        
        movimiento = await b_repo.create_movimiento(
            departamento_id,
            request.tipo,
            request.monto,
            request.motivo,
            usuario_solicitante['id']
        )
        
        monto_ajuste = request.monto if request.tipo == 'ingreso' else -request.monto
        await self.depto_repo.actualizar_saldo(departamento_id, monto_ajuste)
        
        return movimiento
        
    async def obtener_historial_billetera(self, departamento_id: str, usuario_solicitante: Dict[str, Any]) -> List[Dict[str, Any]]:
        from app.repositories.billetera_repository import BilleteraRepository
        b_repo = BilleteraRepository()
        return await b_repo.get_by_departamento(departamento_id)
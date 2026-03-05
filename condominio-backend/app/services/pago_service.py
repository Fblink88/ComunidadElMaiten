"""
Servicio de Pagos.

Este servicio contiene la lógica de negocio relacionada con
los pagos de gastos comunes.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from app.repositories import PagoRepository, DepartamentoRepository, TransaccionRepository
from app.models import PagoCreate, PagoUpdate


class PagoService:
    """
    Servicio para operaciones de pagos.
    
    Maneja la lógica de negocio como creación de pagos,
    verificación y actualización de estados.
    """
    
    def __init__(self):
        """Inicializa el servicio con los repositorios necesarios."""
        self.pago_repo = PagoRepository()
        self.depto_repo = DepartamentoRepository()
        self.transaccion_repo = TransaccionRepository()
    
    async def crear(
        self, 
        data: PagoCreate,
        usuario_solicitante: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Crea un nuevo pago.
        
        Args:
            data: Datos del pago a crear
            usuario_solicitante: Usuario que realiza la operación
            
        Returns:
            Diccionario con el pago creado
            
        Raises:
            ValueError: Si ya existe un pago para ese periodo
            PermissionError: Si no tiene permisos
        """
        # Verificar que el usuario pertenece al departamento o es admin
        es_admin = usuario_solicitante.get('es_admin', False)
        depto_usuario = usuario_solicitante.get('departamento_id')
        
        if not es_admin and depto_usuario != data.departamento_id:
            raise PermissionError("No puedes crear pagos para otros departamentos")
        
        # Verificar que no exista un pago para ese periodo
        existente = await self.pago_repo.get_by_departamento_y_periodo(
            data.departamento_id, 
            data.periodo
        )
        if existente:
            raise ValueError(f"Ya existe un pago para el periodo {data.periodo}")
        
        # Verificar que el departamento existe
        depto = await self.depto_repo.get_by_id(data.departamento_id)
        if not depto:
            raise ValueError("Departamento no encontrado")
        
        # Preparar datos
        pago_data = data.model_dump()
        pago_data['estado'] = 'pendiente'
        pago_data['flow_payment_id'] = None
        pago_data['flow_payment_url'] = None
        pago_data['fecha_pago'] = None
        
        return await self.pago_repo.create(pago_data)
    
    async def obtener_todos(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Obtiene todos los pagos guardados.
        """
        return await self.pago_repo.get_all(limit=limit)
    
    async def obtener_por_id(self, pago_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un pago por su ID.
        
        Args:
            pago_id: ID del pago
            
        Returns:
            Diccionario con el pago o None
        """
        return await self.pago_repo.get_by_id(pago_id)
    
    async def obtener_por_departamento(
        self, 
        departamento_id: str,
        usuario_solicitante: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Obtiene los pagos de un departamento.
        
        Args:
            departamento_id: ID del departamento
            usuario_solicitante: Usuario que realiza la operación
            
        Returns:
            Lista de pagos del departamento
            
        Raises:
            PermissionError: Si no tiene permisos
        """
        # Verificar permisos
        es_admin = usuario_solicitante.get('es_admin', False)
        depto_usuario = usuario_solicitante.get('departamento_id')
        
        if not es_admin and depto_usuario != departamento_id:
            raise PermissionError("No puedes ver pagos de otros departamentos")
        
        return await self.pago_repo.get_by_departamento(departamento_id)
    
    async def obtener_por_periodo(self, periodo: str) -> List[Dict[str, Any]]:
        """
        Obtiene todos los pagos de un periodo.
        
        Solo para administradores.
        
        Args:
            periodo: Periodo en formato 'YYYY-MM'
            
        Returns:
            Lista de pagos del periodo
        """
        return await self.pago_repo.get_by_periodo(periodo)
    
    async def obtener_pendientes(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los pagos pendientes.
        
        Solo para administradores.
        
        Returns:
            Lista de pagos pendientes
        """
        return await self.pago_repo.get_pendientes()
    
    async def verificar_pago_manual(
        self,
        pago_id: str,
        aprobado: bool,
        notas: Optional[str],
        usuario_solicitante: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Verifica un pago manual (transferencia) y si aprueba,
        lo procesa como un abono a la billetera virtual.
        """
        if not usuario_solicitante.get('es_admin', False):
            raise PermissionError("Solo administradores pueden verificar pagos")
        
        pago = await self.pago_repo.get_by_id(pago_id)
        if not pago:
            return None
        
        if aprobado:
            monto_abono = int(pago.get('monto', 0))
            departamento_id = pago.get('departamento_id')
            
            # 1. Marcar ESTE registro como pagado
            actualizado = await self.pago_repo.update(pago_id, {
                'estado': 'pagado',
                'verificado_por': usuario_solicitante.get('id'),
                'fecha_pago': datetime.now()
            })
            
            # 2. Procesar el abono en cascada
            if departamento_id and monto_abono > 0:
                await self.procesar_abono(departamento_id, monto_abono)
                
            return actualizado
        else:
            return await self.pago_repo.update(pago_id, {
                'estado': 'rechazado',
                'verificado_por': usuario_solicitante.get('id'),
                'notas': notas
            })
            
    async def procesar_abono(self, departamento_id: str, monto: int) -> None:
        """
        Procesa un abono, pagando las deudas pendientes en orden cronológico (más antiguas primero).
        Cualquier saldo remanente se deposita en el saldo_a_favor del departamento.
        """
        # Obtener pagos pendientes
        pendientes = await self.obtener_pendientes_por_departamento(departamento_id)
        
        # Ordenar por periodo (más antiguos primero, formato YYYY-MM)
        pendientes.sort(key=lambda x: x.get('periodo', '9999-99'))
        
        remanente = monto
        for deuda in pendientes:
            if remanente <= 0:
                break
                
            deuda_id = deuda.get('id')
            monto_deuda = int(deuda.get('monto', 0))
            
            if remanente >= monto_deuda:
                # Paga la deuda completa
                remanente -= monto_deuda
                await self.pago_repo.marcar_como_pagado(deuda_id)
            else:
                # Pago parcial: creamos un nuevo pago por el remanente de la deuda y pagamos este 
                # o simplemente dejamos constancia? Para mantenerlo simple según la instrucción anterior:
                # Solo se paga si alcanza.
                break
                
        # Actualizar saldo a favor con el remanente
        if remanente > 0:
            await self.depto_repo.actualizar_saldo(departamento_id, float(remanente))
            
    async def obtener_pendientes_por_departamento(self, departamento_id: str) -> List[Dict[str, Any]]:
        pagos = await self.pago_repo.get_by_departamento(departamento_id)
        return [p for p in pagos if p.get('estado') == 'pendiente']
    
    async def actualizar_desde_flow(
        self,
        pago_id: str,
        flow_payment_id: str,
        estado: str
    ) -> Optional[Dict[str, Any]]:
        """
        Actualiza un pago desde webhook de Flow.
        Si está completado, lanza procesar_abono en cascada.
        """
        pago = await self.pago_repo.get_by_id(pago_id)
        if not pago:
            return None
            
        if estado == 'completed':
            actualizado = await self.pago_repo.marcar_como_pagado(pago_id, flow_payment_id)
            if pago.get('departamento_id') and pago.get('monto'):
                await self.procesar_abono(pago.get('departamento_id'), int(pago.get('monto')))
            return actualizado
        elif estado == 'rejected':
            return await self.pago_repo.actualizar_estado(pago_id, 'rechazado')
        else:
            return await self.pago_repo.update(pago_id, {
                'flow_payment_id': flow_payment_id,
                'estado': 'verificando'
            })

    async def obtener_todas_transacciones(self, limit: int = 500) -> List[Dict[str, Any]]:
        """
        Obtiene todas las transacciones ordenadas por fecha reciente (solo para admin).
        """
        return await self.transaccion_repo.get_all()

    async def obtener_transacciones_por_departamento(
        self, 
        departamento_id: str, 
        usuario_solicitante: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Obtiene las transacciones de un departamento específico.
        Valida que sea el admin o el dueño del departamento.
        """
        es_admin = usuario_solicitante.get('es_admin', False) or usuario_solicitante.get('esAdmin', False)
        depto_usuario = usuario_solicitante.get('departamento_id')

        if not es_admin and depto_usuario != departamento_id:
            raise PermissionError("No puedes ver transacciones de otros departamentos")

        return await self.transaccion_repo.get_by_departamento(departamento_id)
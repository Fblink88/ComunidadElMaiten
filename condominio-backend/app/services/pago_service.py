"""
Servicio de Pagos.

Este servicio contiene la lógica de negocio relacionada con
los pagos de gastos comunes.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from app.repositories import PagoRepository, DepartamentoRepository
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
    
    def crear(
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
        existente = self.pago_repo.get_by_departamento_y_periodo(
            data.departamento_id, 
            data.periodo
        )
        if existente:
            raise ValueError(f"Ya existe un pago para el periodo {data.periodo}")
        
        # Verificar que el departamento existe
        depto = self.depto_repo.get_by_id(data.departamento_id)
        if not depto:
            raise ValueError("Departamento no encontrado")
        
        # Preparar datos
        pago_data = data.model_dump()
        pago_data['estado'] = 'pendiente'
        pago_data['flow_payment_id'] = None
        pago_data['flow_payment_url'] = None
        pago_data['fecha_pago'] = None
        
        return self.pago_repo.create(pago_data)
    
    def obtener_por_id(self, pago_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un pago por su ID.
        
        Args:
            pago_id: ID del pago
            
        Returns:
            Diccionario con el pago o None
        """
        return self.pago_repo.get_by_id(pago_id)
    
    def obtener_por_departamento(
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
        
        return self.pago_repo.get_by_departamento(departamento_id)
    
    def obtener_por_periodo(self, periodo: str) -> List[Dict[str, Any]]:
        """
        Obtiene todos los pagos de un periodo.
        
        Solo para administradores.
        
        Args:
            periodo: Periodo en formato 'YYYY-MM'
            
        Returns:
            Lista de pagos del periodo
        """
        return self.pago_repo.get_by_periodo(periodo)
    
    def obtener_pendientes(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los pagos pendientes.
        
        Solo para administradores.
        
        Returns:
            Lista de pagos pendientes
        """
        return self.pago_repo.get_pendientes()
    
    def verificar_pago_manual(
        self,
        pago_id: str,
        aprobado: bool,
        notas: Optional[str],
        usuario_solicitante: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Verifica un pago manual (transferencia).
        
        Solo para administradores.
        
        Args:
            pago_id: ID del pago a verificar
            aprobado: Si el pago fue aprobado
            notas: Notas adicionales
            usuario_solicitante: Usuario que realiza la operación
            
        Returns:
            Diccionario con el pago actualizado
            
        Raises:
            PermissionError: Si no es admin
        """
        if not usuario_solicitante.get('es_admin', False):
            raise PermissionError("Solo administradores pueden verificar pagos")
        
        pago = self.pago_repo.get_by_id(pago_id)
        if not pago:
            return None
        
        if aprobado:
            return self.pago_repo.marcar_como_pagado(
                pago_id,
                verificado_por=usuario_solicitante.get('id')
            )
        else:
            return self.pago_repo.update(pago_id, {
                'estado': 'rechazado',
                'verificado_por': usuario_solicitante.get('id'),
                'notas': notas
            })
    
    def actualizar_desde_flow(
        self,
        pago_id: str,
        flow_payment_id: str,
        estado: str
    ) -> Optional[Dict[str, Any]]:
        """
        Actualiza un pago desde webhook de Flow.
        
        Args:
            pago_id: ID del pago
            flow_payment_id: ID de transacción de Flow
            estado: Estado del pago en Flow
            
        Returns:
            Diccionario con el pago actualizado
        """
        if estado == 'completed':
            return self.pago_repo.marcar_como_pagado(pago_id, flow_payment_id)
        elif estado == 'rejected':
            return self.pago_repo.actualizar_estado(pago_id, 'rechazado')
        else:
            return self.pago_repo.update(pago_id, {
                'flow_payment_id': flow_payment_id,
                'estado': 'verificando'
            })
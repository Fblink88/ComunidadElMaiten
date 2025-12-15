"""
Repositorio de Pagos.

Este repositorio maneja todas las operaciones de base de datos
relacionadas con los pagos de gastos comunes.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from .base_repository import BaseRepository


class PagoRepository(BaseRepository):
    """
    Repositorio para la colección 'pagos' en Firestore.
    
    Los pagos registran las transacciones de gastos comunes
    de cada departamento por periodo mensual.
    """
    
    def __init__(self):
        """Inicializa el repositorio con la colección 'pagos'."""
        super().__init__('pagos')
    
    def get_by_departamento(self, departamento_id: str) -> List[Dict[str, Any]]:
        """
        Obtiene todos los pagos de un departamento.
        
        Args:
            departamento_id: ID del departamento
            
        Returns:
            Lista de pagos del departamento ordenados por periodo
        """
        return self.find_by_field('departamento_id', departamento_id)
    
    def get_by_periodo(self, periodo: str) -> List[Dict[str, Any]]:
        """
        Obtiene todos los pagos de un periodo específico.
        
        Args:
            periodo: Periodo en formato 'YYYY-MM'
            
        Returns:
            Lista de pagos del periodo
        """
        return self.find_by_field('periodo', periodo)
    
    def get_by_departamento_y_periodo(
        self, 
        departamento_id: str, 
        periodo: str
    ) -> Optional[Dict[str, Any]]:
        """
        Obtiene el pago de un departamento para un periodo específico.
        
        Args:
            departamento_id: ID del departamento
            periodo: Periodo en formato 'YYYY-MM'
            
        Returns:
            Diccionario con el pago o None si no existe
        """
        docs = (
            self.collection
            .where('departamento_id', '==', departamento_id)
            .where('periodo', '==', periodo)
            .limit(1)
            .stream()
        )
        
        for doc in docs:
            return self._doc_to_dict(doc)
        
        return None
    
    def get_pendientes(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los pagos pendientes.
        
        Returns:
            Lista de pagos con estado='pendiente'
        """
        return self.find_by_field('estado', 'pendiente')
    
    def get_pendientes_by_departamento(self, departamento_id: str) -> List[Dict[str, Any]]:
        """
        Obtiene los pagos pendientes de un departamento.
        
        Args:
            departamento_id: ID del departamento
            
        Returns:
            Lista de pagos pendientes del departamento
        """
        docs = (
            self.collection
            .where('departamento_id', '==', departamento_id)
            .where('estado', '==', 'pendiente')
            .stream()
        )
        
        return [self._doc_to_dict(doc) for doc in docs if doc.exists]
    
    def marcar_como_pagado(
        self, 
        pago_id: str, 
        flow_payment_id: Optional[str] = None,
        verificado_por: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Marca un pago como pagado.
        
        Args:
            pago_id: ID del pago
            flow_payment_id: ID de transacción de Flow (opcional)
            verificado_por: ID del admin que verificó (para pagos manuales)
            
        Returns:
            Diccionario con el pago actualizado o None
        """
        data = {
            'estado': 'pagado',
            'fecha_pago': datetime.utcnow()
        }
        
        if flow_payment_id:
            data['flow_payment_id'] = flow_payment_id
        
        if verificado_por:
            data['verificado_por'] = verificado_por
        
        return self.update(pago_id, data)
    
    def actualizar_estado(self, pago_id: str, estado: str) -> Optional[Dict[str, Any]]:
        """
        Actualiza el estado de un pago.
        
        Args:
            pago_id: ID del pago
            estado: Nuevo estado ('pendiente', 'pagado', 'verificando', 'rechazado')
            
        Returns:
            Diccionario con el pago actualizado o None
        """
        return self.update(pago_id, {'estado': estado})
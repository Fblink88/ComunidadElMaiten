"""
Repositorio de Transacciones.

Este repositorio maneja todas las operaciones de base de datos
relacionadas con los abonos o pagos individuales que hacen los residentes
a su billetera virtual.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from .base_repository import BaseRepository


class TransaccionRepository(BaseRepository):
    """
    Repositorio para la colección 'transacciones' en Firestore.
    
    Registra los abonos realizados por los vecinos que luego 
    se usan para saldar deudas o quedan como saldo a favor.
    """
    
    def __init__(self):
        """Inicializa el repositorio con la colección 'transacciones'."""
        super().__init__('transacciones')
    
    async def get_by_departamento(self, departamento_id: str) -> List[Dict[str, Any]]:
        """
        Obtiene todas las transacciones de un departamento.
        
        Args:
            departamento_id: ID del departamento
            
        Returns:
            Lista de transacciones ordenadas por fecha
        """
        return await self.find_by_field('departamento_id', departamento_id)

    async def crear_transaccion(self, transaccion_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crea una nueva transacción (abono).
        
        Args:
            transaccion_data: Datos de la transacción a crear
            
        Returns:
            Diccionario con la transacción creada
        """
        return await self.create(transaccion_data)

# Instancia global del repositorio
transaccion_repository = TransaccionRepository()

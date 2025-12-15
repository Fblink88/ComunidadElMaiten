"""
Repositorio de Gastos.

Este repositorio maneja todas las operaciones de base de datos
relacionadas con los gastos mensuales y extraordinarios del condominio.
"""

from typing import Optional, List, Dict, Any
from .base_repository import BaseRepository
from app.config import db


class GastoRepository(BaseRepository):
    """
    Repositorio para la colección 'gastos_mensuales' en Firestore.
    
    También maneja la subcolección de gastos extraordinarios.
    """
    
    def __init__(self):
        """Inicializa el repositorio con la colección 'gastos_mensuales'."""
        super().__init__('gastos_mensuales')
        self.extraordinarios = db.collection('gastos_extraordinarios')
    
    # ============================================
    # GASTOS MENSUALES
    # ============================================
    
    def create_mensual(self, periodo: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crea un gasto mensual usando el periodo como ID.
        
        Args:
            periodo: Periodo en formato 'YYYY-MM' (será el ID)
            data: Datos del gasto mensual
            
        Returns:
            Diccionario con los datos creados
        """
        return self.create(data, doc_id=periodo)
    
    def get_by_periodo(self, periodo: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene el gasto mensual de un periodo específico.
        
        Args:
            periodo: Periodo en formato 'YYYY-MM'
            
        Returns:
            Diccionario con el gasto mensual o None
        """
        return self.get_by_id(periodo)
    
    def get_ultimos_periodos(self, cantidad: int = 12) -> List[Dict[str, Any]]:
        """
        Obtiene los últimos N gastos mensuales.
        
        Args:
            cantidad: Número de periodos a obtener
            
        Returns:
            Lista de gastos mensuales ordenados por periodo descendente
        """
        docs = (
            self.collection
            .order_by('periodo', direction='DESCENDING')
            .limit(cantidad)
            .stream()
        )
        
        return [self._doc_to_dict(doc) for doc in docs if doc.exists]
    
    # ============================================
    # GASTOS EXTRAORDINARIOS
    # ============================================
    
    def create_extraordinario(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crea un gasto extraordinario.
        
        Args:
            data: Datos del gasto extraordinario
            
        Returns:
            Diccionario con los datos creados
        """
        from datetime import datetime
        
        now = datetime.utcnow()
        data['fecha'] = now
        data['created_at'] = now
        data['pagos'] = {}  # Inicializar estado de pagos vacío
        
        doc_ref = self.extraordinarios.document()
        doc_ref.set(data)
        
        return {'id': doc_ref.id, **data}
    
    def get_extraordinario(self, gasto_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un gasto extraordinario por su ID.
        
        Args:
            gasto_id: ID del gasto extraordinario
            
        Returns:
            Diccionario con el gasto o None
        """
        doc = self.extraordinarios.document(gasto_id).get()
        
        if not doc.exists:
            return None
        
        data = doc.to_dict()
        data['id'] = doc.id
        return data
    
    def get_all_extraordinarios(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Obtiene todos los gastos extraordinarios.
        
        Args:
            limit: Número máximo de resultados
            
        Returns:
            Lista de gastos extraordinarios
        """
        docs = (
            self.extraordinarios
            .order_by('fecha', direction='DESCENDING')
            .limit(limit)
            .stream()
        )
        
        result = []
        for doc in docs:
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                result.append(data)
        
        return result
    
    def marcar_pago_extraordinario(
        self, 
        gasto_id: str, 
        departamento_id: str,
        pagado: bool = True
    ) -> bool:
        """
        Marca el pago de un gasto extraordinario para un departamento.
        
        Args:
            gasto_id: ID del gasto extraordinario
            departamento_id: ID del departamento que pagó
            pagado: Estado del pago
            
        Returns:
            True si se actualizó correctamente
        """
        from datetime import datetime
        
        gasto = self.get_extraordinario(gasto_id)
        if not gasto:
            return False
        
        self.extraordinarios.document(gasto_id).update({
            f'pagos.{departamento_id}': {
                'pagado': pagado,
                'fecha_pago': datetime.utcnow() if pagado else None
            }
        })
        
        return True
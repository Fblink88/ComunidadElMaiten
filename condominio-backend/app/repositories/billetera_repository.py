from typing import List, Dict, Any, Optional
from google.cloud import firestore
from .base_repository import BaseRepository

class BilleteraRepository(BaseRepository):
    """
    Repositorio para gestionar el historial de movimientos de billetera virtual.
    """
    
    def __init__(self):
        super().__init__('billetera_movimientos')
        
    def create(self, data: Dict[str, Any], doc_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Crea un nuevo registro de movimiento usando BaseRepository.
        """
        # Delegamos en BaseRepository para que ponga ID, created_at y updated_at
        return super().create(data, doc_id)
        
    def get_by_departamento(self, departamento_id: str) -> List[Dict[str, Any]]:
        """
        Obtiene el historial de movimientos de un departamento.
        Ordenados del más reciente al más antiguo.
        """
        docs = (
            self.collection
            .where('departamento_id', '==', departamento_id)
            .stream()
        )
        
        movimientos = [self._doc_to_dict(doc) for doc in docs if doc.exists]
        
        # Ordenamos en memoria para evitar requerir un Indice Compuesto en Firestore
        movimientos.sort(key=lambda x: x.get('fecha', ''), reverse=True)
        
        return movimientos

    def obtener_todos(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los movimientos de todas las billeteras.
        """
        docs = self.collection.stream()
        movimientos = [self._doc_to_dict(doc) for doc in docs if doc.exists]
        
        movimientos.sort(key=lambda x: x.get('fecha', ''), reverse=True)
        return movimientos

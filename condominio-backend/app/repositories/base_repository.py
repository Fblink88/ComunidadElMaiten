"""
Repositorio Base.

Este archivo contiene la clase base para todos los repositorios.
Implementa las operaciones CRUD comunes que heredan los demás repositorios.

Esto evita repetir código y asegura consistencia en todas las operaciones
de base de datos.
"""

from typing import TypeVar, Generic, Optional, List, Dict, Any
from google.cloud.firestore_v1 import DocumentSnapshot
from datetime import datetime
from app.config import db

# Tipo genérico para los modelos
T = TypeVar('T')


class BaseRepository(Generic[T]):
    """
    Repositorio base con operaciones CRUD genéricas.
    
    Todos los repositorios específicos heredan de esta clase
    y pueden sobrescribir métodos si necesitan comportamiento especial.
    
    Attributes:
        collection_name: Nombre de la colección en Firestore
        collection: Referencia a la colección de Firestore
    """
    
    def __init__(self, collection_name: str):
        """
        Inicializa el repositorio con el nombre de la colección.
        
        Args:
            collection_name: Nombre de la colección en Firestore
        """
        self.collection_name = collection_name
        self.collection = db.collection(collection_name)
    
    def _doc_to_dict(self, doc: DocumentSnapshot) -> Optional[Dict[str, Any]]:
        """
        Convierte un documento de Firestore a diccionario.
        
        Agrega el ID del documento al diccionario resultante.
        
        Args:
            doc: Documento de Firestore
            
        Returns:
            Diccionario con los datos del documento o None si no existe
        """
        if not doc.exists:
            return None
        
        data = doc.to_dict()
        data['id'] = doc.id
        return data
    
    def create(self, data: Dict[str, Any], doc_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Crea un nuevo documento en la colección.
        
        Args:
            data: Datos del documento a crear
            doc_id: ID opcional del documento. Si no se proporciona, Firestore genera uno.
            
        Returns:
            Diccionario con los datos creados incluyendo el ID
        """
        # Agregar timestamps
        now = datetime.utcnow()
        data['created_at'] = now
        data['updated_at'] = now
        
        if doc_id:
            # Usar ID específico
            doc_ref = self.collection.document(doc_id)
            doc_ref.set(data)
        else:
            # Generar ID automático
            doc_ref = self.collection.document()
            doc_ref.set(data)
        
        return {'id': doc_ref.id, **data}
    
    def get_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un documento por su ID.
        
        Args:
            doc_id: ID del documento a buscar
            
        Returns:
            Diccionario con los datos del documento o None si no existe
        """
        doc = self.collection.document(doc_id).get()
        return self._doc_to_dict(doc)
    
    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Obtiene todos los documentos de la colección.
        
        Args:
            limit: Número máximo de documentos a retornar
            
        Returns:
            Lista de diccionarios con los datos de los documentos
        """
        docs = self.collection.limit(limit).stream()
        return [self._doc_to_dict(doc) for doc in docs if doc.exists]
    
    def update(self, doc_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Actualiza un documento existente.
        
        Args:
            doc_id: ID del documento a actualizar
            data: Datos a actualizar (solo los campos proporcionados)
            
        Returns:
            Diccionario con los datos actualizados o None si no existe
        """
        doc_ref = self.collection.document(doc_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
        
        # Agregar timestamp de actualización
        data['updated_at'] = datetime.utcnow()
        
        # Filtrar valores None para no sobrescribir con nulos
        data = {k: v for k, v in data.items() if v is not None}
        
        doc_ref.update(data)
        
        # Retornar documento actualizado
        return self.get_by_id(doc_id)
    
    def delete(self, doc_id: str) -> bool:
        """
        Elimina un documento por su ID.
        
        Args:
            doc_id: ID del documento a eliminar
            
        Returns:
            True si se eliminó, False si no existía
        """
        doc_ref = self.collection.document(doc_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return False
        
        doc_ref.delete()
        return True
    
    def exists(self, doc_id: str) -> bool:
        """
        Verifica si un documento existe.
        
        Args:
            doc_id: ID del documento a verificar
            
        Returns:
            True si existe, False si no
        """
        doc = self.collection.document(doc_id).get()
        return doc.exists
    
    def find_by_field(
        self, 
        field: str, 
        value: Any, 
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Busca documentos por un campo específico.
        
        Args:
            field: Nombre del campo a buscar
            value: Valor a comparar
            limit: Número máximo de resultados
            
        Returns:
            Lista de documentos que coinciden
        """
        docs = (
            self.collection
            .where(field, '==', value)
            .limit(limit)
            .stream()
        )
        return [self._doc_to_dict(doc) for doc in docs if doc.exists]
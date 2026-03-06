"""
Repositorio de Autorizaciones de Pago.

Este repositorio maneja todas las operaciones de base de datos
relacionadas con las autorizaciones de pago para arrendatarios.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from starlette.concurrency import run_in_threadpool
from .base_repository import BaseRepository


class AutorizacionRepository(BaseRepository):
    """
    Repositorio para gestionar autorizaciones de pago.

    Permite a los propietarios autorizar a arrendatarios para pagar
    gastos comunes, ya sea de forma permanente o para periodos específicos.
    """

    def __init__(self):
        """Inicializa el repositorio con la colección 'autorizaciones_pago'"""
        super().__init__('autorizaciones_pago')

    async def crear_solicitud(
        self,
        departamento_id: str,
        propietario_id: str,
        arrendatario_id: str,
        tipo: str,
        periodos: Optional[List[str]] = None,
        nota_solicitud: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Crea una solicitud de autorización (iniciada por arrendatario).

        Args:
            departamento_id: ID del departamento
            propietario_id: ID del propietario
            arrendatario_id: ID del arrendatario que solicita
            tipo: 'permanente' o 'ocasional'
            periodos: Lista de periodos (requerido si tipo es 'ocasional')
            nota_solicitud: Mensaje del arrendatario

        Returns:
            Autorización creada con estado 'pendiente'
        """
        data = {
            'departamento_id': departamento_id,
            'propietario_id': propietario_id,
            'arrendatario_id': arrendatario_id,
            'tipo': tipo,
            'estado': 'pendiente',
            'periodos_autorizados': periodos if tipo == 'ocasional' else None,
            'nota_solicitud': nota_solicitud,
            'nota_respuesta': None,
            'fue_solicitada': True,
            'fecha_creacion': datetime.utcnow(),
            'fecha_respuesta': None,
            'fecha_revocacion': None
        }

        return await self.create(data)

    async def crear_autorizacion_directa(
        self,
        departamento_id: str,
        propietario_id: str,
        arrendatario_id: str,
        tipo: str,
        periodos: Optional[List[str]] = None,
        nota: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Crea una autorización directa (propietario autoriza sin solicitud).

        Args:
            departamento_id: ID del departamento
            propietario_id: ID del propietario que autoriza
            arrendatario_id: ID del arrendatario autorizado
            tipo: 'permanente' o 'ocasional'
            periodos: Lista de periodos (si ocasional)
            nota: Nota del propietario

        Returns:
            Autorización creada directamente en estado 'aprobada'
        """
        data = {
            'departamento_id': departamento_id,
            'propietario_id': propietario_id,
            'arrendatario_id': arrendatario_id,
            'tipo': tipo,
            'estado': 'aprobada',
            'periodos_autorizados': periodos if tipo == 'ocasional' else None,
            'nota_solicitud': None,
            'nota_respuesta': nota,
            'fue_solicitada': False,
            'fecha_creacion': datetime.utcnow(),
            'fecha_respuesta': datetime.utcnow(),
            'fecha_revocacion': None
        }

        return await self.create(data)

    async def aprobar(
        self,
        autorizacion_id: str,
        nota_respuesta: str
    ) -> Optional[Dict[str, Any]]:
        """
        Aprueba una solicitud de autorización pendiente.

        Args:
            autorizacion_id: ID de la autorización
            nota_respuesta: Mensaje del propietario al aprobar

        Returns:
            Autorización actualizada o None si no existe
        """
        return await self.update(autorizacion_id, {
            'estado': 'aprobada',
            'nota_respuesta': nota_respuesta,
            'fecha_respuesta': datetime.utcnow()
        })

    async def rechazar(
        self,
        autorizacion_id: str,
        motivo: str
    ) -> Optional[Dict[str, Any]]:
        """
        Rechaza una solicitud de autorización pendiente.

        Args:
            autorizacion_id: ID de la autorización
            motivo: Razón del rechazo

        Returns:
            Autorización actualizada o None si no existe
        """
        return await self.update(autorizacion_id, {
            'estado': 'rechazada',
            'nota_respuesta': motivo,
            'fecha_respuesta': datetime.utcnow()
        })

    async def revocar(
        self,
        autorizacion_id: str,
        motivo: str
    ) -> Optional[Dict[str, Any]]:
        """
        Revoca una autorización aprobada.

        Args:
            autorizacion_id: ID de la autorización
            motivo: Razón de la revocación

        Returns:
            Autorización actualizada o None si no existe
        """
        return await self.update(autorizacion_id, {
            'estado': 'revocada',
            'nota_respuesta': motivo,
            'fecha_revocacion': datetime.utcnow()
        })

    async def obtener_por_departamento(
        self,
        departamento_id: str,
        solo_activas: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Obtiene todas las autorizaciones de un departamento.

        Args:
            departamento_id: ID del departamento
            solo_activas: Si True, solo retorna autorizaciones aprobadas

        Returns:
            Lista de autorizaciones
        """
        query = self.collection.where('departamento_id', '==', departamento_id)

        if solo_activas:
            query = query.where('estado', '==', 'aprobada')

        def _stream():
            return list(query.stream())
        docs = await run_in_threadpool(_stream)
        return [self._doc_to_dict(doc) for doc in docs if doc.exists]

    async def obtener_solicitudes_pendientes(
        self,
        propietario_id: str
    ) -> List[Dict[str, Any]]:
        """
        Obtiene todas las solicitudes pendientes de un propietario.

        Args:
            propietario_id: ID del propietario

        Returns:
            Lista de autorizaciones pendientes
        """
        docs = (
            self.collection
            .where('propietario_id', '==', propietario_id)
            .where('estado', '==', 'pendiente')
            .order_by('fecha_creacion', direction='DESCENDING')
            .stream()
        )

        return [self._doc_to_dict(doc) for doc in docs if doc.exists]

    async def verificar_autorizacion_permanente(
        self,
        arrendatario_id: str,
        departamento_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Verifica si existe una autorización permanente aprobada.

        Args:
            arrendatario_id: ID del arrendatario
            departamento_id: ID del departamento

        Returns:
            Autorización permanente aprobada o None
        """
        docs = (
            self.collection
            .where('arrendatario_id', '==', arrendatario_id)
            .where('departamento_id', '==', departamento_id)
            .where('tipo', '==', 'permanente')
            .where('estado', '==', 'aprobada')
            .limit(1)
            .stream()
        )

        results = [self._doc_to_dict(doc) for doc in docs if doc.exists]
        return results[0] if results else None

    async def verificar_autorizacion_ocasional(
        self,
        arrendatario_id: str,
        departamento_id: str,
        periodo: str
    ) -> Optional[Dict[str, Any]]:
        """
        Verifica si existe una autorización ocasional aprobada para un periodo.

        Args:
            arrendatario_id: ID del arrendatario
            departamento_id: ID del departamento
            periodo: Periodo a verificar (ej: '2025-01')

        Returns:
            Autorización ocasional que incluye el periodo o None
        """
        docs = (
            self.collection
            .where('arrendatario_id', '==', arrendatario_id)
            .where('departamento_id', '==', departamento_id)
            .where('tipo', '==', 'ocasional')
            .where('estado', '==', 'aprobada')
            .where('periodos_autorizados', 'array_contains', periodo)
            .limit(1)
            .stream()
        )

        results = [self._doc_to_dict(doc) for doc in docs if doc.exists]
        return results[0] if results else None

    async def tiene_solicitud_pendiente(
        self,
        arrendatario_id: str,
        departamento_id: str
    ) -> bool:
        """
        Verifica si el arrendatario ya tiene una solicitud pendiente.

        Args:
            arrendatario_id: ID del arrendatario
            departamento_id: ID del departamento

        Returns:
            True si tiene solicitud pendiente, False si no
        """
        docs = (
            self.collection
            .where('arrendatario_id', '==', arrendatario_id)
            .where('departamento_id', '==', departamento_id)
            .where('estado', '==', 'pendiente')
            .limit(1)
            .stream()
        )

        return len(list(docs)) > 0

    async def tiene_autorizacion_activa(
        self,
        arrendatario_id: str,
        departamento_id: str,
        tipo: str
    ) -> bool:
        """
        Verifica si existe una autorización activa del tipo especificado.

        Args:
            arrendatario_id: ID del arrendatario
            departamento_id: ID del departamento
            tipo: 'permanente' o 'ocasional'

        Returns:
            True si tiene autorización activa de ese tipo
        """
        docs = (
            self.collection
            .where('arrendatario_id', '==', arrendatario_id)
            .where('departamento_id', '==', departamento_id)
            .where('tipo', '==', tipo)
            .where('estado', '==', 'aprobada')
            .limit(1)
            .stream()
        )

        return len(list(docs)) > 0

    async def obtener_autorizaciones_arrendatario(
        self,
        arrendatario_id: str
    ) -> List[Dict[str, Any]]:
        """
        Obtiene todas las autorizaciones de un arrendatario.

        Args:
            arrendatario_id: ID del arrendatario

        Returns:
            Lista de autorizaciones ordenadas por fecha
        """
        docs = (
            self.collection
            .where('arrendatario_id', '==', arrendatario_id)
            .order_by('fecha_creacion', direction='DESCENDING')
            .stream()
        )

        return [self._doc_to_dict(doc) for doc in docs if doc.exists]


# Instancia global del repositorio
autorizacion_repository = AutorizacionRepository()

# Instancia global del repositorio
autorizacion_repository = AutorizacionRepository()

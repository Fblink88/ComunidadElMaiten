"""
Servicio de Autorizaciones de Pago.

Este servicio contiene la lógica de negocio para gestionar autorizaciones
que permiten a arrendatarios pagar gastos comunes.
"""

from typing import Dict, Any, Optional, List
from app.repositories.autorizacion_repository import autorizacion_repository
from app.repositories.usuario_repository import usuario_repository
from app.repositories.departamento_repository import departamento_repository
from app.services.email_service import email_service


class AutorizacionService:
    """
    Servicio para gestionar autorizaciones de pago.

    Coordina la lógica de negocio entre repositorios y servicios externos
    para manejar solicitudes, aprobaciones y verificaciones de autorización.
    """

    def __init__(self):
        """Inicializa el servicio con los repositorios necesarios"""
        self.autorizacion_repo = autorizacion_repository
        self.usuario_repo = usuario_repository
        self.depto_repo = departamento_repository
        self.email_service = email_service

    async def solicitar_autorizacion(
        self,
        arrendatario_id: str,
        tipo: str,
        periodos: Optional[List[str]] = None,
        nota: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Arrendatario solicita autorización al propietario.

        Args:
            arrendatario_id: ID del arrendatario que solicita
            tipo: 'permanente' o 'ocasional'
            periodos: Lista de periodos (requerido si tipo es 'ocasional')
            nota: Mensaje para el propietario

        Returns:
            Autorización creada en estado 'pendiente'

        Raises:
            ValueError: Si el usuario no es arrendatario o datos inválidos
            PermissionError: Si ya tiene solicitud pendiente
        """
        # Obtener datos del arrendatario
        arrendatario = await self.usuario_repo.get_by_id(arrendatario_id)
        if not arrendatario:
            raise ValueError("Arrendatario no encontrado")

        if arrendatario.get('rol') != 'arrendatario':
            raise PermissionError("Solo los arrendatarios pueden solicitar autorización")

        departamento_id = arrendatario.get('departamento_id')
        if not departamento_id:
            raise ValueError("Arrendatario no tiene departamento asignado")

        # Validar que no tenga solicitud pendiente
        if await self.autorizacion_repo.tiene_solicitud_pendiente(arrendatario_id, departamento_id):
            raise PermissionError("Ya tienes una solicitud de autorización pendiente")

        # Validar periodos si es ocasional
        if tipo == 'ocasional':
            if not periodos or len(periodos) == 0:
                raise ValueError("Debes especificar al menos un periodo para autorización ocasional")

            # Validar formato de periodos (YYYY-MM)
            for periodo in periodos:
                if not self._validar_formato_periodo(periodo):
                    raise ValueError(f"Formato de periodo inválido: {periodo}. Usa formato YYYY-MM")

        # Obtener propietario del departamento
        propietario = await self._obtener_propietario_departamento(departamento_id)
        if not propietario:
            raise ValueError("No se encontró propietario para este departamento")

        # Crear solicitud
        autorizacion = await self.autorizacion_repo.crear_solicitud(
            departamento_id=departamento_id,
            propietario_id=propietario['id'],
            arrendatario_id=arrendatario_id,
            tipo=tipo,
            periodos=periodos,
            nota_solicitud=nota
        )

        # Enviar email al propietario
        try:
            self.email_service.enviar_solicitud_autorizacion(
                email_propietario=propietario['email'],
                nombre_propietario=propietario['nombre'],
                nombre_arrendatario=arrendatario['nombre'],
                tipo=tipo,
                periodos=periodos,
                nota=nota or "Sin mensaje adicional"
            )
        except Exception as e:
            print(f"Error enviando email de solicitud: {e}")

        return autorizacion

    async def autorizar_directamente(
        self,
        propietario_id: str,
        arrendatario_id: str,
        tipo: str,
        periodos: Optional[List[str]] = None,
        nota: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Propietario autoriza proactivamente sin solicitud.

        Args:
            propietario_id: ID del propietario que autoriza
            arrendatario_id: ID del arrendatario a autorizar
            tipo: 'permanente' o 'ocasional'
            periodos: Lista de periodos (si ocasional)
            nota: Nota del propietario

        Returns:
            Autorización creada directamente en estado 'aprobada'

        Raises:
            ValueError: Si datos son inválidos
            PermissionError: Si el usuario no es propietario o ya existe autorización
        """
        # Validar propietario
        propietario = await self.usuario_repo.get_by_id(propietario_id)
        if not propietario:
            raise ValueError("Propietario no encontrado")

        if propietario.get('rol') != 'propietario':
            raise PermissionError("Solo los propietarios pueden autorizar")

        departamento_id = propietario.get('departamento_id')
        if not departamento_id:
            raise ValueError("Propietario no tiene departamento asignado")

        # Validar arrendatario
        arrendatario = await self.usuario_repo.get_by_id(arrendatario_id)
        if not arrendatario:
            raise ValueError("Arrendatario no encontrado")

        if arrendatario.get('rol') != 'arrendatario':
            raise ValueError("El usuario a autorizar debe ser arrendatario")

        if arrendatario.get('departamento_id') != departamento_id:
            raise PermissionError("El arrendatario no pertenece a tu departamento")

        # Validar que no exista autorización activa del mismo tipo
        if await self.autorizacion_repo.tiene_autorizacion_activa(arrendatario_id, departamento_id, tipo):
            raise PermissionError(f"Ya existe una autorización {tipo} activa para este arrendatario")

        # Validar periodos si es ocasional
        if tipo == 'ocasional':
            if not periodos or len(periodos) == 0:
                raise ValueError("Debes especificar al menos un periodo")

            for periodo in periodos:
                if not self._validar_formato_periodo(periodo):
                    raise ValueError(f"Formato de periodo inválido: {periodo}")

        # Crear autorización directa
        autorizacion = await self.autorizacion_repo.crear_autorizacion_directa(
            departamento_id=departamento_id,
            propietario_id=propietario_id,
            arrendatario_id=arrendatario_id,
            tipo=tipo,
            periodos=periodos,
            nota=nota
        )

        # Enviar email al arrendatario
        try:
            self.email_service.enviar_autorizacion_directa(
                email_arrendatario=arrendatario['email'],
                nombre_arrendatario=arrendatario['nombre'],
                tipo=tipo,
                periodos=periodos,
                nota_propietario=nota
            )
        except Exception as e:
            print(f"Error enviando email de autorización directa: {e}")

        return autorizacion

    async def aprobar_solicitud(
        self,
        propietario_id: str,
        autorizacion_id: str,
        nota: str
    ) -> Dict[str, Any]:
        """
        Propietario aprueba una solicitud pendiente.

        Args:
            propietario_id: ID del propietario
            autorizacion_id: ID de la autorización a aprobar
            nota: Mensaje de aprobación

        Returns:
            Autorización actualizada a estado 'aprobada'

        Raises:
            ValueError: Si la autorización no existe
            PermissionError: Si no es el propietario o estado inválido
        """
        # Obtener autorización
        autorizacion = await self.autorizacion_repo.get_by_id(autorizacion_id)
        if not autorizacion:
            raise ValueError("Autorización no encontrada")

        # Verificar que sea el propietario correcto
        if autorizacion['propietario_id'] != propietario_id:
            raise PermissionError("No tienes permiso para aprobar esta autorización")

        # Verificar estado
        if autorizacion['estado'] != 'pendiente':
            raise PermissionError("Solo se pueden aprobar autorizaciones pendientes")

        # Aprobar
        autorizacion_aprobada = await self.autorizacion_repo.aprobar(autorizacion_id, nota)

        # Obtener arrendatario para enviar email
        arrendatario = await self.usuario_repo.get_by_id(autorizacion['arrendatario_id'])
        if arrendatario:
            try:
                self.email_service.enviar_autorizacion_aprobada(
                    email_arrendatario=arrendatario['email'],
                    nombre_arrendatario=arrendatario['nombre'],
                    tipo=autorizacion['tipo'],
                    periodos=autorizacion.get('periodos_autorizados'),
                    nota_propietario=nota
                )
            except Exception as e:
                print(f"Error enviando email de aprobación: {e}")

        return autorizacion_aprobada

    async def rechazar_solicitud(
        self,
        propietario_id: str,
        autorizacion_id: str,
        motivo: str
    ) -> Dict[str, Any]:
        """
        Propietario rechaza una solicitud pendiente.

        Args:
            propietario_id: ID del propietario
            autorizacion_id: ID de la autorización a rechazar
            motivo: Razón del rechazo

        Returns:
            Autorización actualizada a estado 'rechazada'

        Raises:
            ValueError: Si la autorización no existe
            PermissionError: Si no es el propietario o estado inválido
        """
        # Obtener autorización
        autorizacion = await self.autorizacion_repo.get_by_id(autorizacion_id)
        if not autorizacion:
            raise ValueError("Autorización no encontrada")

        # Verificar que sea el propietario correcto
        if autorizacion['propietario_id'] != propietario_id:
            raise PermissionError("No tienes permiso para rechazar esta autorización")

        # Verificar estado
        if autorizacion['estado'] != 'pendiente':
            raise PermissionError("Solo se pueden rechazar autorizaciones pendientes")

        # Rechazar
        autorizacion_rechazada = await self.autorizacion_repo.rechazar(autorizacion_id, motivo)

        # Obtener arrendatario para enviar email
        arrendatario = await self.usuario_repo.get_by_id(autorizacion['arrendatario_id'])
        if arrendatario:
            try:
                self.email_service.enviar_autorizacion_rechazada(
                    email_arrendatario=arrendatario['email'],
                    nombre_arrendatario=arrendatario['nombre'],
                    motivo=motivo
                )
            except Exception as e:
                print(f"Error enviando email de rechazo: {e}")

        return autorizacion_rechazada

    async def revocar_autorizacion(
        self,
        propietario_id: str,
        autorizacion_id: str,
        motivo: str
    ) -> Dict[str, Any]:
        """
        Propietario revoca una autorización aprobada.

        Args:
            propietario_id: ID del propietario
            autorizacion_id: ID de la autorización a revocar
            motivo: Razón de la revocación

        Returns:
            Autorización actualizada a estado 'revocada'

        Raises:
            ValueError: Si la autorización no existe
            PermissionError: Si no es el propietario o estado inválido
        """
        # Obtener autorización
        autorizacion = await self.autorizacion_repo.get_by_id(autorizacion_id)
        if not autorizacion:
            raise ValueError("Autorización no encontrada")

        # Verificar que sea el propietario correcto
        if autorizacion['propietario_id'] != propietario_id:
            raise PermissionError("No tienes permiso para revocar esta autorización")

        # Verificar estado
        if autorizacion['estado'] != 'aprobada':
            raise PermissionError("Solo se pueden revocar autorizaciones aprobadas")

        # Revocar
        autorizacion_revocada = await self.autorizacion_repo.revocar(autorizacion_id, motivo)

        # Obtener arrendatario para enviar email
        arrendatario = await self.usuario_repo.get_by_id(autorizacion['arrendatario_id'])
        if arrendatario:
            try:
                self.email_service.enviar_autorizacion_revocada(
                    email_arrendatario=arrendatario['email'],
                    nombre_arrendatario=arrendatario['nombre'],
                    motivo=motivo
                )
            except Exception as e:
                print(f"Error enviando email de revocación: {e}")

        return autorizacion_revocada

    async def puede_pagar(
        self,
        usuario_id: str,
        departamento_id: str,
        periodo: str
    ) -> Dict[str, Any]:
        """
        Verifica si un usuario puede pagar un periodo específico.

        Args:
            usuario_id: ID del usuario
            departamento_id: ID del departamento
            periodo: Periodo a verificar (ej: '2025-01')

        Returns:
            Dict con:
                - puede_pagar: bool
                - motivo: str (explicación)
                - autorizacion_id: str (si aplica)
        """
        # Obtener usuario
        usuario = await self.usuario_repo.get_by_id(usuario_id)
        if not usuario:
            return {
                "puede_pagar": False,
                "motivo": "Usuario no encontrado",
                "autorizacion_id": None
            }

        # Si es propietario, siempre puede pagar
        if usuario.get('rol') == 'propietario':
            return {
                "puede_pagar": True,
                "motivo": "Los propietarios pueden pagar siempre",
                "autorizacion_id": None
            }

        # Si es arrendatario, verificar autorización
        if usuario.get('rol') == 'arrendatario':
            # Verificar autorización permanente
            auth_permanente = await self.autorizacion_repo.verificar_autorizacion_permanente(
                usuario_id,
                departamento_id
            )
            if auth_permanente:
                return {
                    "puede_pagar": True,
                    "motivo": "Tienes autorización permanente aprobada",
                    "autorizacion_id": auth_permanente['id']
                }

            # Verificar autorización ocasional para este periodo
            auth_ocasional = await self.autorizacion_repo.verificar_autorizacion_ocasional(
                usuario_id,
                departamento_id,
                periodo
            )
            if auth_ocasional:
                return {
                    "puede_pagar": True,
                    "motivo": f"Tienes autorización ocasional para el periodo {periodo}",
                    "autorizacion_id": auth_ocasional['id']
                }

            # No tiene autorización
            return {
                "puede_pagar": False,
                "motivo": "No tienes autorización para pagar. Solicita autorización al propietario.",
                "autorizacion_id": None
            }

        # Si es admin u otro rol
        if usuario.get('es_admin'):
            return {
                "puede_pagar": True,
                "motivo": "Los administradores pueden pagar siempre",
                "autorizacion_id": None
            }

        return {
            "puede_pagar": False,
            "motivo": "Rol de usuario no válido para realizar pagos",
            "autorizacion_id": None
        }

    async def obtener_autorizaciones_departamento(
        self,
        departamento_id: str,
        solo_activas: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Obtiene todas las autorizaciones de un departamento.

        Args:
            departamento_id: ID del departamento
            solo_activas: Si True, solo retorna aprobadas

        Returns:
            Lista de autorizaciones
        """
        return await self.autorizacion_repo.obtener_por_departamento(departamento_id, solo_activas)

    async def obtener_solicitudes_pendientes(
        self,
        propietario_id: str
    ) -> List[Dict[str, Any]]:
        """
        Obtiene solicitudes pendientes del propietario.

        Args:
            propietario_id: ID del propietario

        Returns:
            Lista de autorizaciones pendientes
        """
        return await self.autorizacion_repo.obtener_solicitudes_pendientes(propietario_id)

    async def obtener_mis_autorizaciones(
        self,
        arrendatario_id: str
    ) -> List[Dict[str, Any]]:
        """
        Obtiene todas las autorizaciones de un arrendatario.

        Args:
            arrendatario_id: ID del arrendatario

        Returns:
            Lista de autorizaciones
        """
        return await self.autorizacion_repo.obtener_autorizaciones_arrendatario(arrendatario_id)

    def _validar_formato_periodo(self, periodo: str) -> bool:
        """
        Valida que el periodo tenga formato YYYY-MM.

        Args:
            periodo: Periodo a validar

        Returns:
            True si es válido, False si no
        """
        import re
        pattern = r'^\d{4}-\d{2}$'
        return bool(re.match(pattern, periodo))

    async def _obtener_propietario_departamento(self, departamento_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene el propietario de un departamento.

        Args:
            departamento_id: ID del departamento

        Returns:
            Usuario propietario o None si no se encuentra
        """
        # Obtener todos los usuarios del departamento
        departamento = await self.depto_repo.get_by_id(departamento_id)
        if not departamento:
            return None

        usuarios_ids = departamento.get('usuarios_ids', [])

        # Buscar el que tiene rol de propietario
        for usuario_id in usuarios_ids:
            usuario = await self.usuario_repo.get_by_id(usuario_id)
            if usuario and usuario.get('rol') == 'propietario':
                return usuario

        return None


# Instancia global del servicio
autorizacion_service = AutorizacionService()

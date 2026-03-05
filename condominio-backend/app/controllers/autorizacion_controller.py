"""
Controlador de Autorizaciones de Pago.

Este controlador maneja los endpoints relacionados con el sistema de autorización
que permite a propietarios autorizar a arrendatarios para pagar gastos comunes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.middleware import get_current_user
from app.services.autorizacion_service import autorizacion_service
from app.models import (
    AutorizacionCreate,
    AutorizacionDirectaCreate,
    AutorizacionRespuesta,
    AutorizacionRevocacion,
    AutorizacionResponse,
    PuedePagarResponse
)

router = APIRouter(prefix="/autorizaciones", tags=["autorizaciones"])


@router.post("/solicitar", response_model=AutorizacionResponse)
async def solicitar_autorizacion(
    data: AutorizacionCreate,
    current_user: Dict = Depends(get_current_user)
):
    """
    Arrendatario solicita autorización para pagar.

    El propietario recibirá un email con la solicitud.

    Requiere:
    - Ser arrendatario
    - No tener solicitud pendiente existente
    - Si ocasional, especificar periodos válidos (formato YYYY-MM)
    """
    try:
        autorizacion = autorizacion_service.solicitar_autorizacion(
            arrendatario_id=current_user['id'],
            tipo=data.tipo,
            periodos=data.periodos_autorizados,
            nota=data.nota_solicitud
        )

        return autorizacion

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al solicitar autorización: {str(e)}"
        )


@router.post("/autorizar", response_model=AutorizacionResponse)
async def autorizar_directamente(
    data: AutorizacionDirectaCreate,
    current_user: Dict = Depends(get_current_user)
):
    """
    Propietario autoriza a arrendatario sin solicitud previa.

    El arrendatario recibirá un email notificándole la autorización.

    Requiere:
    - Ser propietario
    - El arrendatario debe pertenecer al mismo departamento
    - No debe existir autorización activa del mismo tipo
    """
    try:
        autorizacion = autorizacion_service.autorizar_directamente(
            propietario_id=current_user['id'],
            arrendatario_id=data.arrendatario_id,
            tipo=data.tipo,
            periodos=data.periodos_autorizados,
            nota=data.nota
        )

        return autorizacion

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al autorizar: {str(e)}"
        )


@router.post("/{autorizacion_id}/aprobar", response_model=AutorizacionResponse)
async def aprobar_solicitud(
    autorizacion_id: str,
    data: AutorizacionRespuesta,
    current_user: Dict = Depends(get_current_user)
):
    """
    Propietario aprueba una solicitud de autorización pendiente.

    El arrendatario recibirá un email notificándole la aprobación.

    Requiere:
    - Ser el propietario del departamento
    - La autorización debe estar en estado 'pendiente'
    """
    try:
        autorizacion = autorizacion_service.aprobar_solicitud(
            propietario_id=current_user['id'],
            autorizacion_id=autorizacion_id,
            nota=data.nota_respuesta
        )

        return autorizacion

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al aprobar solicitud: {str(e)}"
        )


@router.post("/{autorizacion_id}/rechazar", response_model=AutorizacionResponse)
async def rechazar_solicitud(
    autorizacion_id: str,
    data: AutorizacionRespuesta,
    current_user: Dict = Depends(get_current_user)
):
    """
    Propietario rechaza una solicitud de autorización pendiente.

    El arrendatario recibirá un email notificándole el rechazo.

    Requiere:
    - Ser el propietario del departamento
    - La autorización debe estar en estado 'pendiente'
    """
    try:
        autorizacion = autorizacion_service.rechazar_solicitud(
            propietario_id=current_user['id'],
            autorizacion_id=autorizacion_id,
            motivo=data.nota_respuesta
        )

        return autorizacion

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al rechazar solicitud: {str(e)}"
        )


@router.post("/{autorizacion_id}/revocar", response_model=AutorizacionResponse)
async def revocar_autorizacion(
    autorizacion_id: str,
    data: AutorizacionRevocacion,
    current_user: Dict = Depends(get_current_user)
):
    """
    Propietario revoca una autorización aprobada.

    El arrendatario recibirá un email notificándole la revocación.

    Requiere:
    - Ser el propietario del departamento
    - La autorización debe estar en estado 'aprobada'
    """
    try:
        autorizacion = autorizacion_service.revocar_autorizacion(
            propietario_id=current_user['id'],
            autorizacion_id=autorizacion_id,
            motivo=data.motivo
        )

        return autorizacion

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al revocar autorización: {str(e)}"
        )


@router.get("/departamento/{departamento_id}", response_model=List[AutorizacionResponse])
async def listar_autorizaciones_departamento(
    departamento_id: str,
    solo_activas: bool = False,
    current_user: Dict = Depends(get_current_user)
):
    """
    Lista todas las autorizaciones de un departamento.

    Query params:
    - solo_activas: Si true, solo retorna autorizaciones aprobadas

    Requiere:
    - Pertenecer al departamento O ser admin
    """
    try:
        # Verificar permiso
        es_admin = current_user.get('es_admin', False)
        depto_usuario = current_user.get('departamento_id')

        if not es_admin and depto_usuario != departamento_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver autorizaciones de este departamento"
            )

        autorizaciones = autorizacion_service.obtener_autorizaciones_departamento(
            departamento_id,
            solo_activas
        )

        return autorizaciones

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener autorizaciones: {str(e)}"
        )


@router.get("/pendientes", response_model=List[AutorizacionResponse])
async def listar_solicitudes_pendientes(
    current_user: Dict = Depends(get_current_user)
):
    """
    Lista solicitudes pendientes del propietario.

    Solo retorna solicitudes que requieren aprobación del usuario actual.

    Requiere:
    - Ser propietario
    """
    try:
        # Verificar que sea propietario
        if current_user.get('rol') != 'propietario':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los propietarios pueden ver solicitudes pendientes"
            )

        solicitudes = autorizacion_service.obtener_solicitudes_pendientes(
            current_user['id']
        )

        return solicitudes

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener solicitudes: {str(e)}"
        )


@router.get("/mis-autorizaciones", response_model=List[AutorizacionResponse])
async def listar_mis_autorizaciones(
    current_user: Dict = Depends(get_current_user)
):
    """
    Lista todas las autorizaciones del arrendatario actual.

    Incluye autorizaciones en todos los estados (pendiente, aprobada, rechazada, revocada).

    Requiere:
    - Ser arrendatario
    """
    try:
        # Verificar que sea arrendatario
        if current_user.get('rol') != 'arrendatario':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los arrendatarios pueden ver sus autorizaciones"
            )

        autorizaciones = autorizacion_service.obtener_mis_autorizaciones(
            current_user['id']
        )

        return autorizaciones

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener autorizaciones: {str(e)}"
        )


@router.get("/puede-pagar/{periodo}", response_model=PuedePagarResponse)
async def verificar_puede_pagar(
    periodo: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    Verifica si el usuario actual puede pagar un periodo específico.

    Params:
    - periodo: Periodo a verificar en formato YYYY-MM (ej: '2025-01')

    Retorna:
    - puede_pagar: bool
    - motivo: Explicación del resultado
    - autorizacion_id: ID de la autorización (si aplica)
    """
    try:
        resultado = autorizacion_service.puede_pagar(
            usuario_id=current_user['id'],
            departamento_id=current_user.get('departamento_id'),
            periodo=periodo
        )

        return resultado

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar autorización: {str(e)}"
        )

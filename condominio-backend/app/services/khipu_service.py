"""
Servicio de Khipu.

Este servicio maneja la integración con la API de Khipu
para crear solicitudes de pago y procesar notificaciones.
"""

import httpx
import hmac
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime
from app.config import settings


class KhipuService:
    """
    Servicio para interactuar con la API de Khipu.

    Maneja la creación de pagos, verificación de estados
    y procesamiento de notificaciones.
    """

    def __init__(self):
        """Inicializa el servicio con las credenciales de Khipu."""
        self.receiver_id = settings.khipu_receiver_id
        self.secret = settings.khipu_secret
        self.api_key = settings.khipu_api_key
        self.api_url = settings.khipu_api_url

    def crear_pago(
        self,
        monto: float,
        concepto: str,
        return_url: str,
        cancel_url: str,
        notify_url: str,
        pago_id: str,
        email_pagador: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Crea una solicitud de pago en Khipu.

        Args:
            monto: Monto a pagar en pesos chilenos
            concepto: Descripción del pago
            return_url: URL a la que Khipu redirige después del pago exitoso
            cancel_url: URL a la que Khipu redirige si el usuario cancela
            notify_url: URL donde Khipu enviará notificaciones
            pago_id: ID interno del pago para referencia
            email_pagador: Email del pagador (opcional)

        Returns:
            Diccionario con los datos del pago creado en Khipu:
            - payment_id: ID del pago en Khipu
            - payment_url: URL para que el usuario realice el pago
            - simplified_transfer_url: URL simplificada
            - transfer_url: URL de transferencia
            - app_url: URL para app móvil
            - ready_for_terminal: Si está listo para terminal

        Raises:
            Exception: Si hay error en la comunicación con Khipu
        """
        endpoint = f"{self.api_url}/payments"

        # Preparar datos del pago para API v3
        payload = {
            "subject": concepto,
            "amount": monto,  # API v3 acepta decimales
            "currency": "CLP",
            "transactionId": pago_id,  # Nota: camelCase en v3
            "returnUrl": return_url,
            "cancelUrl": cancel_url,
            "notifyUrl": notify_url,
        }

        # Agregar email si se proporciona
        if email_pagador:
            payload["payerEmail"] = email_pagador

        # Headers con autenticación mediante API Key (v3)
        headers = {
            "Content-Type": "application/json",  # v3 usa JSON
            "Accept": "application/json",
            "x-api-key": self.api_key
        }

        try:
            # Log para debugging
            print(f"🔍 Khipu Request (v3):")
            print(f"  Endpoint: {endpoint}")
            print(f"  API Key: {self.api_key[:8]}...")
            print(f"  Payload: {payload}")

            # Hacer solicitud POST a Khipu (v3 usa JSON)
            with httpx.Client() as client:
                response = client.post(
                    endpoint,
                    json=payload,  # Nota: json= en lugar de data=
                    headers=headers
                )

                print(f"📡 Khipu Response Status: {response.status_code}")
                print(f"📡 Khipu Response: {response.text}")

                response.raise_for_status()

                # Retornar respuesta de Khipu
                khipu_response = response.json()

                return {
                    "payment_id": khipu_response.get("payment_id"),
                    "payment_url": khipu_response.get("payment_url"),
                    "simplified_transfer_url": khipu_response.get("simplified_transfer_url"),
                    "transfer_url": khipu_response.get("transfer_url"),
                    "app_url": khipu_response.get("app_url"),
                    "ready_for_terminal": khipu_response.get("ready_for_terminal", False)
                }

        except httpx.HTTPStatusError as e:
            error_detail = e.response.text
            raise Exception(f"Error al crear pago en Khipu: {error_detail}")
        except Exception as e:
            raise Exception(f"Error inesperado al comunicarse con Khipu: {str(e)}")

    def verificar_pago(self, payment_id: str) -> Dict[str, Any]:
        """
        Verifica el estado de un pago en Khipu.

        Args:
            payment_id: ID del pago en Khipu

        Returns:
            Diccionario con información del pago:
            - payment_id: ID del pago
            - status: Estado del pago (pending, verifying, done, rejected)
            - amount: Monto pagado
            - currency: Moneda
            - subject: Concepto
            - transaction_id: ID interno del pago
            - payer_email: Email del pagador
            - payment_date: Fecha del pago

        Raises:
            Exception: Si hay error en la comunicación con Khipu
        """
        endpoint = f"{self.api_url}/payments/{payment_id}"

        headers = {
            "Accept": "application/json",
            "x-api-key": self.api_key
        }

        try:
            with httpx.Client() as client:
                response = client.get(
                    endpoint,
                    headers=headers
                )

                response.raise_for_status()

                khipu_data = response.json()

                return {
                    "payment_id": khipu_data.get("payment_id"),
                    "status": khipu_data.get("status"),
                    "amount": khipu_data.get("amount"),
                    "currency": khipu_data.get("currency"),
                    "subject": khipu_data.get("subject"),
                    "transaction_id": khipu_data.get("transaction_id"),
                    "payer_email": khipu_data.get("payer_email"),
                    "payment_date": khipu_data.get("payment_date")
                }

        except httpx.HTTPStatusError as e:
            error_detail = e.response.text
            raise Exception(f"Error al verificar pago en Khipu: {error_detail}")
        except Exception as e:
            raise Exception(f"Error inesperado al comunicarse con Khipu: {str(e)}")

    def validar_notificacion(
        self,
        notification_token: str,
        api_version: str = "1.3"
    ) -> Dict[str, Any]:
        """
        Valida y obtiene información de una notificación de Khipu.

        Cuando Khipu envía una notificación de pago completado,
        envía un notification_token que debemos validar.

        Args:
            notification_token: Token de notificación enviado por Khipu
            api_version: Versión de la API de notificación (default: 1.3)

        Returns:
            Diccionario con información del pago notificado

        Raises:
            Exception: Si hay error en la validación
        """
        endpoint = f"{self.api_url}/payments/{notification_token}"

        headers = {
            "Accept": "application/json",
            "x-api-key": self.api_key
        }

        try:
            with httpx.Client() as client:
                response = client.get(
                    endpoint,
                    headers=headers
                )

                response.raise_for_status()

                return response.json()

        except httpx.HTTPStatusError as e:
            error_detail = e.response.text
            raise Exception(f"Error al validar notificación de Khipu: {error_detail}")
        except Exception as e:
            raise Exception(f"Error inesperado al validar notificación: {str(e)}")

    def mapear_estado_khipu(self, khipu_status: str) -> str:
        """
        Mapea el estado de Khipu a nuestros estados internos.

        Estados de Khipu:
        - pending: Pago pendiente
        - verifying: Pago en verificación
        - done: Pago completado
        - rejected: Pago rechazado

        Nuestros estados:
        - pendiente: Sin pagar
        - verificando: En verificación
        - pagado: Pagado y confirmado
        - rechazado: Rechazado

        Args:
            khipu_status: Estado del pago en Khipu

        Returns:
            Estado mapeado a nuestro sistema
        """
        mapeo = {
            "pending": "pendiente",
            "verifying": "verificando",
            "done": "pagado",
            "rejected": "rechazado"
        }

        return mapeo.get(khipu_status, "pendiente")


# Instancia global del servicio
khipu_service = KhipuService()

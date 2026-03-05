"""
Servicio de envío de correos electrónicos
Utiliza Resend para enviar notificaciones
"""

import resend
import os
from datetime import datetime
from typing import Optional, List


class EmailService:
    """
    Servicio para enviar correos electrónicos usando Resend
    """

    def __init__(self):
        """Inicializa el servicio con la API key de Resend"""
        api_key = os.getenv("RESEND_API_KEY")
        if not api_key or api_key.startswith("re_xxx"):
            print("⚠️  ADVERTENCIA: RESEND_API_KEY no configurada. Los emails no se enviarán.")
            self.api_key = None
            return

        resend.api_key = api_key
        self.admin_email = os.getenv("ADMIN_EMAIL", "edificio.elmaiten@gmail.com")

    async def enviar_comprobante_pago(
        self,
        monto: float,
        nombre_pagador: str,
        fecha_transferencia: datetime,
        numero_departamento: str,
        periodo: str,
        metodo: str = "transferencia_manual"
    ) -> dict:
        """
        Envía un correo al administrador con los datos del comprobante de pago

        Args:
            monto: Monto pagado
            nombre_pagador: Nombre de quien realizó el pago
            fecha_transferencia: Fecha en que se realizó la transferencia
            numero_departamento: Número del departamento que realizó el pago
            periodo: Periodo del pago (ej: "2025-01")
            metodo: Método de pago (default: transferencia_manual)

        Returns:
            dict con la respuesta de Resend
        """
        # Si no hay API key configurada, retornar sin enviar
        if not self.api_key:
            return {"success": False, "message": "Email no configurado (modo desarrollo)"}

        # Formatear la fecha para mostrarla de forma legible
        fecha_str = fecha_transferencia.strftime("%d/%m/%Y %H:%M")

        # Crear el HTML del correo
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #2563eb; margin-top: 0;">📄 Nuevo Comprobante de Pago Recibido</h2>

                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-top: 20px;">
                        <h3 style="color: #1f2937; margin-top: 0;">Detalles del Pago</h3>

                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Departamento:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">{numero_departamento}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Periodo:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">{periodo}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Nombre del Pagador:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">{nombre_pagador}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Monto:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #16a34a; font-size: 18px; font-weight: bold;">${monto:,.0f} CLP</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Fecha de Transferencia:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">{fecha_str}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #4b5563;">Método de Pago:</td>
                                <td style="padding: 10px; color: #1f2937;">{metodo.replace('_', ' ').title()}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; color: #92400e;">
                            <strong>⚠️ Acción Requerida:</strong> Este pago está pendiente de verificación.
                            Por favor, revisa tu cuenta bancaria y confirma el pago en el sistema.
                        </p>
                    </div>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p>Este es un correo automático generado por el Sistema de Gestión de Gastos Comunes - Condominio El Maitén</p>
                    </div>
                </div>
            </body>
        </html>
        """

        # Crear el texto plano como alternativa
        text_content = f"""
        NUEVO COMPROBANTE DE PAGO RECIBIDO

        Detalles del Pago:
        ------------------
        Departamento: {numero_departamento}
        Periodo: {periodo}
        Nombre del Pagador: {nombre_pagador}
        Monto: ${monto:,.0f} CLP
        Fecha de Transferencia: {fecha_str}
        Método de Pago: {metodo.replace('_', ' ').title()}

        ACCIÓN REQUERIDA:
        Este pago está pendiente de verificación. Por favor, revisa tu cuenta bancaria
        y confirma el pago en el sistema.

        ---
        Sistema de Gestión de Gastos Comunes - Condominio El Maitén
        """

        try:
            # Enviar el correo usando Resend
            response = resend.Emails.send({
                "from": "Condominio El Maitén <onboarding@resend.dev>",
                "to": [self.admin_email],
                "subject": f"💰 Comprobante de Pago - Depto {numero_departamento} - {periodo}",
                "html": html_content,
                "text": text_content
            })

            return {
                "success": True,
                "message": "Correo enviado exitosamente",
                "email_id": response.get("id")
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error al enviar correo: {str(e)}",
                "email_id": None
            }

    async def enviar_confirmacion_pago(
        self,
        email_destinatario: str,
        nombre_destinatario: str,
        monto: float,
        periodo: str,
        numero_departamento: str
    ) -> dict:
        """
        Envía un correo de confirmación al usuario que realizó el pago

        Args:
            email_destinatario: Email del usuario
            nombre_destinatario: Nombre del usuario
            monto: Monto pagado
            periodo: Periodo del pago
            numero_departamento: Número del departamento

        Returns:
            dict con la respuesta de Resend
        """
        # Si no hay API key configurada, retornar sin enviar
        if not self.api_key:
            return {"success": False, "message": "Email no configurado (modo desarrollo)"}

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #16a34a; margin-top: 0;">✅ Comprobante de Pago Recibido</h2>

                    <p>Hola <strong>{nombre_destinatario}</strong>,</p>

                    <p>Hemos recibido tu comprobante de pago con los siguientes datos:</p>

                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-top: 20px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Departamento:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">{numero_departamento}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Periodo:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">{periodo}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #4b5563;">Monto:</td>
                                <td style="padding: 10px; color: #16a34a; font-size: 18px; font-weight: bold;">${monto:,.0f} CLP</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #2563eb;">
                        <p style="margin: 0; color: #1e40af;">
                            <strong>ℹ️ Próximos pasos:</strong> Tu pago está en proceso de verificación.
                            Te notificaremos una vez que sea confirmado por el administrador.
                        </p>
                    </div>

                    <p style="margin-top: 20px;">Si tienes alguna consulta, no dudes en contactarnos.</p>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p>Sistema de Gestión de Gastos Comunes - Condominio El Maitén</p>
                    </div>
                </div>
            </body>
        </html>
        """

        try:
            response = resend.Emails.send({
                "from": "Condominio El Maitén <onboarding@resend.dev>",
                "to": [email_destinatario],
                "subject": f"Comprobante de Pago Recibido - {periodo}",
                "html": html_content
            })

            return {
                "success": True,
                "message": "Correo de confirmación enviado",
                "email_id": response.get("id")
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error al enviar correo de confirmación: {str(e)}",
                "email_id": None
            }

    async def enviar_solicitud_autorizacion(
        self,
        email_propietario: str,
        nombre_propietario: str,
        nombre_arrendatario: str,
        tipo: str,
        periodos: Optional[List[str]],
        nota: str
    ) -> dict:
        """
        Notifica al propietario que recibió una solicitud de autorización.

        Args:
            email_propietario: Email del propietario
            nombre_propietario: Nombre del propietario
            nombre_arrendatario: Nombre del arrendatario que solicita
            tipo: 'permanente' o 'ocasional'
            periodos: Lista de periodos (si ocasional)
            nota: Mensaje del arrendatario

        Returns:
            dict con la respuesta de Resend
        """
        # Si no hay API key configurada, retornar sin enviar
        if not self.api_key:
            return {"success": False, "message": "Email no configurado (modo desarrollo)"}

        tipo_texto = "permanente (todos los periodos)" if tipo == "permanente" else f"ocasional ({', '.join(periodos)})"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #2563eb; margin-top: 0;">🔔 Nueva Solicitud de Autorización de Pago</h2>

                    <p>Hola <strong>{nombre_propietario}</strong>,</p>

                    <p><strong>{nombre_arrendatario}</strong> ha solicitado autorización para pagar gastos comunes.</p>

                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-top: 20px;">
                        <h3 style="color: #1f2937; margin-top: 0;">Detalles de la Solicitud</h3>

                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Tipo de Autorización:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">{tipo_texto}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #4b5563;">Mensaje:</td>
                                <td style="padding: 10px; color: #1f2937;">{nota}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #2563eb;">
                        <p style="margin: 0; color: #1e40af;">
                            <strong>ℹ️ Acción Requerida:</strong> Ingresa a la aplicación para aprobar o rechazar esta solicitud.
                        </p>
                    </div>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p>Sistema de Gestión de Gastos Comunes - Condominio El Maitén</p>
                    </div>
                </div>
            </body>
        </html>
        """

        try:
            response = resend.Emails.send({
                "from": "Condominio El Maitén <onboarding@resend.dev>",
                "to": [email_propietario],
                "subject": f"📨 Solicitud de Autorización de Pago - {nombre_arrendatario}",
                "html": html_content
            })

            return {
                "success": True,
                "message": "Email de solicitud enviado",
                "email_id": response.get("id")
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error al enviar email: {str(e)}",
                "email_id": None
            }

    async def enviar_autorizacion_aprobada(
        self,
        email_arrendatario: str,
        nombre_arrendatario: str,
        tipo: str,
        periodos: Optional[List[str]],
        nota_propietario: Optional[str]
    ) -> dict:
        """
        Notifica al arrendatario que su solicitud fue aprobada.

        Args:
            email_arrendatario: Email del arrendatario
            nombre_arrendatario: Nombre del arrendatario
            tipo: 'permanente' o 'ocasional'
            periodos: Lista de periodos (si ocasional)
            nota_propietario: Mensaje del propietario

        Returns:
            dict con la respuesta de Resend
        """
        # Si no hay API key configurada, retornar sin enviar
        if not self.api_key:
            return {"success": False, "message": "Email no configurado (modo desarrollo)"}

        tipo_texto = "permanente (todos los periodos)" if tipo == "permanente" else f"ocasional para los periodos: {', '.join(periodos)}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #16a34a; margin-top: 0;">✅ Autorización Aprobada</h2>

                    <p>Hola <strong>{nombre_arrendatario}</strong>,</p>

                    <p>¡Buenas noticias! Tu solicitud de autorización para pagar gastos comunes ha sido <strong>aprobada</strong>.</p>

                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-top: 20px;">
                        <h3 style="color: #1f2937; margin-top: 0;">Detalles de la Autorización</h3>

                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Tipo:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">{tipo_texto}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #4b5563;">Nota del Propietario:</td>
                                <td style="padding: 10px; color: #1f2937;">{nota_propietario or "Sin comentarios adicionales"}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color: #dcfce7; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #16a34a;">
                        <p style="margin: 0; color: #166534;">
                            <strong>✓ Ya puedes pagar:</strong> Ahora tienes permiso para realizar los pagos correspondientes.
                        </p>
                    </div>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p>Sistema de Gestión de Gastos Comunes - Condominio El Maitén</p>
                    </div>
                </div>
            </body>
        </html>
        """

        try:
            response = resend.Emails.send({
                "from": "Condominio El Maitén <onboarding@resend.dev>",
                "to": [email_arrendatario],
                "subject": "✅ Autorización de Pago Aprobada",
                "html": html_content
            })

            return {
                "success": True,
                "message": "Email de aprobación enviado",
                "email_id": response.get("id")
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error al enviar email: {str(e)}",
                "email_id": None
            }

    async def enviar_autorizacion_rechazada(
        self,
        email_arrendatario: str,
        nombre_arrendatario: str,
        motivo: str
    ) -> dict:
        """
        Notifica al arrendatario que su solicitud fue rechazada.

        Args:
            email_arrendatario: Email del arrendatario
            nombre_arrendatario: Nombre del arrendatario
            motivo: Razón del rechazo

        Returns:
            dict con la respuesta de Resend
        """
        # Si no hay API key configurada, retornar sin enviar
        if not self.api_key:
            return {"success": False, "message": "Email no configurado (modo desarrollo)"}

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #dc2626; margin-top: 0;">❌ Solicitud de Autorización Rechazada</h2>

                    <p>Hola <strong>{nombre_arrendatario}</strong>,</p>

                    <p>Tu solicitud de autorización para pagar gastos comunes ha sido rechazada.</p>

                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-top: 20px;">
                        <h3 style="color: #1f2937; margin-top: 0;">Motivo del Rechazo</h3>
                        <p style="color: #1f2937; margin: 0;">{motivo}</p>
                    </div>

                    <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #dc2626;">
                        <p style="margin: 0; color: #991b1b;">
                            <strong>ℹ️ Próximos pasos:</strong> Si tienes dudas, contacta al propietario para aclarar la situación.
                        </p>
                    </div>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p>Sistema de Gestión de Gastos Comunes - Condominio El Maitén</p>
                    </div>
                </div>
            </body>
        </html>
        """

        try:
            response = resend.Emails.send({
                "from": "Condominio El Maitén <onboarding@resend.dev>",
                "to": [email_arrendatario],
                "subject": "❌ Solicitud de Autorización Rechazada",
                "html": html_content
            })

            return {
                "success": True,
                "message": "Email de rechazo enviado",
                "email_id": response.get("id")
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error al enviar email: {str(e)}",
                "email_id": None
            }

    async def enviar_autorizacion_revocada(
        self,
        email_arrendatario: str,
        nombre_arrendatario: str,
        motivo: str
    ) -> dict:
        """
        Notifica al arrendatario que su autorización fue revocada.

        Args:
            email_arrendatario: Email del arrendatario
            nombre_arrendatario: Nombre del arrendatario
            motivo: Razón de la revocación

        Returns:
            dict con la respuesta de Resend
        """
        # Si no hay API key configurada, retornar sin enviar
        if not self.api_key:
            return {"success": False, "message": "Email no configurado (modo desarrollo)"}

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #ea580c; margin-top: 0;">⚠️ Autorización de Pago Revocada</h2>

                    <p>Hola <strong>{nombre_arrendatario}</strong>,</p>

                    <p>Tu autorización para pagar gastos comunes ha sido <strong>revocada</strong>.</p>

                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-top: 20px;">
                        <h3 style="color: #1f2937; margin-top: 0;">Motivo de la Revocación</h3>
                        <p style="color: #1f2937; margin: 0;">{motivo}</p>
                    </div>

                    <div style="background-color: #ffedd5; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #ea580c;">
                        <p style="margin: 0; color: #9a3412;">
                            <strong>⚠️ Importante:</strong> Ya no puedes realizar pagos. Si necesitas volver a pagar, debes solicitar una nueva autorización.
                        </p>
                    </div>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p>Sistema de Gestión de Gastos Comunes - Condominio El Maitén</p>
                    </div>
                </div>
            </body>
        </html>
        """

        try:
            response = resend.Emails.send({
                "from": "Condominio El Maitén <onboarding@resend.dev>",
                "to": [email_arrendatario],
                "subject": "⚠️ Autorización de Pago Revocada",
                "html": html_content
            })

            return {
                "success": True,
                "message": "Email de revocación enviado",
                "email_id": response.get("id")
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error al enviar email: {str(e)}",
                "email_id": None
            }

    async def enviar_autorizacion_directa(
        self,
        email_arrendatario: str,
        nombre_arrendatario: str,
        tipo: str,
        periodos: Optional[List[str]],
        nota_propietario: Optional[str]
    ) -> dict:
        """
        Notifica al arrendatario que el propietario lo autorizó proactivamente.

        Args:
            email_arrendatario: Email del arrendatario
            nombre_arrendatario: Nombre del arrendatario
            tipo: 'permanente' o 'ocasional'
            periodos: Lista de periodos (si ocasional)
            nota_propietario: Mensaje del propietario

        Returns:
            dict con la respuesta de Resend
        """
        # Si no hay API key configurada, retornar sin enviar
        if not self.api_key:
            return {"success": False, "message": "Email no configurado (modo desarrollo)"}

        tipo_texto = "permanente (todos los periodos)" if tipo == "permanente" else f"ocasional para los periodos: {', '.join(periodos)}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #2563eb; margin-top: 0;">🎉 Has Sido Autorizado para Pagar</h2>

                    <p>Hola <strong>{nombre_arrendatario}</strong>,</p>

                    <p>El propietario te ha autorizado para realizar pagos de gastos comunes.</p>

                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-top: 20px;">
                        <h3 style="color: #1f2937; margin-top: 0;">Detalles de la Autorización</h3>

                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Tipo:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">{tipo_texto}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #4b5563;">Nota del Propietario:</td>
                                <td style="padding: 10px; color: #1f2937;">{nota_propietario or "Sin comentarios adicionales"}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #2563eb;">
                        <p style="margin: 0; color: #1e40af;">
                            <strong>✓ Ya puedes pagar:</strong> Ahora tienes permiso para realizar los pagos correspondientes.
                        </p>
                    </div>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p>Sistema de Gestión de Gastos Comunes - Condominio El Maitén</p>
                    </div>
                </div>
            </body>
        </html>
        """

        try:
            response = resend.Emails.send({
                "from": "Condominio El Maitén <onboarding@resend.dev>",
                "to": [email_arrendatario],
                "subject": "🎉 Has Sido Autorizado para Pagar Gastos Comunes",
                "html": html_content
            })

            return {
                "success": True,
                "message": "Email de autorización directa enviado",
                "email_id": response.get("id")
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error al enviar email: {str(e)}",
                "email_id": None
            }

    async def enviar_recordatorio_pago(
        self,
        email_destinatario: str,
        nombre_destinatario: str,
        periodo: str,
        monto: float,
        numero_departamento: str
    ) -> dict:
        """
        Envía un recordatorio de pago pendiente.

        Args:
            email_destinatario: Email del usuario
            nombre_destinatario: Nombre del usuario
            periodo: Periodo adeudado
            monto: Monto pendiente
            numero_departamento: Número del departamento

        Returns:
            dict con la respuesta de Resend
        """
        if not self.api_key:
            return {"success": False, "message": "Email no configurado"}

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #d97706; margin-top: 0;">🔔 Recordatorio de Gasto Común</h2>

                    <p>Hola <strong>{nombre_destinatario}</strong>,</p>

                    <p>Te recordamos que tienes un gasto común pendiente de pago para el departamento <strong>{numero_departamento}</strong>.</p>

                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-top: 20px;">
                        <h3 style="color: #1f2937; margin-top: 0;">Detalles del Cobro</h3>

                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Periodo:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">{periodo}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #4b5563;">Monto Pendiente:</td>
                                <td style="padding: 10px; color: #dc2626; font-size: 18px; font-weight: bold;">${monto:,.0f} CLP</td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin-top: 20px; text-align: center;">
                        <a href="http://localhost:5173/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Ir a Pagar
                        </a>
                    </div>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p>Si ya realizaste el pago, por favor omite este mensaje.</p>
                        <p>Sistema de Gestión de Gastos Comunes - Condominio El Maitén</p>
                    </div>
                </div>
            </body>
        </html>
        """

        try:
            response = resend.Emails.send({
                "from": "Condominio El Maitén <onboarding@resend.dev>",
                "to": [email_destinatario],
                "subject": f"🔔 Recordatorio de Pago - {periodo}",
                "html": html_content
            })

            return {
                "success": True,
                "message": "Recordatorio enviado",
                "email_id": response.get("id")
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error al enviar recordatorio: {str(e)}",
                "email_id": None
            }


email_service = EmailService()

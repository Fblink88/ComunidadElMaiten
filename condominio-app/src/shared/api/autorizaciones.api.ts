/**
 * API de Autorizaciones de Pago
 *
 * Servicios para gestionar autorizaciones de arrendatarios para realizar pagos.
 */

import apiClient from './client'

export interface AutorizacionPago {
  id: string
  departamento_id: string
  propietario_id: string
  arrendatario_id: string
  tipo: 'permanente' | 'ocasional'
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'revocada'
  periodos_autorizados: string[]
  nota_solicitud?: string
  nota_respuesta?: string
  fue_solicitada: boolean
  fecha_creacion: string
  fecha_respuesta?: string
  fecha_revocacion?: string
}

export interface SolicitarAutorizacionData {
  tipo: 'permanente' | 'ocasional'
  periodos_autorizados?: string[]
  nota_solicitud?: string
}

export interface AutorizarDirectamenteData {
  arrendatario_id: string
  tipo: 'permanente' | 'ocasional'
  periodos_autorizados?: string[]
}

export interface ResponderSolicitudData {
  nota_respuesta?: string
}

/**
 * Arrendatario solicita autorización para pagar.
 */
export const solicitarAutorizacion = async (
  data: SolicitarAutorizacionData
): Promise<AutorizacionPago> => {
  const response = await apiClient.post<AutorizacionPago>('/api/autorizaciones/solicitar', data)
  return response.data
}

/**
 * Propietario autoriza directamente a un arrendatario.
 */
export const autorizarDirectamente = async (
  data: AutorizarDirectamenteData
): Promise<AutorizacionPago> => {
  const response = await apiClient.post<AutorizacionPago>('/api/autorizaciones/autorizar', data)
  return response.data
}

/**
 * Propietario aprueba una solicitud de autorización.
 */
export const aprobarSolicitud = async (
  id: string,
  data: ResponderSolicitudData
): Promise<AutorizacionPago> => {
  const response = await apiClient.post<AutorizacionPago>(
    `/api/autorizaciones/${id}/aprobar`,
    data
  )
  return response.data
}

/**
 * Propietario rechaza una solicitud de autorización.
 */
export const rechazarSolicitud = async (
  id: string,
  data: ResponderSolicitudData
): Promise<AutorizacionPago> => {
  const response = await apiClient.post<AutorizacionPago>(
    `/api/autorizaciones/${id}/rechazar`,
    data
  )
  return response.data
}

/**
 * Propietario revoca una autorización previamente aprobada.
 */
export const revocarAutorizacion = async (
  id: string,
  data: ResponderSolicitudData
): Promise<AutorizacionPago> => {
  const response = await apiClient.post<AutorizacionPago>(
    `/api/autorizaciones/${id}/revocar`,
    data
  )
  return response.data
}

/**
 * Obtiene autorizaciones de un departamento.
 */
export const getAutorizacionesByDepartamento = async (
  departamentoId: string
): Promise<AutorizacionPago[]> => {
  const response = await apiClient.get<AutorizacionPago[]>(
    `/api/autorizaciones/departamento/${departamentoId}`
  )
  return response.data
}

/**
 * Obtiene solicitudes pendientes de un propietario.
 */
export const getSolicitudesPendientes = async (): Promise<AutorizacionPago[]> => {
  const response = await apiClient.get<AutorizacionPago[]>('/api/autorizaciones/pendientes')
  return response.data
}

/**
 * Obtiene las autorizaciones de un arrendatario.
 */
export const getMisAutorizaciones = async (): Promise<AutorizacionPago[]> => {
  const response = await apiClient.get<AutorizacionPago[]>('/api/autorizaciones/mis-autorizaciones')
  return response.data
}

/**
 * Verifica si un arrendatario puede pagar un periodo específico.
 */
export const puedePagar = async (periodo: string): Promise<{ puede_pagar: boolean }> => {
  const response = await apiClient.get<{ puede_pagar: boolean }>(
    `/api/autorizaciones/puede-pagar/${periodo}`
  )
  return response.data
}

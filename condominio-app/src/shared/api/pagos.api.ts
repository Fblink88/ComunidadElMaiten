/**
 * API de Pagos
 *
 * Servicios para gestionar pagos de gastos comunes.
 */

import apiClient from './client'

import type {
  Pago,
  PagoCreate,
  ComprobanteCreate,
  Transaccion
} from '../types'

export interface VerificarPagoData {
  aprobar: boolean
  notas?: string
}

/**
 * Crea un nuevo pago.
 */
export const createPago = async (data: PagoCreate): Promise<Pago> => {
  const response = await apiClient.post<Pago>('/api/pagos', data)
  return response.data
}

/**
 * Envía un comprobante de pago manual (Abono Billetera Virtual).
 */
export const enviarComprobante = async (data: ComprobanteCreate): Promise<Pago> => {
  const response = await apiClient.post<Pago>('/api/pagos/comprobante', data)
  return response.data
}

/**
 * Obtiene los pagos del usuario autenticado.
 */
export const getMisPagos = async (): Promise<Pago[]> => {
  const response = await apiClient.get<Pago[]>('/api/pagos/mis-pagos')
  return response.data
}

/**
 * Obtiene todos los pagos (solo admin).
 */
export const getAllPagos = async (limit: number = 1000): Promise<Pago[]> => {
  const response = await apiClient.get<Pago[]>(`/api/pagos?limit=${limit}`)
  return response.data
}

/**
 * Obtiene pagos pendientes de verificación (solo admin).
 */
export const getPagosPendientes = async (): Promise<Pago[]> => {
  const response = await apiClient.get<Pago[]>('/api/pagos/pendientes')
  return response.data
}

/**
 * Obtiene pagos de un periodo específico (solo admin).
 */
export const getPagosByPeriodo = async (periodo: string): Promise<Pago[]> => {
  const response = await apiClient.get<Pago[]>(`/api/pagos/periodo/${periodo}`)
  return response.data
}

/**
 * Obtiene pagos de un departamento.
 */
export const getPagosByDepartamento = async (departamentoId: string): Promise<Pago[]> => {
  const response = await apiClient.get<Pago[]>(`/api/pagos/departamento/${departamentoId}`)
  return response.data
}

/**
 * Obtiene un pago por ID.
 */
export const getPago = async (id: string): Promise<Pago> => {
  const response = await apiClient.get<Pago>(`/api/pagos/${id}`)
  return response.data
}

/**
 * Verifica un pago manual (aprobar o rechazar) - solo admin.
 */
export const verificarPago = async (id: string, data: VerificarPagoData): Promise<Pago> => {
  const response = await apiClient.post<Pago>(`/api/pagos/${id}/verificar`, data)
  return response.data
}

/**
 * Inicia una carga de saldo (abono a billetera virtual) con Khipu.
 */
export const iniciarPagoOnline = async (departamentoId: string, monto: number): Promise<{ payment_url: string }> => {
  const response = await apiClient.post<{ payment_url: string }>('/api/pagos/iniciar-pago-online', {
    departamento_id: departamentoId,
    monto
  })
  return response.data
}

/**
 * Obtiene el historial de abonos/transacciones de la billetera virtual del usuario.
 */
export const getMisTransacciones = async (): Promise<Transaccion[]> => {
  const response = await apiClient.get<Transaccion[]>('/api/pagos/mis-transacciones')
  return response.data
}

/**
 * Obtiene todas las transacciones históricas (solo admin).
 */
export const getAllTransacciones = async (limit: number = 500): Promise<Transaccion[]> => {
  const response = await apiClient.get<Transaccion[]>(`/api/pagos/transacciones?limit=${limit}`)
  return response.data
}

/**
 * Obtiene el historial de transacciones de un departamento específico.
 */
export const getTransaccionesByDepartamento = async (departamentoId: string): Promise<Transaccion[]> => {
  const response = await apiClient.get<Transaccion[]>(`/api/pagos/transacciones/departamento/${departamentoId}`)
  return response.data
}

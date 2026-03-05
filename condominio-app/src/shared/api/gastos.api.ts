/**
 * API de Gastos
 *
 * Servicios para gestionar gastos mensuales y extraordinarios.
 */

import apiClient from './client'

export interface ItemGasto {
  concepto: string
  monto: number
}

export interface GastoMensual {
  id: string
  periodo: string
  items: ItemGasto[]
  total: number
  valor_por_m2: number
  total_cobrado?: number
  saldo_mes?: number
  created_at: string
}

export interface GastoMensualCreate {
  periodo: string
  items: ItemGasto[]
}

export interface GastoExtraordinario {
  id: string
  concepto: string
  monto_total: number
  monto_por_depto: number
  fecha: string
  pagos: Record<string, boolean>
  created_at: string
}

export interface GastoExtraordinarioCreate {
  concepto: string
  monto_total: number
  monto_por_depto: number
}

/**
 * Crea un gasto mensual (solo admin).
 */
export const createGastoMensual = async (data: GastoMensualCreate): Promise<GastoMensual> => {
  const response = await apiClient.post<GastoMensual>('/api/gastos/mensuales', data)
  return response.data
}

/**
 * Obtiene todos los gastos mensuales.
 */
export const getGastosMensuales = async (cantidad?: number): Promise<GastoMensual[]> => {
  const params = cantidad ? { cantidad } : undefined
  const response = await apiClient.get<GastoMensual[]>('/api/gastos/mensuales', { params })
  return response.data
}

/**
 * Obtiene un gasto mensual por periodo.
 */
export const getGastoMensualByPeriodo = async (periodo: string): Promise<GastoMensual> => {
  const response = await apiClient.get<GastoMensual>(`/api/gastos/mensuales/${periodo}`)
  return response.data
}

/**
 * Actualiza un gasto mensual (solo admin).
 */
export const updateGastoMensual = async (
  periodo: string,
  data: Partial<GastoMensualCreate>
): Promise<GastoMensual> => {
  const response = await apiClient.put<GastoMensual>(`/api/gastos/mensuales/${periodo}`, data)
  return response.data
}

/**
 * Crea un gasto extraordinario (solo admin).
 */
export const createGastoExtraordinario = async (
  data: GastoExtraordinarioCreate
): Promise<GastoExtraordinario> => {
  const response = await apiClient.post<GastoExtraordinario>('/api/gastos/extraordinarios', data)
  return response.data
}

/**
 * Obtiene todos los gastos extraordinarios.
 */
export const getGastosExtraordinarios = async (): Promise<GastoExtraordinario[]> => {
  const response = await apiClient.get<GastoExtraordinario[]>('/api/gastos/extraordinarios')
  return response.data
}

/**
 * Obtiene un gasto extraordinario por ID.
 */
export const getGastoExtraordinario = async (id: string): Promise<GastoExtraordinario> => {
  const response = await apiClient.get<GastoExtraordinario>(`/api/gastos/extraordinarios/${id}`)
  return response.data
}

/**
 * Marca como pagado un gasto extraordinario para un departamento (solo admin).
 */
export const marcarPagoExtraordinario = async (
  id: string,
  departamentoId: string
): Promise<GastoExtraordinario> => {
  const response = await apiClient.post<GastoExtraordinario>(
    `/api/gastos/extraordinarios/${id}/pagar/${departamentoId}`
  )
  return response.data
}

/**
 * Genera o actualiza los pagos proyectados para los próximos 12 meses (solo admin).
 */
export const proyectarGastosAnuales = async (): Promise<{ mensaje: string; creados: number; actualizados: number }> => {
  const response = await apiClient.post('/api/gastos/proyectar-anual')
  return response.data
}

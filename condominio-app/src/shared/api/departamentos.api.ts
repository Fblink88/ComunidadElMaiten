/**
 * API de Departamentos
 *
 * Servicios para gestionar departamentos del condominio.
 */

import apiClient from './client'

export interface Departamento {
  id: string
  numero: string
  propietario: string
  metros_cuadrados: number
  cuota_mensual: number
  saldo_a_favor: number
  activo: boolean
  usuarios_ids: string[]
  created_at: string
  updated_at: string
}

export interface DepartamentoCreate {
  numero: string
  propietario: string
  metros_cuadrados: number
  cuota_mensual?: number
}

export interface DepartamentoUpdate {
  numero?: string
  propietario?: string
  metros_cuadrados?: number
  cuota_mensual?: number
  activo?: boolean
}

/**
 * Obtiene todos los departamentos.
 */
export const getDepartamentos = async (): Promise<Departamento[]> => {
  const response = await apiClient.get<Departamento[]>('/api/departamentos')
  return response.data
}

/**
 * Obtiene solo los departamentos activos.
 */
export const getDepartamentosActivos = async (): Promise<Departamento[]> => {
  const response = await apiClient.get<Departamento[]>('/api/departamentos/activos')
  return response.data
}

/**
 * Obtiene un departamento por ID.
 */
export const getDepartamento = async (id: string): Promise<Departamento> => {
  const response = await apiClient.get<Departamento>(`/api/departamentos/${id}`)
  return response.data
}

/**
 * Crea un nuevo departamento (solo admin).
 */
export const createDepartamento = async (data: DepartamentoCreate): Promise<Departamento> => {
  const response = await apiClient.post<Departamento>('/api/departamentos', data)
  return response.data
}

/**
 * Actualiza un departamento existente (solo admin).
 */
export const updateDepartamento = async (
  id: string,
  data: DepartamentoUpdate
): Promise<Departamento> => {
  const response = await apiClient.put<Departamento>(`/api/departamentos/${id}`, data)
  return response.data
}

/**
 * Elimina un departamento (solo admin).
 */
export const deleteDepartamento = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/departamentos/${id}`)
}

/**
 * Agrega un usuario a un departamento.
 */
export const addUsuarioToDepartamento = async (
  departamentoId: string,
  usuarioId: string
): Promise<void> => {
  await apiClient.post(`/api/departamentos/${departamentoId}/usuarios/${usuarioId}`)
}

/**
 * Remueve un usuario de un departamento.
 */
export const removeUsuarioFromDepartamento = async (
  departamentoId: string,
  usuarioId: string
): Promise<void> => {
  await apiClient.delete(`/api/departamentos/${departamentoId}/usuarios/${usuarioId}`)
}

/**
 * Aplica un aumento porcentual a todos los departamentos.
 */
export const aplicarAumentoMasivo = async (
  porcentaje: number,
  periodoInicio: string
): Promise<{ mensaje: string; actualizados: number; proyectados_actualizados?: number }> => {
  const response = await apiClient.post('/api/departamentos/aumento-masivo', {
    porcentaje,
    periodo_inicio: periodoInicio
  })
  return response.data
}

/**
 * Movimiento de Billetera Virtual
 */
export interface BilleteraMovimiento {
  id: string
  departamento_id: string
  monto_cambio: number
  saldo_resultante: number
  motivo: string
  usuario_admin_id?: string
  fecha: string
}

/**
 * Ajusta el saldo a favor de un departamento en la billetera virtual.
 */
export const ajustarSaldoBilletera = async (
  departamentoId: string,
  monto: number,
  motivo: string
): Promise<BilleteraMovimiento> => {
  const response = await apiClient.post<BilleteraMovimiento>(`/api/departamentos/${departamentoId}/billetera/ajustar`, {
    monto,
    motivo
  })
  return response.data
}

/**
 * Obtiene el historial de movimientos de la billetera virtual de un departamento.
 */
export const getHistorialBilletera = async (
  departamentoId: string
): Promise<BilleteraMovimiento[]> => {
  const response = await apiClient.get<BilleteraMovimiento[]>(`/api/departamentos/${departamentoId}/billetera/movimientos`)
  return response.data
}

/**
 * Obtiene todos los movimientos de la billetera virtual de todos los departamentos.
 * Útil para la vista global de ingresos/egresos del admin.
 */
export const getGlobalHistorialBilletera = async (): Promise<BilleteraMovimiento[]> => {
  const response = await apiClient.get<BilleteraMovimiento[]>('/api/departamentos/billetera/movimientos/todos')
  return response.data
}

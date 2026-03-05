/**
 * API de Dashboard Financiero
 */

import apiClient from './client'

export interface ResumenFinanciero {
    total_recaudado: number
    total_gastos: number
    balance_actual: number
    morosidad_total: number
}

/**
 * Obtiene el resumen financiero global.
 */
export const getResumenFinanciero = async (): Promise<ResumenFinanciero> => {
    const response = await apiClient.get<ResumenFinanciero>('/api/dashboard/resumen-financiero')
    return response.data
}

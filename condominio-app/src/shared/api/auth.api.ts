/**
 * API de Autenticación
 *
 * Servicios para verificar el usuario autenticado y validar tokens.
 */

import apiClient from './client'
import type { Usuario } from '../types'

/**
 * Obtiene los datos del usuario autenticado actual.
 */
export const getCurrentUser = async (): Promise<Usuario> => {
  const response = await apiClient.get<Usuario>('/api/auth/me')
  return response.data
}

/**
 * Verifica si el token es válido.
 */
export const verifyToken = async (): Promise<boolean> => {
  try {
    await apiClient.get('/api/auth/verificar')
    return true
  } catch {
    return false
  }
}

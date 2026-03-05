/**
 * API Client
 *
 * Cliente centralizado para todas las llamadas HTTP al backend.
 * Usa axios con interceptores para:
 * - Agregar automáticamente el token de autenticación
 * - Manejar errores de forma centralizada
 * - Logging de requests en desarrollo
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { auth } from '../config/firebase'

/**
 * URL base del API backend.
 * En desarrollo usa localhost, en producción usará la variable de entorno.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/**
 * Instancia de axios configurada para el backend.
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
})

/**
 * Interceptor de request: agrega el token de autenticación automáticamente.
 *
 * Si el usuario está autenticado en Firebase, obtiene el token
 * y lo agrega al header Authorization de todas las requests.
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Obtener usuario actual de Firebase
      const user = auth.currentUser

      if (user) {
        // Obtener token actualizado
        const token = await user.getIdToken()

        // Agregar token al header
        config.headers.Authorization = `Bearer ${token}`
      }

      // Log en desarrollo
      if (import.meta.env.DEV) {
        console.log(`🔵 ${config.method?.toUpperCase()} ${config.url}`)
      }
    } catch (error) {
      console.error('Error obteniendo token:', error)
    }

    return config
  },
  (error) => {
    console.error('Error en request interceptor:', error)
    return Promise.reject(error)
  }
)

/**
 * Interceptor de response: maneja errores de forma centralizada.
 *
 * Captura errores comunes como:
 * - 401 Unauthorized: sesión expirada
 * - 403 Forbidden: sin permisos
 * - 500 Server Error: error del servidor
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log en desarrollo
    if (import.meta.env.DEV) {
      console.log(`🟢 ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`)
    }
    return response
  },
  (error: AxiosError) => {
    // Log de errores
    if (import.meta.env.DEV) {
      console.error(`🔴 ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`)
      console.error('Error details:', error.response?.data)
    }

    // Manejar errores específicos
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error('⚠️ Sesión expirada. Por favor inicia sesión nuevamente.')
          // Aquí podrías agregar lógica para logout automático
          break
        case 403:
          console.error('⚠️ No tienes permisos para realizar esta acción.')
          break
        case 404:
          console.error('⚠️ Recurso no encontrado.')
          break
        case 500:
          console.error('⚠️ Error del servidor. Intenta nuevamente más tarde.')
          break
      }
    } else if (error.request) {
      console.error('⚠️ No se pudo conectar con el servidor. Verifica tu conexión.')
    }

    return Promise.reject(error)
  }
)

/**
 * Tipos de error personalizados para mejor manejo en los componentes.
 */
export interface ApiError {
  message: string
  status?: number
  data?: unknown
}

/**
 * Helper para extraer mensaje de error de la respuesta del backend.
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; message?: string }>
    return (
      axiosError.response?.data?.detail ||
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Error desconocido'
    )
  }
  return 'Error desconocido'
}

export default apiClient

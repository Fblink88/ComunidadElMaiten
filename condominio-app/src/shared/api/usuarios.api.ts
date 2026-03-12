/**
 * API de Usuarios
 *
 * Servicios para gestionar usuarios del sistema.
 */

import apiClient from './client'
import type { Usuario } from '../types'

export interface UsuarioUpdate {
  nombre?: string
  email?: string
  departamento_id?: string | null
}

export interface CambiarRolData {
  nuevo_rol: 'admin' | 'propietario' | 'arrendatario'
}

/**
 * Obtiene todos los usuarios (solo admin).
 */
export const getUsuarios = async (): Promise<Usuario[]> => {
  const response = await apiClient.get<Usuario[]>('/api/usuarios')
  return response.data
}

/**
 * Obtiene usuarios de un departamento específico.
 */
export const getUsuariosByDepartamento = async (departamentoId: string): Promise<Usuario[]> => {
  const response = await apiClient.get<Usuario[]>(`/api/usuarios/departamento/${departamentoId}`)
  return response.data
}

/**
 * Obtiene un usuario por ID.
 */
export const getUsuario = async (id: string): Promise<Usuario> => {
  const response = await apiClient.get<Usuario>(`/api/usuarios/${id}`)
  return response.data
}

/**
 * Actualiza un usuario.
 */
export const updateUsuario = async (id: string, data: UsuarioUpdate): Promise<Usuario> => {
  const response = await apiClient.put<Usuario>(`/api/usuarios/${id}`, data)
  return response.data
}

/**
 * Elimina un usuario (solo admin).
 */
export const deleteUsuario = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/usuarios/${id}`)
}

/**
 * Cambia el rol de un usuario (solo admin).
 */
export const cambiarRolUsuario = async (id: string, data: CambiarRolData): Promise<Usuario> => {
  const response = await apiClient.patch<Usuario>(`/api/usuarios/${id}/rol`, data)
  return response.data
}

/**
 * Aprueba o desactiva un usuario (solo admin).
 */
export const aprobarUsuario = async (id: string, activo: boolean): Promise<Usuario> => {
  const response = await apiClient.post<Usuario>(`/api/usuarios/${id}/aprobar?activo=${activo}`)
  return response.data
}

/**
 * Aprueba un registro pendiente: asigna departamento y activa la cuenta.
 * Puede usarlo el admin (cualquier usuario) o el propietario (solo su depto).
 */
export const aprobarRegistro = async (uid: string, departamento_id: string): Promise<Usuario> => {
  const response = await apiClient.post<Usuario>(`/api/usuarios/${uid}/aprobar-registro`, { departamento_id })
  return response.data
}

/**
 * Rechaza un registro pendiente y elimina el usuario.
 */
export const rechazarRegistro = async (uid: string): Promise<void> => {
  await apiClient.delete(`/api/usuarios/${uid}/rechazar-registro`)
}

/**
 * Obtiene todos los usuarios con estado pendiente_aprobacion.
 */
export const getUsuariosPendientes = async (): Promise<Usuario[]> => {
  const response = await apiClient.get<Usuario[]>('/api/usuarios/pendientes')
  return response.data
}

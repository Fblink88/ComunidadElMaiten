/**
 * Componente ProtectedRoute
 * 
 * Este archivo contiene el componente que protege rutas privadas.
 * Sirve para redirigir a login si el usuario no está autenticado.
 * 
 * Uso:
 * - Envolver rutas que requieren autenticación
 * - Opcionalmente, restringir a solo administradores
 */

import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "@/app/providers"

/**
 * Props del componente ProtectedRoute.
 */
interface ProtectedRouteProps {
  /** Contenido a mostrar si el usuario está autenticado */
  children: ReactNode
  /** Si es true, solo permite acceso a administradores */
  adminOnly?: boolean
  /** Si es true, permite acceso aunque el usuario no esté activo */
  allowInactive?: boolean
}

/**
 * Componente que protege rutas privadas.
 * 
 * @example
 * // Ruta protegida para cualquier usuario autenticado
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * 
 * @example
 * // Ruta protegida solo para administradores
 * <ProtectedRoute adminOnly>
 *   <AdminPage />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({ children, adminOnly = false, allowInactive = false }: ProtectedRouteProps) => {
  const { usuario, firebaseUser } = useAuth()

  /**
   * Si no hay firebaseUser, redirige a login.
   */
  if (!firebaseUser) {
    return <Navigate to="/login" replace />
  }

  // Si requiere usuario cargado y no está (o no está activo)
  if (!usuario && !allowInactive) {
    // Retornamos null temporalmente mientras carga o Navigate a pending, 
    // pero AppRouter ya maneja la lógica base. 
    return <Navigate to="/pending-approval" replace />
  }

  /**
   * Si la ruta es solo para admin y el usuario no es admin, redirige al dashboard.
   */
  if (adminOnly && !(usuario?.es_admin || usuario?.esAdmin || firebaseUser.email === "edificio.elmaiten@gmail.com")) {
    return <Navigate to="/dashboard" replace />
  }

  /**
   * Si pasa las validaciones, muestra el contenido.
   */
  return <>{children}</>
}
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
export const ProtectedRoute = ({ children, allowInactive = false }: ProtectedRouteProps) => {
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

  // Si el usuario está cargado pero su cuenta está pendiente de aprobación (y no es admin)
  if (usuario && usuario.estado_cuenta === "pendiente_aprobacion" && !allowInactive && !(usuario.es_admin || usuario.esAdmin)) {
    return <Navigate to="/pending-approval" replace />
  }

  /**
   * Si pasa las validaciones, muestra el contenido.
   */
  return <>{children}</>
}

/**
 * Componente RequireRole
 * Permite acceso a la ruta solo si el rol del usuario actual coincide con al menos uno de los roles definidos.
 */
export const RequireRole = ({
  children,
  roles,
}: {
  children: ReactNode
  roles: Array<"admin" | "propietario" | "arrendatario" | "vecino">
}) => {
  const { usuario } = useAuth()

  // Si el usuario no está cargado, no mostramos nada aún (o redirigimos, manejado por ProtectedRoute)
  if (!usuario) {
    return null
  }

  // Admin global puede saltarse esta restricción si queremos, pero por ahora lo dejamos estricto a los roles pasados
  if (!roles.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
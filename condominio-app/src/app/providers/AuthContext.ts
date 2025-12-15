/**
 * Contexto de Autenticación
 * 
 * Este archivo contiene la definición del contexto y el hook useAuth.
 * Está separado del AuthProvider para cumplir con las reglas de Fast Refresh
 * de Vite, que requiere que los archivos solo exporten componentes O funciones,
 * pero no ambos.
 */

import { createContext, useContext } from "react"
import type { User } from "firebase/auth"
import type { Usuario } from "@/shared/types"

/**
 * Tipo del contexto de autenticación.
 * Define qué valores y funciones estarán disponibles.
 */
export interface AuthContextType {
  /** Usuario de Firebase Auth (null si no está logueado) */
  firebaseUser: User | null
  /** Datos del usuario desde Firestore (null si no está logueado) */
  usuario: Usuario | null
  /** Indica si se está verificando la sesión inicial */
  loading: boolean
  /** Función para iniciar sesión con email y contraseña */
  login: (email: string, password: string) => Promise<void>
  /** Función para registrar un nuevo usuario */
  register: (email: string, password: string, nombre: string) => Promise<void>
  /** Función para iniciar sesión con Google */
  loginWithGoogle: () => Promise<void>
  /** Función para cerrar sesión */
  logout: () => Promise<void>
}

/**
 * Contexto de autenticación.
 * Se inicializa como undefined y se verifica en el hook useAuth.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Hook personalizado para acceder al contexto de autenticación.
 * 
 * @example
 * const { usuario, login, logout } = useAuth()
 * 
 * @throws Error si se usa fuera del AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  
  return context
}
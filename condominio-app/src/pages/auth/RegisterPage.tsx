/**
 * Página de Registro
 * 
 * Este archivo contiene la página completa de registro de usuarios.
 * Sirve como contenedor que incluye el layout y el formulario de registro.
 * 
 * Si el usuario ya está autenticado, redirige automáticamente al dashboard.
 */

import { Navigate, Link } from "react-router-dom"
import { RegisterForm } from "@/features/auth"
import { Card } from "@/shared/ui"
import { APP_NAME } from "@/shared/config/constants"
import { useAuth } from "@/app/providers"

/**
 * Página de registro de nuevos usuarios.
 * Muestra el formulario de registro centrado en pantalla.
 */
export const RegisterPage = () => {
  const { usuario } = useAuth()

  /**
   * Si ya hay un usuario autenticado, redirige al dashboard o admin.
   */
  if (usuario) {
    if (usuario.esAdmin) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{APP_NAME}</h1>
          <p className="text-gray-600 mt-2">Crea tu cuenta</p>
        </div>

        {/* Card con el formulario */}
        <Card>
          <RegisterForm />

          {/* Link a login */}
          <p className="text-center text-sm text-gray-600 mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
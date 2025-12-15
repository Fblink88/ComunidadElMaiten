/**
 * Componente Header
 * 
 * Este archivo contiene el encabezado superior de la aplicación.
 * Sirve para mostrar información del usuario actual y el botón de cerrar sesión.
 */

import { LogOut, User } from "lucide-react"
import { useAuth } from "@/app/providers"
import { Badge } from "@/shared/ui"

/**
 * Componente Header.
 * Muestra el nombre del usuario, su rol y el botón de logout.
 */
export const Header = () => {
  const { usuario, logout } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Título de la sección actual (se puede mejorar después) */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          {usuario?.esAdmin ? "Panel de Administración" : "Mi Cuenta"}
        </h2>
      </div>

      {/* Info del usuario y logout */}
      <div className="flex items-center gap-4">
        {/* Información del usuario */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={20} className="text-gray-600" />
          </div>

          {/* Nombre y rol */}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800">
              {usuario?.nombre}
            </p>
            <Badge variant={usuario?.esAdmin ? "info" : "default"} size="sm">
              {usuario?.esAdmin ? "Admin" : "Vecino"}
            </Badge>
          </div>
        </div>

        {/* Botón de logout */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={20} />
          <span className="hidden sm:inline text-sm">Salir</span>
        </button>
      </div>
    </header>
  )
}
/**
 * Componente Sidebar
 * 
 * Este archivo contiene el menú lateral de navegación.
 * Sirve para mostrar los enlaces de navegación según el rol del usuario.
 * 
 * - Vecinos: Dashboard, Mis Pagos, Historial, Contacto
 * - Admin: Dashboard, Departamentos, Usuarios, Pagos, Gastos, Reportes
 */

import { NavLink } from "react-router-dom"
import {
  Home,
  CreditCard,
  History,
  Mail,
  Building2,
  Users,
  Receipt,
  BarChart3,
  Shield,
  UserRound
} from "lucide-react"
import { useAuth } from "@/app/providers"
import { APP_NAME } from "@/shared/config/constants"

/**
 * Tipo para los items del menú.
 */
interface MenuItem {
  /** Texto a mostrar */
  label: string
  /** Ruta de navegación */
  path: string
  /** Ícono del item */
  icon: React.ReactNode
}

const adminMenuItems: MenuItem[] = [
  { label: "Dashboard", path: "/admin", icon: <Home size={20} /> },
  { label: "Mi Perfil", path: "/admin/perfil", icon: <UserRound size={20} /> },
  { label: "Departamentos", path: "/admin/departamentos", icon: <Building2 size={20} /> },
  { label: "Usuarios", path: "/admin/usuarios", icon: <Users size={20} /> },
  { label: "Pagos", path: "/admin/pagos", icon: <CreditCard size={20} /> },
  { label: "Gastos", path: "/admin/gastos", icon: <Receipt size={20} /> },
  { label: "Reportes", path: "/admin/reporte-financiero", icon: <BarChart3 size={20} /> },
]

/**
 * Componente Sidebar.
 * Muestra el menú de navegación lateral según el rol del usuario.
 */
export const Sidebar = () => {
  const { usuario, firebaseUser } = useAuth()

  /** Construye items del menú según el rol específico */
  const getMenuItems = (): MenuItem[] => {
    // Hotfix: Check by email if profile failed to load
    if (usuario?.es_admin || usuario?.esAdmin || firebaseUser?.email === "edificio.elmaiten@gmail.com") {
      return adminMenuItems
    }

    // Menú base para vecinos
    const vecinoItems: MenuItem[] = [
      { label: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    ]

    // Agregar autorizaciones según el tipo de vecino
    if (usuario?.rol === "propietario") {
      vecinoItems.push({
        label: "Mi Departamento",
        path: "/dashboard/mi-departamento",
        icon: <Users size={20} />
      })
      vecinoItems.push({
        label: "Mis Autorizaciones",
        path: "/dashboard/mis-autorizaciones",
        icon: <Shield size={20} />
      })
    } else if (usuario?.rol === "arrendatario") {
      vecinoItems.push({
        label: "Autorizaciones",
        path: "/dashboard/autorizaciones",
        icon: <Shield size={20} />
      })
    }

    // Agregar items comunes
    vecinoItems.push(
      { label: "Pagar", path: "/dashboard/pagos", icon: <CreditCard size={20} /> },
      { label: "Historial", path: "/dashboard/historial", icon: <History size={20} /> },
      { label: "Contacto", path: "/dashboard/contacto", icon: <Mail size={20} /> }
    )

    return vecinoItems
  }

  const menuItems = getMenuItems()

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col flex-shrink-0">
      {/* Logo / Nombre de la app */}
      <div className="p-6 border-b border-gray-800 flex justify-between items-center">
        <h1 className="text-xl font-bold">{APP_NAME}</h1>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/admin" || item.path === "/dashboard"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer del sidebar */}
      <div className="p-4 border-t border-gray-800 bg-gray-900 mt-auto">
        <p className="text-xs text-gray-500 text-center">
          © 2026 {APP_NAME}
        </p>
      </div>
    </aside>
  )
}
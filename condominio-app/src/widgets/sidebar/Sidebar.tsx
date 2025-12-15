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
  //FileText,
  BarChart3
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

/**
 * Items del menú para vecinos.
 */
const vecinoMenuItems: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
  { label: "Mis Pagos", path: "/dashboard/pagos", icon: <CreditCard size={20} /> },
  { label: "Historial", path: "/dashboard/historial", icon: <History size={20} /> },
  { label: "Contacto", path: "/dashboard/contacto", icon: <Mail size={20} /> },
]

/**
 * Items del menú para administradores.
 */
const adminMenuItems: MenuItem[] = [
  { label: "Dashboard", path: "/admin", icon: <Home size={20} /> },
  { label: "Departamentos", path: "/admin/departamentos", icon: <Building2 size={20} /> },
  { label: "Usuarios", path: "/admin/usuarios", icon: <Users size={20} /> },
  { label: "Pagos", path: "/admin/pagos", icon: <CreditCard size={20} /> },
  { label: "Gastos", path: "/admin/gastos", icon: <Receipt size={20} /> },
  { label: "Reportes", path: "/admin/reportes", icon: <BarChart3 size={20} /> },
]

/**
 * Componente Sidebar.
 * Muestra el menú de navegación lateral según el rol del usuario.
 */
export const Sidebar = () => {
  const { usuario } = useAuth()

  /** Selecciona los items según el rol */
  const menuItems = usuario?.esAdmin ? adminMenuItems : vecinoMenuItems

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo / Nombre de la app */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">{APP_NAME}</h1>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/admin" || item.path === "/dashboard"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
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
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center">
          © 2025 {APP_NAME}
        </p>
      </div>
    </aside>
  )
}
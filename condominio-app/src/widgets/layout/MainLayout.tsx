/**
 * Componente MainLayout
 * 
 * Este archivo contiene el layout principal de la aplicación.
 * Sirve para estructurar la página con Sidebar, Header y contenido principal.
 * 
 * Estructura:
 * ┌─────────────────────────────────────┐
 * │ Sidebar │        Header             │
 * │         │───────────────────────────│
 * │         │                           │
 * │         │        Content            │
 * │         │                           │
 * └─────────────────────────────────────┘
 */

import type { ReactNode } from "react"
import { Sidebar } from "@/widgets/sidebar"
import { Header } from "@/widgets/header"

/**
 * Props del componente MainLayout.
 */
interface MainLayoutProps {
  /** Contenido principal de la página */
  children: ReactNode
}

/**
 * Componente MainLayout.
 * Estructura la página con sidebar fijo a la izquierda y header arriba.
 * 
 * @example
 * <MainLayout>
 *   <DashboardContent />
 * </MainLayout>
 */
export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Contenedor principal (header + contenido) */}
      <div className="flex-1 flex flex-col">
        {/* Header fijo arriba */}
        <Header />

        {/* Contenido principal con scroll */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
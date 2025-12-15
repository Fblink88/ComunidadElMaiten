/**
 * Punto de Entrada de la Aplicación
 * 
 * Este archivo es el punto de entrada principal de React.
 * Sirve para:
 * - Montar la aplicación en el DOM
 * - Envolver la app con los providers necesarios
 * - Importar los estilos globales
 */

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AuthProvider } from "@/app/providers"
import { AppRouter } from "@/app/router"
import "./app/styles/index.css"

/**
 * Renderiza la aplicación en el elemento con id "root".
 * 
 * Estructura de providers:
 * - StrictMode: Activa verificaciones adicionales en desarrollo
 * - AuthProvider: Provee el estado de autenticación a toda la app
 * - AppRouter: Maneja las rutas y navegación
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </StrictMode>
)
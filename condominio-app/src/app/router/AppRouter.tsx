/**
 * Router Principal de la Aplicación
 * 
 * Este archivo contiene la configuración de todas las rutas de la aplicación.
 * Sirve para definir qué componente se muestra en cada URL.
 * 
 * Estructura de rutas:
 * - /login → Página de inicio de sesión
 * - /register → Página de registro
 * - /dashboard/* → Rutas del vecino (protegida)
 * - /admin/* → Rutas de administración (protegida, solo admin)
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "@/app/providers"
import { ProtectedRoute, RequireRole } from "./ProtectedRoute"
import { LoginPage, RegisterPage, PendingApprovalPage } from "@/pages/auth"
import {
  DashboardPage,
  RealizarPagoPage,
  MisPagosPage,
  PagoConfirmacionPage,
  PagoCanceladoPage,
  AutorizacionesPage,
  GestionarAutorizacionesPage,
  HistorialPage,
  MiDepartamentoPage
} from "@/pages/vecino"
import { AdminDashboardPage, AdminPagosPage, DepartamentosPage, AdminUsuariosPage, GastosPage, ReporteFinancieroPage, AdminPerfilPage } from "@/pages/admin"
import { MainLayout } from "@/widgets/layout"
import { Card } from "@/shared/ui"

/**
 * Componente de redirección inteligente para la ruta raíz.
 * Redirige según el estado de autenticación y rol del usuario.
 */
const RootRedirect = () => {
  const { usuario, firebaseUser, loading } = useAuth()

  // Esperar a que cargue el estado de auth antes de redirigir
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />
  }

  if (usuario?.es_admin || usuario?.esAdmin || firebaseUser.email === "edificio.elmaiten@gmail.com") {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/dashboard" replace />
}

/**
 * Componente que redirige admins a /admin si llegan a /dashboard.
 * Esto cubre el caso edge donde un admin accede directamente a /dashboard.
 */
const SmartDashboard = () => {
  const { usuario, firebaseUser } = useAuth()

  if (usuario?.es_admin || usuario?.esAdmin || firebaseUser?.email === "edificio.elmaiten@gmail.com") {
    return <Navigate to="/admin" replace />
  }

  return <DashboardPage />
}

// ============================================
// PÁGINAS TEMPORALES - VECINO
// ============================================


/**
 * Página Contacto del Vecino (placeholder).
 */
const VecinoContacto = () => (
  <Card title="Contacto">
    <p className="text-gray-500">Próximamente podrás contactar al administrador aquí.</p>
  </Card>
)

// ============================================
// PÁGINAS TEMPORALES - ADMIN
// ============================================






// ============================================
// ROUTER PRINCIPAL
// ============================================

/**
 * Componente principal del Router.
 * Define todas las rutas de la aplicación.
 */
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz - Redirección inteligente */}
        <Route path="/" element={<RootRedirect />} />

        {/* Rutas públicas de autenticación */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Ruta de Espera de Aprobación (Protegida pero permite inactivos) */}
        <Route
          path="/pending-approval"
          element={
            <ProtectedRoute allowInactive>
              <PendingApprovalPage />
            </ProtectedRoute>
          }
        />

        {/* Rutas del vecino (protegidas) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SmartDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/pagos"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MisPagosPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/pagos/comprobante"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RealizarPagoPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/pagos/confirmacion"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PagoConfirmacionPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/pagos/cancelado"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PagoCanceladoPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/usuarios-depto"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RequireRole roles={["propietario"]}>
                  <AutorizacionesPage />
                </RequireRole>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/mis-autorizaciones"
          element={
            <ProtectedRoute>
              <MainLayout>
                <GestionarAutorizacionesPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/historial"
          element={
            <ProtectedRoute>
              <MainLayout>
                <HistorialPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/contacto"
          element={
            <ProtectedRoute>
              <MainLayout>
                <VecinoContacto />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Rutas del admin (protegidas, solo admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <AdminDashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/perfil"
          element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <AdminPerfilPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departamentos"
          element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <DepartamentosPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Nueva ruta para Gestión Mi Departamento (Propietarios) */}
        <Route
          path="/dashboard/mi-departamento"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MiDepartamentoPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <AdminUsuariosPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pagos"
          element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <AdminPagosPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/gastos"
          element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <GastosPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reporte-financiero"
          element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <ReporteFinancieroPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 404 - Redirige a raíz */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
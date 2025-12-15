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
import { ProtectedRoute } from "./ProtectedRoute"
import { LoginPage, RegisterPage } from "@/pages/auth"
import { MainLayout } from "@/widgets/layout"
import { Card } from "@/shared/ui"

/**
 * Componente de redirección inteligente para la ruta raíz.
 * Redirige según el estado de autenticación y rol del usuario.
 */
const RootRedirect = () => {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (usuario.esAdmin) {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/dashboard" replace />
}

// ============================================
// PÁGINAS TEMPORALES - VECINO
// ============================================

/**
 * Dashboard del Vecino (placeholder).
 */
const VecinoDashboard = () => {
  const { usuario } = useAuth()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        ¡Bienvenido, {usuario?.nombre}!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <p className="text-sm text-gray-500">Estado de cuenta</p>
          <p className="text-2xl font-bold text-green-600 mt-1">Al día</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Próximo pago</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">$28.000</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Vencimiento</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">15 Ene 2025</p>
        </Card>
      </div>

      <Card title="Últimos movimientos">
        <p className="text-gray-500">Próximamente verás aquí tu historial de pagos.</p>
      </Card>
    </div>
  )
}

/**
 * Página Mis Pagos del Vecino (placeholder).
 */
const VecinoPagos = () => (
  <Card title="Mis Pagos">
    <p className="text-gray-500">Próximamente podrás ver y realizar pagos aquí.</p>
  </Card>
)

/**
 * Página Historial del Vecino (placeholder).
 */
const VecinoHistorial = () => (
  <Card title="Historial de Pagos">
    <p className="text-gray-500">Próximamente verás tu historial completo aquí.</p>
  </Card>
)

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

/**
 * Dashboard del Admin (placeholder).
 */
const AdminDashboard = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <p className="text-sm text-gray-500">Departamentos</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">10</p>
      </Card>
      <Card>
        <p className="text-sm text-gray-500">Al día</p>
        <p className="text-2xl font-bold text-green-600 mt-1">8</p>
      </Card>
      <Card>
        <p className="text-sm text-gray-500">Pendientes</p>
        <p className="text-2xl font-bold text-yellow-600 mt-1">2</p>
      </Card>
      <Card>
        <p className="text-sm text-gray-500">Recaudado (Ene)</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">$224.000</p>
      </Card>
    </div>

    <Card title="Actividad reciente">
      <p className="text-gray-500">Próximamente verás la actividad reciente aquí.</p>
    </Card>
  </div>
)

/**
 * Página Departamentos del Admin (placeholder).
 */
const AdminDepartamentos = () => (
  <Card title="Gestión de Departamentos">
    <p className="text-gray-500">Próximamente podrás gestionar los departamentos aquí.</p>
  </Card>
)

/**
 * Página Usuarios del Admin (placeholder).
 */
const AdminUsuarios = () => (
  <Card title="Gestión de Usuarios">
    <p className="text-gray-500">Próximamente podrás gestionar los usuarios aquí.</p>
  </Card>
)

/**
 * Página Pagos del Admin (placeholder).
 */
const AdminPagos = () => (
  <Card title="Gestión de Pagos">
    <p className="text-gray-500">Próximamente podrás gestionar los pagos aquí.</p>
  </Card>
)

/**
 * Página Gastos del Admin (placeholder).
 */
const AdminGastos = () => (
  <Card title="Gestión de Gastos">
    <p className="text-gray-500">Próximamente podrás gestionar los gastos aquí.</p>
  </Card>
)

/**
 * Página Reportes del Admin (placeholder).
 */
const AdminReportes = () => (
  <Card title="Reportes">
    <p className="text-gray-500">Próximamente podrás generar reportes aquí.</p>
  </Card>
)

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

        {/* Rutas del vecino (protegidas) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <VecinoDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/pagos"
          element={
            <ProtectedRoute>
              <MainLayout>
                <VecinoPagos />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/historial"
          element={
            <ProtectedRoute>
              <MainLayout>
                <VecinoHistorial />
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
                <AdminDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departamentos"
          element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <AdminDepartamentos />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <AdminUsuarios />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pagos"
          element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <AdminPagos />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/gastos"
          element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <AdminGastos />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reportes"
          element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <AdminReportes />
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
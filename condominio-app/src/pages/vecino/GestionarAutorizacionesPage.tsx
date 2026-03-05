/**
 * Página de Gestión de Autorizaciones (Propietario)
 *
 * Permite a los propietarios:
 * - Ver y aprobar/rechazar solicitudes pendientes
 * - Autorizar directamente a un arrendatario
 * - Ver historial de autorizaciones
 * - Revocar autorizaciones activas
 */

import { useState } from 'react'
import {
  SolicitudesPendientes,
  AutorizarArrendatario,
  GestionAutorizaciones,
} from '@/features/autorizaciones'

export const GestionarAutorizacionesPage = () => {
  const [activeTab, setActiveTab] = useState<'solicitudes' | 'autorizar' | 'gestionar'>(
    'solicitudes'
  )
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUpdate = () => {
    // Refrescar todos los componentes
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Autorizaciones</h1>
        <p className="text-gray-500 mt-1">
          Administra las autorizaciones de pago para arrendatarios de tu departamento
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('solicitudes')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'solicitudes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Solicitudes Pendientes
          </button>
          <button
            onClick={() => setActiveTab('autorizar')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'autorizar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Autorizar Directamente
          </button>
          <button
            onClick={() => setActiveTab('gestionar')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'gestionar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Mis Autorizaciones
          </button>
        </nav>
      </div>

      {/* Contenido según tab activo */}
      <div key={refreshKey}>
        {activeTab === 'solicitudes' && <SolicitudesPendientes onUpdate={handleUpdate} />}
        {activeTab === 'autorizar' && <AutorizarArrendatario onSuccess={handleUpdate} />}
        {activeTab === 'gestionar' && <GestionAutorizaciones />}
      </div>
    </div>
  )
}

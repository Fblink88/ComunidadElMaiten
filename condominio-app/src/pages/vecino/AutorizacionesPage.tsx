/**
 * Página de Autorizaciones (Arrendatario)
 *
 * Permite a los arrendatarios:
 * - Solicitar autorización para pagar gastos comunes
 * - Ver sus autorizaciones (pendientes, aprobadas, rechazadas)
 */

import { useState } from 'react'
import { SolicitudAutorizacion, MisAutorizaciones } from '@/features/autorizaciones'

export const AutorizacionesPage = () => {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSolicitudExitosa = () => {
    // Refrescar la lista de autorizaciones
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Autorizaciones de Pago</h1>
        <p className="text-gray-500 mt-1">
          Solicita permiso al propietario para realizar pagos de gastos comunes
        </p>
      </div>

      {/* Formulario de solicitud */}
      <SolicitudAutorizacion onSuccess={handleSolicitudExitosa} />

      {/* Lista de autorizaciones */}
      <div key={refreshKey}>
        <MisAutorizaciones />
      </div>
    </div>
  )
}

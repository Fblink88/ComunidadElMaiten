/**
 * Página de Mis Pagos
 *
 * Muestra todos los pagos del usuario (pendientes, pagados, verificando, rechazados)
 * con opciones para pagar los pendientes.
 */

import { ListaPagosPendientes } from "@/features/realizar-pago"
// import { Button, Badge, Spinner } from "@/shared/ui"

export const MisPagosPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mis Pagos</h1>
        <p className="text-gray-600 mt-2">
          Aquí puedes ver tus pagos pendientes y elegir cómo pagarlos.
        </p>
      </div>

      {/* Sección de Pagos Pendientes */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Pagos Pendientes
        </h2>
        <ListaPagosPendientes />
      </div>
    </div>
  )
}

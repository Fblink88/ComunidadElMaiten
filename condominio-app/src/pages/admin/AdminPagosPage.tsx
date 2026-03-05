/**
 * Página de Administración de Pagos
 *
 * Permite al administrador ver todos los pagos, filtrarlos por estado
 * y verificar (aprobar/rechazar) los pagos manuales.
 */

import { useState } from "react"
import { DetallePago, ListaTransacciones, MatrizDeudas, PagosPorVerificar } from "@/features/gestionar-gastos"

import type { Pago } from "@/shared/types"

export const AdminPagosPage = () => {
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null)
  const [tab, setTab] = useState<"deudas" | "abonos" | "verificar">("abonos")
  const [reloadKey, setReloadKey] = useState(0)

  const handlePagoVerificado = () => {
    // Recargar la lista de pagos para actualizar el estado del UI
    setReloadKey(prev => prev + 1)
  }

  const handleCerrarDetalle = () => {
    setPagoSeleccionado(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Finanzas</h1>
        <p className="text-gray-600 mt-2">
          Administra los abonos (pagos globales) y revisa el estado de las deudas mensuales por departamento.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 border-b-2 ${tab === 'abonos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setTab('abonos')}
        >
          Historial de Abonos (Transferencias)
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 border-b-2 ${tab === 'deudas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setTab('deudas')}
        >
          Lista de Deudas Mensuales (Periodos)
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 border-b-2 flex items-center gap-2 ${tab === 'verificar' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setTab('verificar')}
        >
          Pagos por Verificar
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-bold">Nuevo</span>
        </button>
      </div>

      {tab === "abonos" ? (
        <ListaTransacciones key={`abonos-${reloadKey}`} />
      ) : tab === "verificar" ? (
        <>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              📋 Bandeja de Aprobación de Transferencias:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>
                Aquí aparecerán los depósitos manuales reportados por tus residentes.
              </li>
              <li>Revisa que el monto, la fecha exacta y el nombre coincidan con la cartola de tu banco real.</li>
              <li>Al aprobar, el monto pasará a "Historial de Abonos" y pagará las deudas automáticamente según la Billetera Virtual en Cascada.</li>
            </ul>
          </div>
          <PagosPorVerificar
            key={`verificar-${reloadKey}`}
            onSeleccionarPago={setPagoSeleccionado}
          />
          <DetallePago
            pago={pagoSeleccionado}
            onClose={handleCerrarDetalle}
            onPagoVerificado={handlePagoVerificado}
          />
        </>
      ) : (
        <>
          {/* Lista de Pagos Histórica (Matriz de Cuotas Base) */}
          <MatrizDeudas
            key={`deudas-${reloadKey}`}
            onSeleccionarPago={(pago) => setPagoSeleccionado(pago)}
          />

          {/* Modal de Detalle */}
          <DetallePago
            pago={pagoSeleccionado}
            onClose={handleCerrarDetalle}
            onPagoVerificado={handlePagoVerificado}
          />
        </>
      )}
    </div>
  )
}

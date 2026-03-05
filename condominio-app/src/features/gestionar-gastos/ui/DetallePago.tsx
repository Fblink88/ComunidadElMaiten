/**
 * Componente DetallePago
 *
 * Muestra los detalles completos de un pago y permite al administrador
 * aprobar o rechazar pagos manuales.
 */

import { useState } from "react"
import { Modal, Button, Badge, Input } from "@/shared/ui"
import { useAuth } from "@/app/providers"

import type { Pago } from "@/shared/types"

interface DetallePagoProps {
  pago: Pago | null
  onClose: () => void
  onPagoVerificado: () => void
}

export const DetallePago = ({ pago, onClose, onPagoVerificado }: DetallePagoProps) => {
  const [notas, setNotas] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { firebaseUser } = useAuth()

  if (!pago) return null

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(monto)
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "pagado":
        return "success"
      case "verificando":
        return "warning"
      case "rechazado":
        return "error"
      default:
        return "default"
    }
  }

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case "pagado":
        return "Pagado"
      case "verificando":
        return "Verificando"
      case "rechazado":
        return "Rechazado"
      case "pendiente":
        return "Pendiente"
      default:
        return estado
    }
  }

  const verificarPago = async (aprobado: boolean) => {
    setIsLoading(true)
    setError(null)

    try {
      const token = await firebaseUser?.getIdToken()
      if (!token) throw new Error("No autenticado")

      const response = await fetch(
        `http://127.0.0.1:8000/api/pagos/${pago.id}/verificar?aprobado=${aprobado}${notas ? `&notas=${encodeURIComponent(notas)}` : ""
        }`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al verificar pago")
      }

      // Éxito
      onPagoVerificado()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al verificar pago")
    } finally {
      setIsLoading(false)
    }
  }

  const puedeVerificar = pago.estado === "verificando" && pago.metodo === "transferencia_manual"

  return (
    <Modal isOpen={true} onClose={onClose} title="Detalles del Pago">
      <div className="space-y-6">
        {/* Estado */}
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Estado:</h3>
          <Badge variant={getEstadoBadgeVariant(pago.estado)}>
            {getEstadoTexto(pago.estado)}
          </Badge>
        </div>

        {/* Información del Pago */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Departamento</p>
            <p className="font-semibold text-lg">{pago.departamento_id}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Periodo</p>
            <p className="font-semibold text-lg">{pago.periodo === 'SALDO' ? 'Abono Billetera' : pago.periodo}</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Monto</p>
            <p className="font-semibold text-lg text-green-700">
              {formatearMonto(pago.monto)}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Método</p>
            <p className="font-semibold">
              {pago.metodo === "transferencia_manual" ? "Transferencia Manual" : pago.metodo === "saldo_a_favor" ? "Billetera Virtual" : "Khipu"}
            </p>
          </div>
        </div>

        {/* Información del Pagador (si es transferencia manual) */}
        {pago.metodo === "transferencia_manual" && (
          <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">
              Información de la Transferencia
            </h4>
            <div className="space-y-2">
              {pago.nombre_pagador && (
                <div>
                  <p className="text-sm text-blue-700">Nombre del Pagador:</p>
                  <p className="font-medium text-blue-900">{pago.nombre_pagador}</p>
                </div>
              )}
              {pago.fecha_transferencia && (
                <div>
                  <p className="text-sm text-blue-700">Fecha de Transferencia:</p>
                  <p className="font-medium text-blue-900">
                    {formatearFecha(pago.fecha_transferencia)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fechas */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Historial</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Creado:</span>
              <span className="font-medium">{formatearFecha(pago.created_at)}</span>
            </div>
            {pago.fecha_pago && (
              <div className="flex justify-between">
                <span className="text-gray-600">Pagado:</span>
                <span className="font-medium">{formatearFecha(pago.fecha_pago)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notas existentes */}
        {pago.notas && (
          <div className="border border-gray-200 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Notas del Administrador:</h4>
            <p className="text-gray-700">{pago.notas}</p>
          </div>
        )}

        {/* Mensajes de error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Acciones de verificación */}
        {puedeVerificar && (
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-semibold">Verificar Pago</h4>

            <Input
              label="Notas (opcional)"
              placeholder="Agregar notas sobre la verificación..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              helperText="Estas notas serán guardadas con el pago"
            />

            <div className="flex gap-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => verificarPago(true)}
                isLoading={isLoading}
                disabled={isLoading}
              >
                ✓ Aprobar Pago
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => verificarPago(false)}
                isLoading={isLoading}
                disabled={isLoading}
              >
                ✗ Rechazar Pago
              </Button>
            </div>
          </div>
        )}

        {/* Información de estado no verificable */}
        {!puedeVerificar && (
          <div className="border-t pt-4">
            {pago.estado === "pagado" && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                ✓ Este pago ya fue verificado y aprobado
              </div>
            )}
            {pago.estado === "rechazado" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                ✗ Este pago fue rechazado
              </div>
            )}
            {pago.estado === "pendiente" && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                ⏳ Este pago está pendiente de ser procesado
              </div>
            )}
            {pago.metodo === "khipu" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                ℹ️ Los pagos con Khipu se verifican automáticamente
              </div>
            )}
          </div>
        )}

        {/* Botón cerrar */}
        <div className="border-t pt-4">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

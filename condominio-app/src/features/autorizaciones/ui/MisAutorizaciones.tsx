/**
 * Componente MisAutorizaciones
 *
 * Muestra la lista de autorizaciones del arrendatario.
 * Incluye autorizaciones pendientes, aprobadas, rechazadas y revocadas.
 */

import { useState, useEffect } from 'react'
import { Card } from '@/shared/ui'
import { getMisAutorizaciones } from '@/shared/api'
import type { Autorizacion } from '@/shared/types'
import { Shield, Check, X, Clock, Ban, Calendar } from 'lucide-react'

export const MisAutorizaciones = () => {
  const [autorizaciones, setAutorizaciones] = useState<Autorizacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarAutorizaciones()
  }, [])

  const cargarAutorizaciones = async () => {
    try {
      setLoading(true)
      const data = await getMisAutorizaciones()
      setAutorizaciones(data)
    } catch (error) {
      console.error('Error cargando autorizaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return {
          icon: <Clock className="w-4 h-4" />,
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          label: 'Pendiente',
        }
      case 'aprobada':
        return {
          icon: <Check className="w-4 h-4" />,
          bg: 'bg-green-100',
          text: 'text-green-800',
          label: 'Aprobada',
        }
      case 'rechazada':
        return {
          icon: <X className="w-4 h-4" />,
          bg: 'bg-red-100',
          text: 'text-red-800',
          label: 'Rechazada',
        }
      case 'revocada':
        return {
          icon: <Ban className="w-4 h-4" />,
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          label: 'Revocada',
        }
      default:
        return {
          icon: <Shield className="w-4 h-4" />,
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          label: estado,
        }
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatearPeriodo = (periodo: string) => {
    const [year, month] = periodo.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
    })
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-gray-500">Cargando autorizaciones...</p>
        </div>
      </Card>
    )
  }

  if (autorizaciones.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No tienes autorizaciones todavía</p>
          <p className="text-sm text-gray-400 mt-2">
            Solicita una autorización para poder realizar pagos
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis Autorizaciones</h2>

        <div className="space-y-4">
          {autorizaciones.map((autorizacion) => {
            const badge = getEstadoBadge(autorizacion.estado)

            return (
              <div
                key={autorizacion.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        Autorización {autorizacion.tipo === 'permanente' ? 'Permanente' : 'Ocasional'}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {autorizacion.fue_solicitada ? 'Solicitada por ti' : 'Otorgada directamente'}
                    </p>
                  </div>
                </div>

                {/* Periodos autorizados (solo si es ocasional) */}
                {autorizacion.tipo === 'ocasional' && autorizacion.periodos_autorizados && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Periodos Autorizados:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {autorizacion.periodos_autorizados.map((periodo) => (
                        <span
                          key={periodo}
                          className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                        >
                          {formatearPeriodo(periodo)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nota de solicitud */}
                {autorizacion.nota_solicitud && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Tu mensaje:</p>
                    <p className="text-sm text-gray-600 mt-1 italic">"{autorizacion.nota_solicitud}"</p>
                  </div>
                )}

                {/* Nota de respuesta */}
                {autorizacion.nota_respuesta && (
                  <div className="mb-3 bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-700">Respuesta del propietario:</p>
                    <p className="text-sm text-gray-600 mt-1">"{autorizacion.nota_respuesta}"</p>
                  </div>
                )}

                {/* Fechas */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Creada: {formatearFecha(autorizacion.fecha_creacion)}</p>
                  {autorizacion.fecha_respuesta && (
                    <p>
                      {autorizacion.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}:{' '}
                      {formatearFecha(autorizacion.fecha_respuesta)}
                    </p>
                  )}
                  {autorizacion.fecha_revocacion && (
                    <p>Revocada: {formatearFecha(autorizacion.fecha_revocacion)}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

/**
 * Componente SolicitudesPendientes
 *
 * Muestra las solicitudes de autorización pendientes
 * para que el propietario las apruebe o rechace.
 */

import { useState, useEffect } from 'react'
import { Card, Button, Modal } from '@/shared/ui'
import { getSolicitudesPendientes, aprobarSolicitud, rechazarSolicitud } from '@/shared/api'
import type { Autorizacion } from '@/shared/types'
import { Clock, Check, X, Calendar, User } from 'lucide-react'

interface SolicitudesPendientesProps {
  onUpdate?: () => void
}

export const SolicitudesPendientes = ({ onUpdate }: SolicitudesPendientesProps) => {
  const [solicitudes, setSolicitudes] = useState<Autorizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModalAprobar, setShowModalAprobar] = useState(false)
  const [showModalRechazar, setShowModalRechazar] = useState(false)
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Autorizacion | null>(null)
  const [nota, setNota] = useState('')
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    cargarSolicitudes()
  }, [])

  const cargarSolicitudes = async () => {
    try {
      setLoading(true)
      const data = await getSolicitudesPendientes()
      setSolicitudes(data as unknown as Autorizacion[])
    } catch (error) {
      console.error('Error cargando solicitudes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAprobar = async () => {
    if (!solicitudSeleccionada) return

    try {
      setProcesando(true)
      await aprobarSolicitud(solicitudSeleccionada.id, {
        nota_respuesta: nota || undefined,
      })

      setShowModalAprobar(false)
      setNota('')
      await cargarSolicitudes()

      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error aprobando solicitud:', error)
      alert('Error al aprobar la solicitud')
    } finally {
      setProcesando(false)
    }
  }

  const handleRechazar = async () => {
    if (!solicitudSeleccionada) return

    try {
      setProcesando(true)
      await rechazarSolicitud(solicitudSeleccionada.id, {
        nota_respuesta: nota || undefined,
      })

      setShowModalRechazar(false)
      setNota('')
      await cargarSolicitudes()

      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error rechazando solicitud:', error)
      alert('Error al rechazar la solicitud')
    } finally {
      setProcesando(false)
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
          <p className="text-gray-500">Cargando solicitudes...</p>
        </div>
      </Card>
    )
  }

  if (solicitudes.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay solicitudes pendientes</p>
          <p className="text-sm text-gray-400 mt-2">
            Cuando un arrendatario solicite autorización, aparecerá aquí
          </p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            Solicitudes Pendientes ({solicitudes.length})
          </h2>

          <div className="space-y-4">
            {solicitudes.map((solicitud) => (
              <div
                key={solicitud.id}
                className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Solicitud de Autorización {solicitud.tipo === 'permanente' ? 'Permanente' : 'Ocasional'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Solicitada el {formatearFecha(solicitud.fecha_creacion?.toString() || '')}
                    </p>
                  </div>
                </div>

                {/* Periodos */}
                {solicitud.tipo === 'ocasional' && solicitud.periodos_autorizados && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Periodos Solicitados:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {solicitud.periodos_autorizados.map((periodo) => (
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

                {/* Nota del arrendatario */}
                {solicitud.nota_solicitud && (
                  <div className="mb-4 bg-white p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-700">Mensaje del arrendatario:</p>
                    <p className="text-sm text-gray-600 mt-1 italic">"{solicitud.nota_solicitud}"</p>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => {
                      setSolicitudSeleccionada(solicitud)
                      setShowModalAprobar(true)
                    }}
                    size="sm"
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Aprobar
                  </Button>
                  <Button
                    onClick={() => {
                      setSolicitudSeleccionada(solicitud)
                      setShowModalRechazar(true)
                    }}
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Modal Aprobar */}
      <Modal
        isOpen={showModalAprobar}
        onClose={() => {
          setShowModalAprobar(false)
          setNota('')
        }}
        title="Aprobar Solicitud"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Estás a punto de aprobar la solicitud de autorización.
            {solicitudSeleccionada?.tipo === 'permanente'
              ? ' El arrendatario podrá pagar todos los periodos futuros.'
              : ' El arrendatario podrá pagar solo los periodos seleccionados.'}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje para el arrendatario (Opcional)
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Puedes agregar un mensaje opcional..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleAprobar} disabled={procesando} className="flex-1">
              {procesando ? 'Aprobando...' : 'Confirmar Aprobación'}
            </Button>
            <Button
              onClick={() => {
                setShowModalAprobar(false)
                setNota('')
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Rechazar */}
      <Modal
        isOpen={showModalRechazar}
        onClose={() => {
          setShowModalRechazar(false)
          setNota('')
        }}
        title="Rechazar Solicitud"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Estás a punto de rechazar la solicitud de autorización. El arrendatario recibirá un
            email notificándole del rechazo.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo del rechazo (Opcional)
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Explica por qué rechazas la solicitud..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRechazar}
              disabled={procesando}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {procesando ? 'Rechazando...' : 'Confirmar Rechazo'}
            </Button>
            <Button
              onClick={() => {
                setShowModalRechazar(false)
                setNota('')
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/**
 * Componente GestionAutorizaciones
 *
 * Panel completo de gestión de autorizaciones para propietarios.
 * Incluye: solicitudes pendientes, autorizar directamente, y historial.
 */

import { useState, useEffect } from 'react'
import { Card, Button, Modal } from '@/shared/ui'
import {
  getAutorizacionesByDepartamento,
  revocarAutorizacion,
  getSolicitudesPendientes,
} from '@/shared/api'
import type { Autorizacion } from '@/shared/types'
import { Shield, Check, X, Ban, Calendar, AlertCircle } from 'lucide-react'
import { useAuth } from '@/app/providers'

export const GestionAutorizaciones = () => {
  const { usuario } = useAuth()
  const [autorizaciones, setAutorizaciones] = useState<Autorizacion[]>([])
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<Autorizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModalRevocar, setShowModalRevocar] = useState(false)
  const [autorizacionARevocar, setAutorizacionARevocar] = useState<Autorizacion | null>(null)
  const [motivo, setMotivo] = useState('')
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [usuario?.departamento_id])

  const cargarDatos = async () => {
    if (!usuario?.departamento_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [autorizacionesData, solicitudesData] = await Promise.all([
        getAutorizacionesByDepartamento(usuario.departamento_id),
        getSolicitudesPendientes(),
      ])

      setAutorizaciones(autorizacionesData)
      setSolicitudesPendientes(solicitudesData)
    } catch (error) {
      console.error('Error cargando autorizaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRevocar = async () => {
    if (!autorizacionARevocar) return

    try {
      setProcesando(true)
      await revocarAutorizacion(autorizacionARevocar.id, {
        nota_respuesta: motivo || undefined,
      })

      setShowModalRevocar(false)
      setMotivo('')
      await cargarDatos()
    } catch (error) {
      console.error('Error revocando autorización:', error)
      alert('Error al revocar la autorización')
    } finally {
      setProcesando(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
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

  const autorizacionesActivas = autorizaciones.filter((a) => a.estado === 'aprobada')
  const autorizacionesHistorico = autorizaciones.filter(
    (a) => a.estado === 'rechazada' || a.estado === 'revocada'
  )

  return (
    <>
      <div className="space-y-6">
        {/* Alerta de solicitudes pendientes */}
        {solicitudesPendientes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-800">
                Tienes {solicitudesPendientes.length} solicitud
                {solicitudesPendientes.length !== 1 ? 'es' : ''} pendiente
                {solicitudesPendientes.length !== 1 ? 's' : ''} de autorización
              </p>
            </div>
          </div>
        )}

        {/* Autorizaciones Activas */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Autorizaciones Activas ({autorizacionesActivas.length})
            </h2>

            {autorizacionesActivas.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay autorizaciones activas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {autorizacionesActivas.map((autorizacion) => {
                  const badge = getEstadoBadge(autorizacion.estado)

                  return (
                    <div
                      key={autorizacion.id}
                      className="border border-green-200 bg-green-50 rounded-lg p-4"
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
                          <p className="text-sm text-gray-600 mt-1">
                            {autorizacion.fue_solicitada
                              ? 'Aprobada por ti'
                              : 'Autorizada por ti directamente'}
                          </p>
                        </div>
                      </div>

                      {/* Periodos */}
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

                      {/* Fechas */}
                      <div className="text-xs text-gray-500 mb-3">
                        <p>Aprobada: {formatearFecha(autorizacion.fecha_respuesta!)}</p>
                      </div>

                      {/* Botón Revocar */}
                      <Button
                        onClick={() => {
                          setAutorizacionARevocar(autorizacion)
                          setShowModalRevocar(true)
                        }}
                        size="sm"
                        variant="secondary"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Revocar Autorización
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Historial */}
        {autorizacionesHistorico.length > 0 && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Historial ({autorizacionesHistorico.length})
              </h2>

              <div className="space-y-4">
                {autorizacionesHistorico.map((autorizacion) => {
                  const badge = getEstadoBadge(autorizacion.estado)

                  return (
                    <div
                      key={autorizacion.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
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
                          <p className="text-xs text-gray-500 mt-1">
                            {autorizacion.estado === 'rechazada' &&
                              `Rechazada: ${formatearFecha(autorizacion.fecha_respuesta!)}`}
                            {autorizacion.estado === 'revocada' &&
                              `Revocada: ${formatearFecha(autorizacion.fecha_revocacion!)}`}
                          </p>
                        </div>
                      </div>

                      {autorizacion.nota_respuesta && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          "{autorizacion.nota_respuesta}"
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Modal Revocar */}
      <Modal
        isOpen={showModalRevocar}
        onClose={() => {
          setShowModalRevocar(false)
          setMotivo('')
        }}
        title="Revocar Autorización"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Estás a punto de revocar una autorización activa. El arrendatario ya no podrá realizar
            pagos y recibirá un email notificándole.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de la revocación (Opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explica por qué revocas la autorización..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRevocar}
              disabled={procesando}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {procesando ? 'Revocando...' : 'Confirmar Revocación'}
            </Button>
            <Button
              onClick={() => {
                setShowModalRevocar(false)
                setMotivo('')
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

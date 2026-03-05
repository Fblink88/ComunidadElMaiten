/**
 * Lista de Pagos Pendientes
 *
 * Muestra los pagos pendientes del usuario con opciones para:
 * - Pagar con Khipu (individual o batch)
 * - Cargar saldo a la billetera (prepago)
 * - Enviar comprobante de transferencia manual
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Badge, Spinner, Input } from '@/shared/ui'
import { CreditCard, FileText, Calendar, Wallet } from 'lucide-react'
import { getMisPagos, iniciarPagoOnline, getGastosMensuales, getMisAutorizaciones } from '@/shared/api'
import { getCurrentUser } from '@/shared/api/auth.api'
import { getDepartamento } from '@/shared/api/departamentos.api'
import type { Pago, Autorizacion } from '@/shared/types'

export const ListaPagosPendientes = () => {
  const navigate = useNavigate()

  // Estado de pagos
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [procesandoPago, setProcesandoPago] = useState<string | null>(null)

  // Estado de autorizaciones (para arrendatarios)
  const [esArrendatario, setEsArrendatario] = useState(false)
  const [autorizaciones, setAutorizaciones] = useState<Autorizacion[]>([])

  // Estado de Batch y Wallet
  const [selectedPagos, setSelectedPagos] = useState<Set<string>>(new Set())
  const [saldoFavor, setSaldoFavor] = useState(0)
  const [montoPrepago, setMontoPrepago] = useState('')
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [departamentoId, setDepartamentoId] = useState<string | null>(null)

  // Cargar datos al montar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [pagosData, user, gastosData] = await Promise.all([
          getMisPagos(),
          getCurrentUser(),
          getGastosMensuales(24) // Últimos 24 meses
        ])

        // Si es arrendatario, cargar sus autorizaciones
        if (user.rol === 'arrendatario') {
          setEsArrendatario(true)
          const auths = await getMisAutorizaciones()
          setAutorizaciones(auths)
        }

        console.log("Debug ListaPagos:", {
          pagos: pagosData.length,
          userDepto: user.departamento_id,
          gastos: gastosData.length
        })

        let pagosFinales = [...pagosData]

        if (user.departamento_id) {
          setDepartamentoId(user.departamento_id)
          const depto = await getDepartamento(user.departamento_id)
          setSaldoFavor(depto.saldo_a_favor || 0)

          // Lógica de cálculo de deuda (Pagos Virtuales)
          const pagosMap = new Map()
          pagosData.forEach(p => pagosMap.set(p.periodo, p))

          gastosData.forEach(gasto => {
            const pagoExistente = pagosMap.get(gasto.periodo)

            // Si NO existe pago, creamos uno virtual
            if (!pagoExistente) {
              const montoCalculado = Math.round(gasto.valor_por_m2 * depto.metros_cuadrados)

              const pagoVirtual: Pago = {
                id: `virtual-${gasto.periodo}`, // ID Temporal
                departamento_id: user.departamento_id!,
                monto: montoCalculado,
                periodo: gasto.periodo,
                estado: 'pendiente',
                metodo: null,
                created_at: new Date().toISOString(),
                fecha_pago: null,
                fecha_transferencia: null,
                nombre_pagador: null,
                verificado_por: null,
                notas: "Pago pendiente generado automáticamente",
                khipu_payment_id: null
              }
              pagosFinales.push(pagoVirtual)
            }
          })
        }

        // Ordenar por fecha (descendente)
        pagosFinales.sort((a, b) => b.periodo.localeCompare(a.periodo))

        setPagos(pagosFinales)
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedPagos)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedPagos(newSelected)
  }

  const handlePagarBatch = async () => {
    if (selectedPagos.size === 0 || !departamentoId) return
    setProcesandoPago('batch')
    try {
      const montoTotal = pagosPendientes
        .filter(p => selectedPagos.has(p.id))
        .reduce((acc, curr) => acc + curr.monto, 0)

      const data = await iniciarPagoOnline(departamentoId, montoTotal)
      if (data.payment_url) window.location.href = data.payment_url
    } catch (error) {
      console.error('Error batch:', error)
      alert('Error al iniciar pago masivo')
    } finally {
      setProcesandoPago(null)
    }
  }

  const handleCargarSaldo = async () => {
    const monto = parseInt(montoPrepago)
    if (!monto || monto <= 0 || !departamentoId) return

    setLoadingWallet(true)
    try {
      const data = await iniciarPagoOnline(departamentoId, monto)
      if (data.payment_url) window.location.href = data.payment_url
    } catch (error) {
      console.error('Error prepago:', error)
      alert('Error al iniciar carga de saldo')
    } finally {
      setLoadingWallet(false)
    }
  }

  const handlePagarConKhipu = async (pago: Pago) => {
    if (!departamentoId) return
    setProcesandoPago(pago.id)
    try {
      const data = await iniciarPagoOnline(departamentoId, pago.monto)
      if (data.payment_url) window.location.href = data.payment_url
    } catch (error) {
      console.error('Error individual:', error)
      alert('Error al iniciar el pago')
    } finally {
      setProcesandoPago(null)
    }
  }

  const handleEnviarComprobante = () => {
    navigate('/dashboard/pagos/comprobante')
  }

  // Helpers
  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(monto)
  }

  const formatearPeriodo = (periodo: string) => {
    const [year, month] = periodo.split('-')
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${meses[parseInt(month) - 1]} ${year}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  // Verificar si tiene permiso para pagar
  const tieneAutorizacionPermanente = autorizaciones.some(a => a.tipo === 'permanente' && a.estado === 'aprobada')

  // Filtrar pagos permitidos
  const pagosPendientes = pagos.filter(p => {
    // Si no es deuda/pendiente, no mostrar aquí
    if (p.estado !== 'pendiente' && p.estado !== 'rechazado') return false

    // Si no es arrendatario, puede pagar todo
    if (!esArrendatario) return true

    // Si tiene permiso permanente, puede pagar todo
    if (tieneAutorizacionPermanente) return true

    // Si es permisos ocasionales, verificar periodo
    return autorizaciones.some(a =>
      a.tipo === 'ocasional' &&
      a.estado === 'aprobada' &&
      a.periodos_autorizados?.includes(p.periodo)
    )
  })

  // Si es arrendatario y no tiene NINGUNA autorización válida
  const bloqueadoTotalmente = esArrendatario && !tieneAutorizacionPermanente && pagosPendientes.length === 0

  if (bloqueadoTotalmente) {
    return (
      <Card>
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Requiere Autorización</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Como arrendatario, necesitas autorización del propietario para realizar pagos de gastos comunes.
          </p>
          <Button onClick={() => navigate('/dashboard/autorizaciones')}>
            Solicitar Autorización
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Billetera / Saldo a Favor */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Billetera Virtual</h3>
              <p className="text-sm text-gray-600">Tu saldo se usa automáticamente para futuros gastos.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-end gap-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 mb-1">Saldo a Favor Disponible</p>
              <div className="text-3xl font-bold text-blue-700">{formatearMonto(saldoFavor)}</div>
            </div>

            <div className="flex items-end gap-2 w-full md:w-auto">
              <div className="w-full">
                <Input
                  label="Cargar Saldo / Adelantar meses"
                  type="number"
                  placeholder="Ej: 300000"
                  value={montoPrepago}
                  onChange={(e) => setMontoPrepago(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCargarSaldo}
                disabled={loadingWallet || !montoPrepago}
                isLoading={loadingWallet}
              >
                Cargar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Pagos */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Pagos Pendientes</h2>
          {selectedPagos.size > 0 && (
            <Badge variant="info">{selectedPagos.size} seleccionados</Badge>
          )}
        </div>

        {pagosPendientes.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">¡Estás al día!</h3>
              <p className="text-gray-600">No tienes deudas pendientes.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {pagosPendientes.map((pago) => (
              <Card key={pago.id} className={selectedPagos.has(pago.id) ? 'ring-2 ring-blue-500' : ''}>
                <div className="flex items-center p-4">
                  {/* Checkbox custom */}
                  <div className="mr-4">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                      checked={selectedPagos.has(pago.id)}
                      onChange={() => handleToggleSelect(pago.id)}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Gasto Común {formatearPeriodo(pago.periodo)}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>Vence a fin de mes</span>
                        </div>
                        {pago.estado === 'rechazado' && (
                          <div className="mt-2">
                            <Badge variant="error">Pago Rechazado</Badge>
                            {pago.notas && (
                              <p className="text-sm text-red-600 mt-1">
                                Motivo: {pago.notas}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Monto</p>
                          <p className="text-xl font-bold text-gray-900">{formatearMonto(pago.monto)}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={selectedPagos.has(pago.id) ? 'primary' : 'secondary'}
                            onClick={() => handleToggleSelect(pago.id)}
                          >
                            {selectedPagos.has(pago.id) ? 'Seleccionado' : 'Seleccionar'}
                          </Button>

                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handlePagarConKhipu(pago)}
                            disabled={procesandoPago === pago.id}
                          >
                            {procesandoPago === pago.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <CreditCard className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Botón Flotante para Pago Masivo */}
      {selectedPagos.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-2xl p-4 flex items-center gap-6 border border-gray-100 z-50 animate-in slide-in-from-bottom-4">
          <div className="pl-2">
            <p className="text-sm text-gray-500">Total a Abonar</p>
            <p className="text-xl font-bold text-blue-600">
              {formatearMonto(pagosPendientes.filter(p => selectedPagos.has(p.id)).reduce((acc, curr) => acc + curr.monto, 0))}
            </p>
          </div>
          <Button
            size="lg"
            className="rounded-full px-8 shadow-lg hover:shadow-xl"
            onClick={handlePagarBatch}
            disabled={procesandoPago === 'batch'}
            isLoading={procesandoPago === 'batch'}
          >
            Abonar {selectedPagos.size} cuenta{selectedPagos.size > 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {/* Botón enviar comprobante manual (link al pie) */}
      <div className="text-center mt-8">
        <Button variant="ghost" onClick={handleEnviarComprobante}>
          <FileText className="w-4 h-4 mr-2" />
          ¿Hiciste transferencia manual? Enviar comprobante
        </Button>
      </div>
    </div>
  )
}

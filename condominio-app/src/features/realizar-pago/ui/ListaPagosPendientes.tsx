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
import { getMisPagos, iniciarPagoOnline, getGastosMensuales } from '@/shared/api'
import { useAuth } from '@/app/providers'
import { getDepartamento } from '@/shared/api/departamentos.api'
import type { Pago } from '@/shared/types'

export const ListaPagosPendientes = () => {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  // Estado de pagos
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  // Estado del Waterfall (Billetera + Deuda)
  const [deudaBrutaTotal, setDeudaBrutaTotal] = useState(0)
  const [deudaEfectiva, setDeudaEfectiva] = useState(0)
  const [saldoFavor, setSaldoFavor] = useState(0)
  const [montoPrepago, setMontoPrepago] = useState('')
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [departamentoId, setDepartamentoId] = useState<string | null>(null)

  // Cargar datos al montar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [pagosData, gastosData] = await Promise.all([
          getMisPagos(),
          getGastosMensuales(24) // Últimos 24 meses
        ])

        let pagosFinales = [...pagosData]

        const tieneDepto = usuario?.departamento_id || usuario?.departamentoId

        if (tieneDepto) {
          setDepartamentoId(tieneDepto)
          const depto = await getDepartamento(tieneDepto)
          const saldoInicial = depto.saldo_a_favor || 0
          setSaldoFavor(saldoInicial)

          // Lógica de cálculo de deuda (Pagos Virtuales)
          const pagosMap = new Map()
          pagosData.forEach(p => pagosMap.set(p.periodo, p))

          gastosData.forEach(gasto => {
            const pagoExistente = pagosMap.get(gasto.periodo)

            // Si NO existe pago, creamos uno virtual
            if (!pagoExistente) {
              const montoCalculado = Math.round((gasto.valor_por_m2 || 0) * (depto.metros_cuadrados || 0))

              const pagoVirtual: Pago = {
                id: `virtual-${gasto.periodo}`, // ID Temporal
                departamento_id: tieneDepto,
                monto: montoCalculado,
                periodo: gasto.periodo,
                estado: 'pendiente',
                metodo: null as any,
              }
              pagosFinales.push(pagoVirtual)
            }
          })

          // Calcular Cascada (Igual que en Admin)
          const pendientes = pagosFinales
            .filter(p => p.estado === 'pendiente' || p.estado === 'rechazado')
            .sort((a, b) => (a.periodo || '').localeCompare(b.periodo || ''))

          let saldoRestante = saldoInicial
          let deudaEfCalc = 0
          let deudaBrutaCalc = 0

          for (const p of pendientes) {
            const dBruta = p.monto - (p.monto_pagado || 0)
            deudaBrutaCalc += dBruta
            if (saldoRestante >= dBruta) {
              saldoRestante -= dBruta
            } else {
              deudaEfCalc += dBruta - saldoRestante
              saldoRestante = 0
            }
          }

          setDeudaBrutaTotal(deudaBrutaCalc)
          setDeudaEfectiva(deudaEfCalc)
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
  }, [usuario?.departamento_id, usuario?.departamentoId])

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

  // Filtrar pagos para la lista
  const pagosPendientes = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'rechazado')

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
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Tu Saldo a Favor Global</p>
                <div className="text-3xl font-bold text-blue-700">{formatearMonto(saldoFavor)}</div>
              </div>
              {deudaBrutaTotal > 0 && (
                <div className="pt-2 border-t border-blue-100/50">
                  <p className="text-sm text-gray-600 flex justify-between max-w-xs">
                    <span>Deuda Acumulada:</span>
                    <span className="font-medium text-red-600">{formatearMonto(deudaBrutaTotal)}</span>
                  </p>
                  <p className="text-sm text-gray-600 flex justify-between max-w-xs">
                    <span>- Saldo Utilizado:</span>
                    <span className="font-medium text-blue-600">
                      {formatearMonto(saldoFavor >= deudaBrutaTotal ? deudaBrutaTotal : saldoFavor)}
                    </span>
                  </p>
                  <p className="text-sm font-bold text-gray-900 flex justify-between max-w-xs mt-1 pt-1 border-t border-gray-200">
                    <span>Deuda Efectiva Neta:</span>
                    <span className={deudaEfectiva > 0 ? "text-red-700" : "text-green-600"}>
                      {formatearMonto(deudaEfectiva)}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
              <div className="w-full">
                <Input
                  label={deudaEfectiva > 0 ? "Monto a Pagar" : "Cargar Saldo"}
                  type="number"
                  placeholder="Ej: 300000"
                  value={montoPrepago}
                  onChange={(e) => setMontoPrepago(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCargarSaldo}
                disabled={loadingWallet || (!montoPrepago && deudaEfectiva <= 0)}
                isLoading={loadingWallet}
                className="w-full"
              >
                Pagar con KHIPU
              </Button>
              {deudaEfectiva > 0 && (
                <Button
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() => setMontoPrepago(deudaEfectiva.toString())}
                >
                  Cargar deuda exacta
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Pagos Históricos Pendientes (Referenciales) */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Estado de Cuenta Mensual</h2>
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
            {pagosPendientes.map((pago) => {
              // Simular la cascada visual aquí también (opcional pero ayuda al usuario a entender)
              // Los más antiguos se descuentan primero
              const pagosOrdenadosAsc = [...pagosPendientes].sort((a, b) => (a.periodo || '').localeCompare(b.periodo || ''))
              const miIndice = pagosOrdenadosAsc.findIndex(p => p.id === pago.id)
              const deudaAcumuladaAntesDeMi = pagosOrdenadosAsc.slice(0, miIndice).reduce((acc, curr) => acc + (curr.monto - (curr.monto_pagado || 0)), 0)

              let estadoVisual = 'pendiente'
              const dBruta = pago.monto - (pago.monto_pagado || 0)

              if (saldoFavor >= deudaAcumuladaAntesDeMi + dBruta) {
                estadoVisual = 'cubierto'
              } else if (saldoFavor > deudaAcumuladaAntesDeMi) {
                estadoVisual = 'cubierto_parcial'
              }

              return (
                <Card key={pago.id} className={estadoVisual === 'cubierto' ? 'opacity-70 bg-gray-50' : ''}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        Gasto Común {formatearPeriodo(pago.periodo)}
                        {estadoVisual === 'cubierto' && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-normal">
                            Cubierto por saldo
                          </span>
                        )}
                        {estadoVisual === 'cubierto_parcial' && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-normal">
                            Cubierto parcialmente
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>Vence a fin de mes</span>
                      </div>
                      {pago.estado === 'rechazado' && (
                        <div className="mt-2">
                          <Badge variant="error" children="Pago Rechazado" />
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">Monto</p>
                      <p className={`text-xl font-bold ${estadoVisual === 'cubierto' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {formatearMonto(pago.monto)}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

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

/**
 * Dashboard del Vecino
 *
 * Página principal del vecino que muestra:
 * - Resumen de estado de pagos
 * - Acciones rápidas
 * - Últimos movimientos
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Badge, Spinner } from '@/shared/ui'
import { getMisPagos, getDepartamento, getGastosMensuales } from '@/shared/api'
import { useAuth } from '@/app/providers'
import type { Pago, Departamento, GastoMensual } from '@/shared/types'
import {
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'



export const DashboardPage = () => {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [pagos, setPagos] = useState<Pago[]>([])
  const [departamento, setDepartamento] = useState<Departamento | null>(null)
  const [gastos, setGastos] = useState<GastoMensual[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Solo llamar getMisPagos si el usuario tiene departamento (vecinos, no admin)
        let pagosData: Pago[] = []
        const tieneDepto = usuario?.departamento_id || usuario?.departamentoId
        if (tieneDepto) {
          try {
            pagosData = await getMisPagos()
          } catch {
            // Si falla por alguna razón, seguimos con pagos vacíos
          }
        }
        const [deptoData, gastosData] = await Promise.all([
          tieneDepto ? getDepartamento(tieneDepto) : Promise.resolve(null),
          getGastosMensuales(24)
        ])
        setPagos(pagosData)
        setDepartamento(deptoData)
        setGastos(gastosData)
      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [usuario?.id, usuario?.departamento_id, usuario?.departamentoId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  // Calcular deuda real (comparando gastos vs pagos)
  let deudaTotal = 0
  let cantidadPendientes = 0
  const pagosMap = new Map()
  pagos.forEach(p => pagosMap.set(p.periodo, p))

  // Iterar gastos para encontrar impagos
  if (departamento && gastos.length > 0) {
    gastos.forEach(gasto => {
      const pago = pagosMap.get(gasto.periodo)
      // Si no hay pago O está pendiente/rechazado
      if (!pago || pago.estado === 'pendiente' || pago.estado === 'rechazado') {
        // Si existe el pago pendiente usamos su monto, si no calculamos
        const monto = pago ? pago.monto : Math.round((gasto.valor_por_m2 || 0) * (departamento.metros_cuadrados || 0))
        deudaTotal += monto
        cantidadPendientes++
      }
    })
  } else {
    // Fallback si no hay datos de depto/gastos (usar lógica antigua)
    const pagosPendientes = pagos.filter((p) => p.estado === 'pendiente')
    deudaTotal = pagosPendientes.reduce((sum, p) => sum + p.monto, 0)
    cantidadPendientes = pagosPendientes.length
  }

  const ultimoPago = pagos.filter((p) => p.estado === 'pagado').sort((a, b) =>
    new Date(b.fecha_pago || b.created_at || '').getTime() > new Date(a.fecha_pago || a.created_at || '').getTime() ? 1 : -1
  )[0]

  // Obtener período actual (YYYY-MM)
  const now = new Date()
  const periodoActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const pagoMesActual = pagos.find((p) => p.periodo === periodoActual)
  // Determinar estado actual basado en si encontramos pago o no
  const estadoMesActual = pagoMesActual ? pagoMesActual.estado : 'pendiente'

  // Últimos 5 movimientos
  const ultimosMovimientos = [...pagos]
    .sort((a, b) => new Date(b.created_at || b.fecha_pago || '').getTime() - new Date(a.created_at || a.fecha_pago || '').getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel Principal</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido, {usuario?.nombre || 'Vecino'} - Departamento {departamento?.numero || 'N/A'}
        </p>
      </div>

      {/* Resumen de Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Deuda Total */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Deuda Pendiente</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${deudaTotal.toLocaleString('es-CL')}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {cantidadPendientes} {cantidadPendientes === 1 ? 'pago' : 'pagos'} pendientes
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </Card>

        {/* Saldo a Favor (Billetera Virtual) */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo a Favor</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ${(departamento?.saldo_a_favor || 0).toLocaleString('es-CL')}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Billetera Virtual
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Último Pago */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Último Pago</p>
              {ultimoPago ? (
                <>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ${ultimoPago.monto.toLocaleString('es-CL')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(ultimoPago.fecha_pago || ultimoPago.created_at || '').toLocaleDateString(
                      'es-CL'
                    )}
                  </p>
                </>
              ) : (
                <p className="text-lg text-gray-500 mt-2">Sin pagos registrados</p>
              )}
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Estado Mes Actual */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mes Actual</p>
              {estadoMesActual !== 'pendiente' ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {estadoMesActual === 'pagado' && 'Al Día'}
                    {estadoMesActual === 'verificando' && 'En Verificación'}
                    {estadoMesActual === 'rechazado' && 'Rechazado'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-orange-600 mt-2">Pendiente</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                  </p>
                </>
              )}
            </div>
            <div
              className={`p-3 rounded-full ${estadoMesActual === 'pagado'
                ? 'bg-green-100'
                : estadoMesActual === 'verificando'
                  ? 'bg-yellow-100'
                  : 'bg-orange-100'
                }`}
            >
              <Calendar
                className={`w-8 h-8 ${estadoMesActual === 'pagado'
                  ? 'text-green-600'
                  : estadoMesActual === 'verificando'
                    ? 'text-yellow-600'
                    : 'text-orange-600'
                  }`}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/pagos')}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Realizar Pago</h3>
                <p className="text-sm text-gray-600">Enviar comprobante o pagar online</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/historial')}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Ver Historial</h3>
                <p className="text-sm text-gray-600">Consulta tus pagos anteriores</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/contacto')}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Contactar Admin</h3>
                <p className="text-sm text-gray-600">Envía un mensaje al administrador</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Últimos Movimientos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Últimos Movimientos</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/historial')}>
            Ver todo
          </Button>
        </div>

        <Card>
          {ultimosMovimientos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {ultimosMovimientos.map((pago) => (
                <div key={pago.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-full ${pago.estado === 'pagado'
                          ? 'bg-green-100'
                          : pago.estado === 'verificando'
                            ? 'bg-yellow-100'
                            : pago.estado === 'rechazado'
                              ? 'bg-red-100'
                              : 'bg-gray-100'
                          }`}
                      >
                        {pago.estado === 'pagado' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                        {pago.estado === 'verificando' && <Clock className="w-5 h-5 text-yellow-600" />}
                        {pago.estado === 'rechazado' && <XCircle className="w-5 h-5 text-red-600" />}
                        {pago.estado === 'pendiente' && (
                          <AlertCircle className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Pago {pago.periodo.split('-')[1]}/{pago.periodo.split('-')[0]}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(pago.created_at || pago.fecha_pago || '').toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${pago.monto.toLocaleString('es-CL')}
                      </p>
                      <Badge
                        variant={
                          pago.estado === 'pagado'
                            ? 'success'
                            : pago.estado === 'verificando'
                              ? 'warning'
                              : pago.estado === 'rechazado'
                                ? 'error'
                                : 'default'
                        }
                      >
                        {pago.estado === 'pagado' && 'Pagado'}
                        {pago.estado === 'verificando' && 'Verificando'}
                        {pago.estado === 'rechazado' && 'Rechazado'}
                        {pago.estado === 'pendiente' && 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

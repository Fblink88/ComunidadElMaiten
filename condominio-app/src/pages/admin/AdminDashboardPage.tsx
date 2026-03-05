/**
 * Dashboard del Administrador
 *
 * Página principal del admin que muestra:
 * - Métricas generales del condominio
 * - Estado de pagos y recaudación
 * - Actividad reciente
 * - Departamentos con deuda
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Badge, Spinner, Modal } from '@/shared/ui'
import {
  getDepartamentos,
  getPagosPendientes,
  getAllPagos,
  getGastosMensuales,
  seedData,
  clearData,
} from '@/shared/api'
import type { GastoMensual, Pago, Departamento } from '@/shared/types'
import {
  Building2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Database,
  Trash2,
  RefreshCw,
} from 'lucide-react'

export const AdminDashboardPage = () => {
  const navigate = useNavigate()
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [pagosDelMes, setPagosDelMes] = useState<Pago[]>([])
  const [pagosGlobales, setPagosGlobales] = useState<Pago[]>([])
  const [gastosGlobales, setGastosGlobales] = useState<GastoMensual[]>([])
  const [pagosVerificando, setPagosVerificando] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [seedingLoading, setSeedingLoading] = useState(false)
  const [showSeedModal, setShowSeedModal] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // Obtener periodo actual
      const now = new Date()
      const periodoActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      const [deptosData, pagosTodos, verificandoData, gastosTodos] = await Promise.all([
        getDepartamentos(),
        getAllPagos(1000),
        getPagosPendientes(),
        getGastosMensuales(60),
      ])

      setDepartamentos(deptosData.filter((d) => d.activo))
      setPagosGlobales(pagosTodos)
      setGastosGlobales(gastosTodos)
      setPagosDelMes(pagosTodos.filter(p => p.periodo === periodoActual))
      setPagosVerificando(verificandoData.filter((p) => p.estado === 'verificando'))
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedData = async () => {
    setSeedingLoading(true)
    try {
      await seedData()
      setShowSeedModal(false)
      await cargarDatos()
      alert('Datos de prueba generados exitosamente')
    } catch (error) {
      console.error(error)
      alert('Error al generar datos')
    } finally {
      setSeedingLoading(false)
    }
  }

  const handleClearData = async () => {
    setSeedingLoading(true)
    try {
      await clearData()
      setShowClearModal(false)
      await cargarDatos()
      alert('Datos de prueba eliminados exitosamente')
    } catch (error) {
      console.error(error)
      alert('Error al eliminar datos')
    } finally {
      setSeedingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  // Calcular métricas
  const totalDepartamentos = departamentos.length

  // Departamentos al día: no deben nada luego de descontar saldo a favor
  let deptosAlDiaCount = 0
  const deptosConDeuda: Departamento[] = []
  departamentos.forEach(depto => {
    const pagosDepto = pagosGlobales.filter(p => p.departamento_id === depto.id && p.estado !== 'proyectado')
    let totalAdeudado = 0
    pagosDepto.forEach(pago => {
      if (pago.estado === 'pendiente' || pago.estado === 'rechazado') {
        const faltante = pago.monto - (pago.monto_pagado || 0)
        if (faltante > 0) totalAdeudado += faltante
      }
    })
    const saldoAFavor = depto.saldo_a_favor || 0
    const deudaNeta = Math.max(0, totalAdeudado - saldoAFavor)
    if (deudaNeta === 0) {
      deptosAlDiaCount++
    } else {
      deptosConDeuda.push(depto)
    }
  })

  const pagosPendientes = totalDepartamentos - deptosAlDiaCount

  const tasaRecaudacion = totalDepartamentos > 0
    ? Math.round((deptosAlDiaCount / totalDepartamentos) * 100)
    : 0

  // Cálculo del Balance Global histórico similar al Reporte Financiero Anual
  let totalRecaudadoHist = 0
  let totalGastadoHist = 0
  gastosGlobales.forEach(g => {
    const y = g.periodo.split("-")[0]
    if (Number(y) >= 2025) totalGastadoHist += g.total
  })
  pagosGlobales.forEach(p => {
    if (p.estado === 'pagado') {
      const y = p.periodo.split("-")[0]
      if (Number(y) >= 2025) totalRecaudadoHist += p.monto
    }
  })

  const saldoInicial = 870306
  const balanceActualTotal = saldoInicial + totalRecaudadoHist - totalGastadoHist
  const ingresosMostrados = saldoInicial + totalRecaudadoHist

  // Actividad restante de la BD
  const actividadReciente = [...pagosDelMes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600 mt-1">
          Resumen general del condominio y actividad reciente
        </p>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Departamentos */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departamentos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalDepartamentos}</p>
              <p className="text-sm text-gray-500 mt-1">Total activos</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Pagos Al Día */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Al Día</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{deptosAlDiaCount}</p>
              <p className="text-sm text-gray-500 mt-1">{tasaRecaudacion}% del total</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Pendientes */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pagosPendientes}</p>
              <p className="text-sm text-gray-500 mt-1">
                {pagosVerificando.length} verificando
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </Card>

        {/* Total Recaudado / Balance */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Balance Actual (Caja)</p>
              <p className={`text-3xl font-bold mt-2 ${balanceActualTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${balanceActualTotal.toLocaleString('es-CL')}
              </p>
              <div className="flex gap-4 mt-1 text-xs text-gray-500">
                <span>Ingresos Hist.: ${ingresosMostrados.toLocaleString('es-CL')}</span>
                <span>Gastos Hist.: ${totalGastadoHist.toLocaleString('es-CL')}</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Alertas y Acciones Rápidas */}
      {pagosVerificando.length > 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Clock className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Tienes {pagosVerificando.length} {pagosVerificando.length === 1 ? 'pago' : 'pagos'} esperando verificación
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Revisa y aprueba los comprobantes de transferencia manual
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/pagos?estado=verificando')}>
              Revisar
            </Button>
          </div>
        </Card>
      )}

      {/* Grid de Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departamentos con Deuda */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Departamentos con Deuda</h2>
              <Badge variant="error">{deptosConDeuda.length}</Badge>
            </div>
          </div>

          {deptosConDeuda.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <p>¡Todos los departamentos están al día!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {deptosConDeuda.slice(0, 5).map((depto) => (
                <div key={depto.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Depto {depto.numero}</p>
                      <p className="text-sm text-gray-600">{depto.propietario}</p>
                    </div>
                    <Badge variant="warning">Pendiente</Badge>
                  </div>
                </div>
              ))}
              {deptosConDeuda.length > 5 && (
                <div className="p-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/departamentos')}
                  >
                    Ver todos ({deptosConDeuda.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/pagos')}>
                Ver todo
              </Button>
            </div>
          </div>

          {actividadReciente.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No hay actividad registrada este mes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {actividadReciente.map((pago) => {
                const depto = departamentos.find((d) => d.id === pago.departamento_id)
                return (
                  <div key={pago.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-full ${pago.estado === 'pagado'
                            ? 'bg-green-100'
                            : pago.estado === 'verificando'
                              ? 'bg-yellow-100'
                              : 'bg-gray-100'
                            }`}
                        >
                          {pago.estado === 'pagado' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : pago.estado === 'verificando' ? (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Depto {depto?.numero || '?'} - {pago.periodo}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(pago.created_at).toLocaleDateString('es-CL', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ${pago.monto.toLocaleString('es-CL')}
                        </p>
                        <Badge
                          variant={
                            pago.estado === 'pagado'
                              ? 'success'
                              : pago.estado === 'verificando'
                                ? 'warning'
                                : 'default'
                          }
                          className="text-xs"
                        >
                          {pago.estado}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Acciones Rápidas (Bottom) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/admin/departamentos')}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gestionar Departamentos</h3>
              <p className="text-sm text-gray-600">Administra departamentos y usuarios</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/admin/gastos')}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gestionar Gastos</h3>
              <p className="text-sm text-gray-600">Crea y edita gastos mensuales</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/admin/usuarios')}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gestionar Usuarios</h3>
              <p className="text-sm text-gray-600">Administra roles y permisos</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gestión de Datos de Prueba */}
      <Card className="p-6 border-blue-200 bg-blue-50/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Datos de Prueba</h3>
              <p className="text-sm text-gray-600">Herramientas para desarrollo y pruebas del sistema</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => setShowClearModal(true)}
              disabled={seedingLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar Datos
            </Button>
            <Button
              onClick={() => setShowSeedModal(true)}
              disabled={seedingLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Generar Datos
            </Button>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <Modal
        isOpen={showSeedModal}
        onClose={() => setShowSeedModal(false)}
        title="Generar Datos de Prueba"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Se generarán 10 departamentos, 10 propietarios, 5 arrendatarios y pagos de prueba asociados.
            Esto es útil para probar el sistema con datos "reales".
          </p>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-800">
                Esta acción no borrará los datos existentes, pero podría duplicar información si ya existen datos.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowSeedModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSeedData} isLoading={seedingLoading}>
              Generar Datos
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Limpiar Datos de Prueba"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro? Esta acción eliminará permanentemente:
          </p>
          <ul className="list-disc list-inside text-gray-600 ml-2">
            <li>Todos los departamentos</li>
            <li>Todos los pagos y gastos</li>
            <li>Todos los usuarios (excepto administradores)</li>
          </ul>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-800 font-medium">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowClearModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleClearData}
              isLoading={seedingLoading}
            >
              Sí, eliminar todo
            </Button>
          </div>
        </div>
      </Modal>
    </div >
  )
}

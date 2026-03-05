/**
 * Página de Gestión de Gastos (Admin)
 *
 * Permite al administrador:
 * - Crear gastos mensuales con múltiples items
 * - Crear gastos extraordinarios
 * - Ver historial de gastos
 * - Ver detalles de cada gasto
 * - Marcar pagos de gastos extraordinarios
 */

import { useState, useEffect } from 'react'
import { Card, Button, Modal, Input } from '@/shared/ui'
import {
  getGastosMensuales,
  getGastosExtraordinarios,
  createGastoMensual,
  updateGastoMensual,
  createGastoExtraordinario,
  marcarPagoExtraordinario,
  type GastoMensual,
  type GastoExtraordinario,
  type ItemGasto,
} from '@/shared/api'
import { getDepartamentos, type Departamento } from '@/shared/api'
import {
  DollarSign,
  Plus,
  Eye,
  Calendar,
  FileText,
  TrendingUp,
  AlertCircle,
  X,
  Check,
  Pencil,
} from 'lucide-react'

/**
 * Componente principal de la página de Gestión de Gastos.
 */
export const GastosPage = () => {
  // Estados para datos
  const [gastosMensuales, setGastosMensuales] = useState<GastoMensual[]>([])
  const [gastosExtraordinarios, setGastosExtraordinarios] = useState<GastoExtraordinario[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para tabs
  const [activeTab, setActiveTab] = useState<'mensuales' | 'extraordinarios'>('mensuales')
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear())

  // Estados para modales - Gastos Mensuales
  const [showModalGastoMensual, setShowModalGastoMensual] = useState(false)
  const [showDetalleGastoMensual, setShowDetalleGastoMensual] = useState(false)
  const [gastoMensualSeleccionado, setGastoMensualSeleccionado] = useState<GastoMensual | null>(
    null
  )
  const [editingGasto, setEditingGasto] = useState<GastoMensual | null>(null)

  // Estados para modales - Gastos Extraordinarios
  const [showModalGastoExtraordinario, setShowModalGastoExtraordinario] = useState(false)
  const [showDetalleGastoExtraordinario, setShowDetalleGastoExtraordinario] =
    useState(false)
  const [gastoExtraordinarioSeleccionado, setGastoExtraordinarioSeleccionado] =
    useState<GastoExtraordinario | null>(null)

  // Estados del formulario de gasto mensual
  const [periodo, setPeriodo] = useState('')
  const [items, setItems] = useState<ItemGasto[]>([{ concepto: '', monto: 0 }])

  // Estados del formulario de gasto extraordinario
  const [conceptoExtra, setConceptoExtra] = useState('')
  const [montoTotalExtra, setMontoTotalExtra] = useState(0)
  const [montoPorDeptoExtra, setMontoPorDeptoExtra] = useState(0)

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [mensuales, extraordinarios, deptos] = await Promise.all([
        getGastosMensuales(),
        getGastosExtraordinarios(),
        getDepartamentos(),
      ])
      setGastosMensuales(mensuales)
      setGastosExtraordinarios(extraordinarios)
      setDepartamentos(deptos)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  const totalGastosMensuales = gastosMensuales.length
  const totalGastosExtraordinarios = gastosExtraordinarios.length

  // Monto del mes actual
  const mesActual = new Date().toISOString().slice(0, 7) // "YYYY-MM"
  const gastoMesActual = gastosMensuales.find((g) => g.periodo === mesActual)
  const montoMesActual = gastoMesActual?.total || 0

  // Gastos extraordinarios pendientes
  const gastosExtraordinariosPendientes = gastosExtraordinarios.filter((g) => {
    const totalDeptos = Object.keys(g.pagos).length
    const deptosPagados = Object.values(g.pagos).filter((p) => p).length
    return deptosPagados < totalDeptos
  }).length

  // ============================================
  // HANDLERS - GASTOS MENSUALES
  // ============================================

  const handleGuardarGastoMensual = async () => {
    try {
      // Validaciones
      if (!periodo) {
        alert('Debes seleccionar un periodo')
        return
      }

      if (items.length === 0 || items.some((i) => !i.concepto || i.monto <= 0)) {
        alert('Debes agregar al menos un item válido')
        return
      }

      if (editingGasto) {
        await updateGastoMensual(editingGasto.periodo, { items })
      } else {
        await createGastoMensual({
          periodo,
          items,
        })
      }

      // Recargar datos y cerrar modal
      await cargarDatos()
      setShowModalGastoMensual(false)
      resetFormGastoMensual()
    } catch (error) {
      console.error('Error guardando gasto mensual:', error)
      alert('Error al guardar el gasto mensual')
    }
  }

  const resetFormGastoMensual = () => {
    setPeriodo('')
    setItems([{ concepto: '', monto: 0 }])
    setEditingGasto(null)
  }

  const handleEditarGasto = (gasto: GastoMensual) => {
    setEditingGasto(gasto)
    setPeriodo(gasto.periodo)
    setItems(gasto.items.map(i => ({ concepto: i.concepto, monto: i.monto })))
    setShowModalGastoMensual(true)
  }

  const agregarItem = () => {
    setItems([...items, { concepto: '', monto: 0 }])
  }

  const eliminarItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const actualizarItem = (index: number, campo: 'concepto' | 'monto', valor: string | number) => {
    const nuevosItems = [...items]
    nuevosItems[index] = { ...nuevosItems[index], [campo]: valor }
    setItems(nuevosItems)
  }

  const calcularTotalItems = () => {
    return items.reduce((sum, item) => sum + (item.monto || 0), 0)
  }

  const verDetalleGastoMensual = (gasto: GastoMensual) => {
    setGastoMensualSeleccionado(gasto)
    setShowDetalleGastoMensual(true)
  }

  // ============================================
  // HANDLERS - GASTOS EXTRAORDINARIOS
  // ============================================

  const handleCrearGastoExtraordinario = async () => {
    try {
      // Validaciones
      if (!conceptoExtra) {
        alert('Debes ingresar un concepto')
        return
      }

      if (montoTotalExtra <= 0 || montoPorDeptoExtra <= 0) {
        alert('Los montos deben ser mayores a 0')
        return
      }

      await createGastoExtraordinario({
        concepto: conceptoExtra,
        monto_total: montoTotalExtra,
        monto_por_depto: montoPorDeptoExtra,
      })

      // Recargar datos y cerrar modal
      await cargarDatos()
      setShowModalGastoExtraordinario(false)
      resetFormGastoExtraordinario()
    } catch (error) {
      console.error('Error creando gasto extraordinario:', error)
      alert('Error al crear el gasto extraordinario')
    }
  }

  const resetFormGastoExtraordinario = () => {
    setConceptoExtra('')
    setMontoTotalExtra(0)
    setMontoPorDeptoExtra(0)
  }

  const verDetalleGastoExtraordinario = (gasto: GastoExtraordinario) => {
    setGastoExtraordinarioSeleccionado(gasto)
    setShowDetalleGastoExtraordinario(true)
  }

  const handleMarcarPago = async (gastoId: string, departamentoId: string) => {
    try {
      await marcarPagoExtraordinario(gastoId, departamentoId)
      await cargarDatos()

      // Actualizar el gasto seleccionado si está abierto el detalle
      if (gastoExtraordinarioSeleccionado?.id === gastoId) {
        const gastoActualizado = gastosExtraordinarios.find((g) => g.id === gastoId)
        if (gastoActualizado) {
          setGastoExtraordinarioSeleccionado(gastoActualizado)
        }
      }
    } catch (error) {
      console.error('Error marcando pago:', error)
      alert('Error al marcar el pago')
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(monto)
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

  const obtenerNombreDepartamento = (id: string) => {
    const depto = departamentos.find((d) => d.id === id)
    return depto ? `Depto ${depto.numero}` : id
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-gray-500">Cargando gastos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Gastos</h1>
        <p className="text-gray-500 mt-1">Administra los gastos mensuales y extraordinarios</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Gastos Mensuales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalGastosMensuales}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Gastos Extraordinarios</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalGastosExtraordinarios}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Monto Mes Actual</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatearMonto(montoMesActual)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Extraordinarios Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {gastosExtraordinariosPendientes}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('mensuales')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'mensuales'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Gastos Mensuales
          </button>
          <button
            onClick={() => setActiveTab('extraordinarios')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'extraordinarios'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Gastos Extraordinarios
          </button>
        </nav>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'mensuales' && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Gastos Mensuales de {anioSeleccionado}</h2>
              <div className="flex gap-4 items-center">
                <div className="flex gap-2 items-center mr-4">
                  <button
                    onClick={() => setAnioSeleccionado(prev => prev - 1)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 font-medium"
                  >
                    Anterior
                  </button>
                  <span className="font-bold text-gray-800 px-2">{anioSeleccionado}</span>
                  <button
                    onClick={() => setAnioSeleccionado(prev => prev + 1)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 font-medium"
                  >
                    Siguiente
                  </button>
                </div>
                <Button onClick={() => setShowModalGastoMensual(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Gasto Mensual
                </Button>
              </div>
            </div>

            {gastosMensuales.filter((g) => g.periodo.startsWith(anioSeleccionado.toString())).length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay gastos mensuales registrados</p>
                <Button onClick={() => setShowModalGastoMensual(true)} className="mt-4">
                  Crear primer gasto mensual
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Periodo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Saldo Mes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {gastosMensuales.filter((g) => g.periodo.startsWith(anioSeleccionado.toString())).map((gasto) => (
                      <tr key={gasto.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatearPeriodo(gasto.periodo)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {gasto.items.length} item{gasto.items.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatearMonto(gasto.total)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${(gasto.saldo_mes || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatearMonto(gasto.saldo_mes || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatearFecha(gasto.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditarGasto(gasto)}
                            className="text-yellow-600 hover:text-yellow-900 mr-3"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => verDetalleGastoMensual(gasto)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver Detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'extraordinarios' && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Gastos Extraordinarios</h2>
              <Button onClick={() => setShowModalGastoExtraordinario(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Gasto Extraordinario
              </Button>
            </div>

            {gastosExtraordinarios.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay gastos extraordinarios registrados</p>
                <Button onClick={() => setShowModalGastoExtraordinario(true)} className="mt-4">
                  Crear primer gasto extraordinario
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Concepto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto/Depto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {gastosExtraordinarios.map((gasto) => {
                      const totalDeptos = Object.keys(gasto.pagos).length
                      const deptosPagados = Object.values(gasto.pagos).filter((p) => p).length

                      return (
                        <tr key={gasto.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {gasto.concepto}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatearMonto(gasto.monto_total)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatearMonto(gasto.monto_por_depto)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatearFecha(gasto.fecha)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {deptosPagados} / {totalDeptos} pagados
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => verDetalleGastoExtraordinario(gasto)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Modal: Crear Gasto Mensual */}
      <Modal
        isOpen={showModalGastoMensual}
        onClose={() => {
          setShowModalGastoMensual(false)
          resetFormGastoMensual()
        }}
        title={editingGasto ? "Editar Gasto Mensual" : "Crear Gasto Mensual"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
            <Input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              placeholder="YYYY-MM"
              readOnly={!!editingGasto}
              className={editingGasto ? "bg-gray-100" : ""}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Items de Gasto</label>
              <Button onClick={agregarItem} size="sm" variant="secondary">
                <Plus className="w-4 h-4 mr-1" />
                Agregar Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Concepto (ej: Agua, Luz, Gas)"
                      value={item.concepto}
                      onChange={(e) => actualizarItem(index, 'concepto', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      placeholder="Monto"
                      value={item.monto || ''}
                      onChange={(e) => actualizarItem(index, 'monto', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      onClick={() => eliminarItem(index)}
                      className="mt-2 text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Total:</span>
              <span className="font-bold text-gray-900">{formatearMonto(calcularTotalItems())}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleGuardarGastoMensual} className="flex-1">
              {editingGasto ? "Guardar Cambios" : "Crear Gasto Mensual"}
            </Button>
            <Button
              onClick={() => {
                setShowModalGastoMensual(false)
                resetFormGastoMensual()
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Detalle Gasto Mensual */}
      <Modal
        isOpen={showDetalleGastoMensual}
        onClose={() => setShowDetalleGastoMensual(false)}
        title={`Detalle Gasto - ${gastoMensualSeleccionado ? formatearPeriodo(gastoMensualSeleccionado.periodo) : ''}`}
      >
        {gastoMensualSeleccionado && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Periodo</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatearPeriodo(gastoMensualSeleccionado.periodo)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Creado</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatearFecha(gastoMensualSeleccionado.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatearMonto(gastoMensualSeleccionado.total)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Saldo del Mes</p>
                <p className={`text-base font-semibold ${(gastoMensualSeleccionado.saldo_mes || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatearMonto(gastoMensualSeleccionado.saldo_mes || 0)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Items de Gasto</p>
              <div className="space-y-2">
                {gastoMensualSeleccionado.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-900">{item.concepto}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatearMonto(item.monto)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={() => setShowDetalleGastoMensual(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal: Crear Gasto Extraordinario */}
      <Modal
        isOpen={showModalGastoExtraordinario}
        onClose={() => {
          setShowModalGastoExtraordinario(false)
          resetFormGastoExtraordinario()
        }}
        title="Crear Gasto Extraordinario"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
            <Input
              placeholder="Ej: Reparación ascensor, Pintura fachada"
              value={conceptoExtra}
              onChange={(e) => setConceptoExtra(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total</label>
            <Input
              type="number"
              placeholder="Monto total del gasto"
              value={montoTotalExtra || ''}
              onChange={(e) => setMontoTotalExtra(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto por Departamento
            </label>
            <Input
              type="number"
              placeholder="Monto que debe pagar cada depto"
              value={montoPorDeptoExtra || ''}
              onChange={(e) => setMontoPorDeptoExtra(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleCrearGastoExtraordinario} className="flex-1">
              Crear Gasto Extraordinario
            </Button>
            <Button
              onClick={() => {
                setShowModalGastoExtraordinario(false)
                resetFormGastoExtraordinario()
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Detalle Gasto Extraordinario */}
      <Modal
        isOpen={showDetalleGastoExtraordinario}
        onClose={() => setShowDetalleGastoExtraordinario(false)}
        title="Detalle Gasto Extraordinario"
      >
        {gastoExtraordinarioSeleccionado && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Concepto</p>
                <p className="text-base font-semibold text-gray-900">
                  {gastoExtraordinarioSeleccionado.concepto}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatearFecha(gastoExtraordinarioSeleccionado.fecha)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monto Total</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatearMonto(gastoExtraordinarioSeleccionado.monto_total)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monto por Depto</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatearMonto(gastoExtraordinarioSeleccionado.monto_por_depto)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Estado de Pagos</p>
              <div className="space-y-2">
                {Object.entries(gastoExtraordinarioSeleccionado.pagos).map(([deptoId, pagado]) => (
                  <div
                    key={deptoId}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-900">
                      {obtenerNombreDepartamento(deptoId)}
                    </span>
                    <div className="flex items-center gap-2">
                      {pagado ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Pagado
                        </span>
                      ) : (
                        <Button
                          onClick={() =>
                            handleMarcarPago(gastoExtraordinarioSeleccionado.id, deptoId)
                          }
                          size="sm"
                          variant="secondary"
                        >
                          Marcar como pagado
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={() => setShowDetalleGastoExtraordinario(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

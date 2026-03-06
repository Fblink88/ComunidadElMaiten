/**
 * Gestión de Departamentos
 *
 * Página para administrar departamentos del condominio:
 * - Lista de departamentos con información clave
 * - Crear, editar, desactivar departamentos
 * - Ver usuarios asociados
 * - Gestionar usuarios del departamento
 */

import { useEffect, useState } from 'react'
import { Card, Button, Badge, Spinner, Modal, Input } from '@/shared/ui'
import {
  getDepartamentos,
  getDepartamento,
  createDepartamento,
  updateDepartamento,
  deleteDepartamento,
  getUsuariosByDepartamento,
  aplicarAumentoMasivo,
  ajustarSaldoBilletera,
  getHistorialBilletera
} from '@/shared/api'
import { getAllTransacciones, getAllPagos } from '@/shared/api/pagos.api'

import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Home,
  Ruler,
  DollarSign,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Schemas de validación
const departamentoSchema = z.object({
  numero: z.string().min(1, 'El número es requerido'),
  propietario: z.string().min(3, 'El nombre del propietario debe tener al menos 3 caracteres'),
  metros_cuadrados: z.number().min(1, 'Los metros cuadrados deben ser mayores a 0'),
  cuota_mensual: z.number().min(0, 'La cuota debe ser mayor o igual a 0').optional(),
})

type DepartamentoFormData = z.infer<typeof departamentoSchema>

interface Departamento {
  id: string
  numero: string
  propietario: string
  metros_cuadrados: number
  cuota_mensual: number
  saldo_a_favor: number
  activo: boolean
  usuarios_ids: string[]
  created_at: string
  updated_at: string
}

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
}

export const DepartamentosPage = () => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showUsuariosModal, setShowUsuariosModal] = useState(false)
  const [editingDepto, setEditingDepto] = useState<Departamento | null>(null)
  const [selectedDepto, setSelectedDepto] = useState<Departamento | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Estado para detalles (Tabs: Usuarios / Billetera)
  const [activeTab, setActiveTab] = useState<'usuarios' | 'billetera'>('usuarios')
  // Lista unificada de movimientos (movimientos billetera + transacciones históricas)
  const [billeteraMovimientos, setBilleteraMovimientos] = useState<any[]>([])
  const [loadingBilletera, setLoadingBilletera] = useState(false)
  const [montoAjuste, setMontoAjuste] = useState<number | ''>('')
  const [motivoAjuste, setMotivoAjuste] = useState<string>('')
  const [ajustando, setAjustando] = useState(false)
  const [deudaEfectiva, setDeudaEfectiva] = useState<number>(0)
  const [saldoNeto, setSaldoNeto] = useState<number>(0)

  // Estado para el modal de Aumento Masivo
  const [showAumentoModal, setShowAumentoModal] = useState(false)
  const [porcentajeAumento, setPorcentajeAumento] = useState<number>(10)
  const currentYearMonth = new Date().toISOString().slice(0, 7)
  const [periodoInicioAumento, setPeriodoInicioAumento] = useState<string>(currentYearMonth)
  const [aumentando, setAumentando] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartamentoFormData>({
    resolver: zodResolver(departamentoSchema),
  })

  // Cargar departamentos
  useEffect(() => {
    cargarDepartamentos()
  }, [])

  const cargarDepartamentos = async () => {
    try {
      setLoading(true)
      const data = await getDepartamentos()
      // Ordenar departamentos numéricamente
      const sorted = data.sort((a, b) =>
        a.numero.localeCompare(b.numero, undefined, { numeric: true })
      )
      setDepartamentos(sorted)
    } catch (error) {
      console.error('Error cargando departamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal para crear
  const handleCrear = () => {
    setEditingDepto(null)
    reset({
      numero: '',
      propietario: '',
      metros_cuadrados: 0,
      cuota_mensual: 0,
    })
    setShowModal(true)
  }

  // Abrir modal para editar
  const handleEditar = (depto: Departamento) => {
    setEditingDepto(depto)
    reset({
      numero: depto.numero,
      propietario: depto.propietario,
      metros_cuadrados: depto.metros_cuadrados,
      cuota_mensual: depto.cuota_mensual,
    })
    setShowModal(true)
  }

  // Enviar formulario (crear o editar)
  const onSubmit = async (data: DepartamentoFormData) => {
    try {
      setSubmitting(true)

      if (editingDepto) {
        // Editar
        await updateDepartamento(editingDepto.id, data)
      } else {
        // Crear
        await createDepartamento(data)
      }

      setShowModal(false)
      reset()
      await cargarDepartamentos()
    } catch (error) {
      console.error('Error guardando departamento:', error)
      alert('Error al guardar el departamento')
    } finally {
      setSubmitting(false)
    }
  }

  // Desactivar/Activar departamento
  const handleToggleActivo = async (depto: Departamento) => {
    if (!confirm(`¿Estás seguro de ${depto.activo ? 'desactivar' : 'activar'} este departamento?`)) {
      return
    }

    try {
      await updateDepartamento(depto.id, { activo: !depto.activo })
      await cargarDepartamentos()
    } catch (error) {
      console.error('Error actualizando departamento:', error)
      alert('Error al actualizar el departamento')
    }
  }

  // Eliminar departamento
  const handleEliminar = async (depto: Departamento) => {
    if (!confirm(`¿Estás seguro de eliminar el departamento ${depto.numero}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await deleteDepartamento(depto.id)
      await cargarDepartamentos()
    } catch (error) {
      console.error('Error eliminando departamento:', error)
      alert('Error al eliminar el departamento')
    }
  }

  // Ver detalles del departamento (Usuarios y Billetera)
  const handleVerDetalles = async (depto: Departamento) => {
    try {
      setSelectedDepto(depto)
      setActiveTab('usuarios')
      setShowUsuariosModal(true) // Reusamos este state para "Modales de detalle"

      // Cargar Usuarios
      const usuariosData = await getUsuariosByDepartamento(depto.id)
      setUsuarios(usuariosData)

      // Cargar historial unificado: transacciones + billetera_movimientos
      setLoadingBilletera(true)
      const [todasTransacciones, todosPagos, billMovs] = await Promise.all([
        getAllTransacciones(),
        getAllPagos(),
        getHistorialBilletera(depto.id)
      ])

      // Transacciones del depto (abonos históricos, pagos online, etc.)
      const transDepto = todasTransacciones
        .filter(t => t.departamento_id === depto.id)
        .map(t => ({
          id: t.id,
          fecha: t.fecha,
          monto_cambio: t.monto_total,
          motivo: t.notas && t.notas !== '-' ? t.notas : 'Abono / Transacción',
          saldo_resultante: null as any,
          _source: 'transaccion'
        }))

      // Movimientos de billetera (ajustes manuales)
      const billDepto = billMovs.map(b => ({
        id: b.id,
        fecha: b.fecha,
        monto_cambio: b.monto_cambio,
        motivo: b.motivo || 'Ajuste manual',
        saldo_resultante: b.saldo_resultante,
        _source: 'billetera'
      }))

      // Unificar y deduplicar (futuro dual-write: mismo monto+motivo en +-2s = duplicado)
      const todos = [...transDepto]
      for (const bm of billDepto) {
        const isDuplicate = transDepto.some(t =>
          t.monto_cambio === bm.monto_cambio &&
          t.motivo === bm.motivo &&
          Math.abs(new Date(t.fecha).getTime() - new Date(bm.fecha).getTime()) < 2000
        )
        if (!isDuplicate) todos.push(bm)
      }
      todos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      setBilleteraMovimientos(todos)

      // Cascada igual que MatrizDeudas: usar departamento_id (snake_case del API)
      const pagosDepto = todosPagos.filter((p: any) => p.departamento_id === depto.id)
      let saldoRestante = depto.saldo_a_favor || 0
      const pendientes = pagosDepto
        .filter((p: any) => p.estado === 'pendiente' || p.estado === 'rechazado')
        .sort((a: any, b: any) => (a.periodo || '').localeCompare(b.periodo || ''))
      let deudaEfectivaCalc = 0
      for (const p of pendientes) {
        const deudaBruta = (p as any).monto - ((p as any).monto_pagado || 0)
        if (saldoRestante >= deudaBruta) {
          saldoRestante -= deudaBruta
        } else {
          deudaEfectivaCalc += deudaBruta - saldoRestante
          saldoRestante = 0
        }
      }
      setDeudaEfectiva(deudaEfectivaCalc)
      setSaldoNeto(saldoRestante)

      setLoadingBilletera(false)
    } catch (error) {
      console.error('Error cargando detalles:', error)
      alert('Error al cargar los detalles')
      setLoadingBilletera(false)
    }
  }

  // Ajustar billetera
  const handleAjustarBilletera = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDepto) return
    if (!montoAjuste || montoAjuste === 0) return alert('Ingresa un monto diferente de cero')
    if (motivoAjuste.length < 5) return alert('El motivo debe tener al menos 5 caracteres')

    try {
      setAjustando(true)
      await ajustarSaldoBilletera(selectedDepto.id, Number(montoAjuste), motivoAjuste)

      // Recargar historial unificado
      const [todasTransacciones2, billMovs2] = await Promise.all([
        getAllTransacciones(),
        getHistorialBilletera(selectedDepto.id)
      ])
      const transDepto2 = todasTransacciones2
        .filter(t => t.departamento_id === selectedDepto.id)
        .map(t => ({
          id: t.id,
          fecha: t.fecha,
          monto_cambio: t.monto_total,
          motivo: t.notas && t.notas !== '-' ? t.notas : 'Abono / Transacción',
          saldo_resultante: null as any,
          _source: 'transaccion'
        }))
      const billDepto2 = billMovs2.map(b => ({
        id: b.id,
        fecha: b.fecha,
        monto_cambio: b.monto_cambio,
        motivo: b.motivo || 'Ajuste manual',
        saldo_resultante: b.saldo_resultante,
        _source: 'billetera'
      }))
      const todos2 = [...transDepto2]
      for (const bm of billDepto2) {
        const isDuplicate = transDepto2.some(t =>
          t.monto_cambio === bm.monto_cambio &&
          t.motivo === bm.motivo &&
          Math.abs(new Date(t.fecha).getTime() - new Date(bm.fecha).getTime()) < 2000
        )
        if (!isDuplicate) todos2.push(bm)
      }
      todos2.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      setBilleteraMovimientos(todos2)

      // FETCH TRUE STATE FROM DB
      const deptoActualizado = await getDepartamento(selectedDepto.id)

      // Actualizar tabla y modal con la nueva memoria
      setDepartamentos(deps => deps.map(d =>
        d.id === selectedDepto.id ? deptoActualizado : d
      ))
      setSelectedDepto(deptoActualizado)

      // Recalcular deuda con cascada (usar departamento_id snake_case del API)
      const todosPagos3 = await getAllPagos()
      const pagosDepto3 = todosPagos3.filter((p: any) => p.departamento_id === selectedDepto.id)
      let saldoRestante3 = (deptoActualizado.saldo_a_favor || 0)
      const pendientes3 = pagosDepto3
        .filter((p: any) => p.estado === 'pendiente' || p.estado === 'rechazado')
        .sort((a: any, b: any) => (a.periodo || '').localeCompare(b.periodo || ''))
      let deudaEfectivaCalc3 = 0
      for (const p of pendientes3) {
        const db3 = (p as any).monto - ((p as any).monto_pagado || 0)
        if (saldoRestante3 >= db3) {
          saldoRestante3 -= db3
        } else {
          deudaEfectivaCalc3 += db3 - saldoRestante3
          saldoRestante3 = 0
        }
      }
      setDeudaEfectiva(deudaEfectivaCalc3)
      setSaldoNeto(saldoRestante3)

      alert('Ajuste realizado exitosamente')
      setMontoAjuste('')
      setMotivoAjuste('')
    } catch (error: any) {
      console.error('Error ajustando billetera:', error)
      alert(error.response?.data?.detail || 'Error al realizar el ajuste')
    } finally {
      setAjustando(false)
    }
  }

  // Ejecutar el aumento masivo
  const handleAumentoMasivo = async () => {
    if (porcentajeAumento === 0) {
      alert('El porcentaje debe ser diferente de 0')
      return
    }

    if (!periodoInicioAumento.match(/^\d{4}-\d{2}$/)) {
      alert('El periodo de inicio debe tener el formato YYYY-MM')
      return
    }

    if (!confirm(`¿Estás seguro de aumentar la cuota de TODOS los departamentos en un ${porcentajeAumento}% a partir del periodo ${periodoInicioAumento}?`)) {
      return
    }

    try {
      setAumentando(true)
      const res = await aplicarAumentoMasivo(porcentajeAumento, periodoInicioAumento)
      alert(res.mensaje)
      setShowAumentoModal(false)
      await cargarDepartamentos()
    } catch (error: any) {
      console.error('Error aplicando aumento:', error)
      alert(error.response?.data?.detail || 'Error al aplicar el aumento masivo')
    } finally {
      setAumentando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Departamentos</h1>
          <p className="text-gray-600 mt-1">Administra los departamentos del condominio</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setShowAumentoModal(true)} className="border border-red-200 text-red-600 hover:bg-red-50">
            <TrendingUp className="w-4 h-4 mr-2" />
            Aumento Masivo de Cuota
          </Button>
          <Button onClick={handleCrear}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Departamento
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Departamentos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{departamentos.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {departamentos.filter((d) => d.activo).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">
                {departamentos.filter((d) => !d.activo).length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <XCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de departamentos */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Departamentos</h2>
        </div>

        {departamentos.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay departamentos</h3>
            <p className="text-gray-600 mb-6">Comienza creando el primer departamento</p>
            <Button onClick={handleCrear}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Departamento
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Home className="w-4 h-4" />
                      <span>Número</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propietario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Ruler className="w-4 h-4" />
                      <span>m²</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Cuota Mensual</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Usuarios</span>
                    </div>
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
                {departamentos.map((depto) => (
                  <tr key={depto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-bold">{depto.numero}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">Depto {depto.numero}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{depto.propietario}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{depto.metros_cuadrados} m²</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${depto.cuota_mensual.toLocaleString('es-CL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerDetalles(depto)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {depto.usuarios_ids.length} {depto.usuarios_ids.length === 1 ? 'usuario' : 'usuarios'}
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={depto.activo ? 'success' : 'default'}>
                        {depto.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditar(depto)}
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerDetalles(depto)}
                          title="Ver Detalles (Usuarios y Billetera)"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActivo(depto)}
                          title={depto.activo ? 'Desactivar' : 'Activar'}
                        >
                          {depto.activo ? (
                            <XCircle className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminar(depto)}
                          title="Eliminar"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Crear/Editar Departamento */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          reset()
        }}
        title={editingDepto ? 'Editar Departamento' : 'Nuevo Departamento'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Número de Departamento"
            {...register('numero')}
            error={errors.numero?.message}
            placeholder="Ej: 101, 201, etc."
          />

          <Input
            label="Propietario"
            {...register('propietario')}
            error={errors.propietario?.message}
            placeholder="Nombre completo del propietario"
          />

          <Input
            label="Metros Cuadrados"
            type="number"
            step="0.01"
            {...register('metros_cuadrados', { valueAsNumber: true })}
            error={errors.metros_cuadrados?.message}
            placeholder="Ej: 45.5"
          />

          <Input
            label="Cuota Mensual (opcional)"
            type="number"
            step="1"
            {...register('cuota_mensual', { valueAsNumber: true })}
            error={errors.cuota_mensual?.message}
            placeholder="Ej: 50000"
          />

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowModal(false)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : editingDepto ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalles Departamento */}
      <Modal
        isOpen={showUsuariosModal}
        onClose={() => setShowUsuariosModal(false)}
        title={`Detalles - Departamento ${selectedDepto?.numero}`}
      >
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`py-2 px-4 text-sm font-medium border-b-2 ${activeTab === 'usuarios'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('usuarios')}
          >
            Usuarios Asociados
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium border-b-2 ${activeTab === 'billetera'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('billetera')}
          >
            Billetera Virtual
          </button>
        </div>

        {activeTab === 'usuarios' && (
          <>
            {usuarios.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No hay usuarios asociados a este departamento</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {usuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{usuario.nombre}</p>
                      <p className="text-sm text-gray-600">{usuario.email}</p>
                    </div>
                    <Badge>{usuario.rol}</Badge>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'billetera' && (
          <div className="space-y-6">
            <div className={`p-4 rounded-lg flex items-center justify-between border ${deudaEfectiva > 0 ? 'bg-red-50 border-red-100' : saldoNeto > 0 ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
              <div>
                <p className={`text-sm font-medium ${deudaEfectiva > 0 ? 'text-red-800' : saldoNeto > 0 ? 'text-blue-800' : 'text-green-800'}`}>
                  {deudaEfectiva > 0 ? 'Deuda Pendiente' : saldoNeto > 0 ? 'Saldo a Favor' : 'Al Día ✓'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Wallet className={`w-5 h-5 ${deudaEfectiva > 0 ? 'text-red-600' : saldoNeto > 0 ? 'text-blue-600' : 'text-green-600'}`} />
                  <span className={`text-2xl font-bold ${deudaEfectiva > 0 ? 'text-red-600' : saldoNeto > 0 ? 'text-blue-900' : 'text-green-700'}`}>
                    ${deudaEfectiva > 0 ? deudaEfectiva.toLocaleString('es-CL') : saldoNeto > 0 ? saldoNeto.toLocaleString('es-CL') : '0'}
                  </span>
                </div>
              </div>
            </div>

            <Card className="p-4 border border-gray-200 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3 text-sm">Nuevo Ajuste Manual</h4>
              <form onSubmit={handleAjustarBilletera} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Monto (CLP)</label>
                    <input
                      type="number"
                      required
                      value={montoAjuste}
                      onChange={(e) => setMontoAjuste(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ej: -37254 o 15000"
                      className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Usar negativo (-) para retiros</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Motivo</label>
                    <input
                      type="text"
                      required
                      value={motivoAjuste}
                      onChange={(e) => setMotivoAjuste(e.target.value)}
                      placeholder="Ej: Devolución Agosto"
                      className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit" size="sm" disabled={ajustando}>
                    {ajustando ? 'Procesando...' : 'Aplicar Ajuste'}
                  </Button>
                </div>
              </form>
            </Card>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" /> Historial de Movimientos
              </h4>

              {loadingBilletera ? (
                <div className="py-6 flex justify-center"><Spinner size="sm" /></div>
              ) : billeteraMovimientos.length === 0 ? (
                <div className="py-4 text-center text-gray-500 text-sm bg-gray-50 rounded-lg">
                  No hay movimientos registrados en la billetera.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {billeteraMovimientos.map((mov) => (
                    <div key={mov.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-800 font-medium">
                          {mov.motivo || 'Ajuste manual'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(mov.fecha).toLocaleString('es-CL')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-semibold rounded px-2 py-0.5 ${mov.monto_cambio >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {mov.monto_cambio > 0 ? '+' : ''}{mov.monto_cambio.toLocaleString('es-CL')}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Saldo: ${(mov.saldo_resultante || 0).toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={() => setShowUsuariosModal(false)}>
            Cerrar
          </Button>
        </div>
      </Modal>

      {/* Modal Aumento Masivo */}
      <Modal
        isOpen={showAumentoModal}
        onClose={() => setShowAumentoModal(false)}
        title="Aumento Programado de Cuotas Base"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Atención:</strong> Vas a aumentar la Cuota Base de <strong>todos</strong> los departamentos activos. Además, los cobros proyectados desde el periodo indicado también se actualizarán.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje de Aumento (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={porcentajeAumento}
                onChange={(e) => setPorcentajeAumento(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej. 10 para aumentar 10% o -10 para disminuir"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                A partir de (YYYY-MM)
              </label>
              <input
                type="month"
                value={periodoInicioAumento}
                onChange={(e) => setPeriodoInicioAumento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAumentoModal(false)}
              disabled={aumentando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAumentoMasivo}
              disabled={aumentando || porcentajeAumento === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {aumentando ? (
                <div className="flex items-center">
                  <Spinner size="sm" />
                  <span className="ml-2">Aplicando...</span>
                </div>
              ) : (
                'Confirmar'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

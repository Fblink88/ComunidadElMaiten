/**
 * Componente AutorizarArrendatario
 *
 * Formulario para que un propietario autorice directamente a un arrendatario
 * para realizar pagos sin necesidad de solicitud previa.
 */

import { useState, useEffect } from 'react'
import { Button, Input, Card } from '@/shared/ui'
import { autorizarDirectamente, getUsuariosByDepartamento } from '@/shared/api'
import type { TipoAutorizacion } from '@/shared/types'
import { Plus, X, Shield } from 'lucide-react'
import { useAuth } from '@/app/providers'

interface AutorizarArrendatarioProps {
  onSuccess?: () => void
}

export const AutorizarArrendatario = ({ onSuccess }: AutorizarArrendatarioProps) => {
  const { usuario } = useAuth()
  const [arrendatarios, setArrendatarios] = useState<any[]>([])
  const [arrendatarioSeleccionado, setArrendatarioSeleccionado] = useState('')
  const [tipo, setTipo] = useState<TipoAutorizacion>('permanente')
  const [periodos, setPeriodos] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [loadingArrendatarios, setLoadingArrendatarios] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarArrendatarios()
  }, [usuario?.departamento_id])

  const cargarArrendatarios = async () => {
    if (!usuario?.departamento_id) {
      setLoadingArrendatarios(false)
      return
    }

    try {
      setLoadingArrendatarios(true)
      const usuarios = await getUsuariosByDepartamento(usuario.departamento_id)
      // Filtrar solo arrendatarios
      const arrendatariosDelDepto = usuarios.filter((u) => u.rol === 'arrendatario')
      setArrendatarios(arrendatariosDelDepto)
    } catch (error) {
      console.error('Error cargando arrendatarios:', error)
    } finally {
      setLoadingArrendatarios(false)
    }
  }

  const agregarPeriodo = () => {
    setPeriodos([...periodos, ''])
  }

  const eliminarPeriodo = (index: number) => {
    if (periodos.length > 1) {
      setPeriodos(periodos.filter((_, i) => i !== index))
    }
  }

  const actualizarPeriodo = (index: number, valor: string) => {
    const nuevosPeriodos = [...periodos]
    nuevosPeriodos[index] = valor
    setPeriodos(nuevosPeriodos)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!arrendatarioSeleccionado) {
      setError('Debes seleccionar un arrendatario')
      return
    }

    if (tipo === 'ocasional') {
      const periodosValidos = periodos.filter((p) => p.trim() !== '')
      if (periodosValidos.length === 0) {
        setError('Debes agregar al menos un periodo para autorización ocasional')
        return
      }

      const formatoInvalido = periodosValidos.some((p) => !/^\d{4}-\d{2}$/.test(p))
      if (formatoInvalido) {
        setError('Los periodos deben tener formato YYYY-MM (ej: 2025-01)')
        return
      }
    }

    try {
      setLoading(true)

      await autorizarDirectamente({
        arrendatario_id: arrendatarioSeleccionado,
        tipo,
        periodos_autorizados: tipo === 'ocasional' ? periodos.filter((p) => p.trim() !== '') : undefined,
      })

      // Limpiar formulario
      setArrendatarioSeleccionado('')
      setTipo('permanente')
      setPeriodos([''])

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error('Error autorizando arrendatario:', err)
      setError(err.response?.data?.detail || 'Error al autorizar arrendatario')
    } finally {
      setLoading(false)
    }
  }

  if (loadingArrendatarios) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-gray-500">Cargando arrendatarios...</p>
        </div>
      </Card>
    )
  }

  if (arrendatarios.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay arrendatarios en tu departamento</p>
          <p className="text-sm text-gray-400 mt-2">
            Solo puedes autorizar a arrendatarios que pertenezcan a tu departamento
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Autorizar Arrendatario</h2>
          <p className="text-sm text-gray-500 mt-1">
            Autoriza a un arrendatario para realizar pagos de gastos comunes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleccionar arrendatario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Arrendatario
            </label>
            <select
              value={arrendatarioSeleccionado}
              onChange={(e) => setArrendatarioSeleccionado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Selecciona un arrendatario --</option>
              {arrendatarios.map((arrendatario) => (
                <option key={arrendatario.id} value={arrendatario.id}>
                  {arrendatario.nombre} ({arrendatario.email})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de autorización */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Autorización
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="permanente"
                  checked={tipo === 'permanente'}
                  onChange={(e) => setTipo(e.target.value as TipoAutorizacion)}
                  className="mr-2"
                />
                <div>
                  <span className="font-medium">Permanente</span>
                  <p className="text-sm text-gray-500">
                    El arrendatario podrá pagar todos los periodos futuros
                  </p>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="ocasional"
                  checked={tipo === 'ocasional'}
                  onChange={(e) => setTipo(e.target.value as TipoAutorizacion)}
                  className="mr-2"
                />
                <div>
                  <span className="font-medium">Ocasional</span>
                  <p className="text-sm text-gray-500">
                    El arrendatario podrá pagar solo periodos específicos
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Periodos autorizados */}
          {tipo === 'ocasional' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Periodos a Autorizar
                </label>
                <Button type="button" onClick={agregarPeriodo} size="sm" variant="secondary">
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Periodo
                </Button>
              </div>

              <div className="space-y-2">
                {periodos.map((periodo, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      type="month"
                      value={periodo}
                      onChange={(e) => actualizarPeriodo(index, e.target.value)}
                      placeholder="YYYY-MM"
                    />
                    {periodos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarPeriodo(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              <Shield className="w-4 h-4 mr-2" />
              {loading ? 'Autorizando...' : 'Autorizar Arrendatario'}
            </Button>
          </div>
        </form>
      </div >
    </Card >
  )
}

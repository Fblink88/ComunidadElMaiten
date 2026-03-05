/**
 * Componente SolicitudAutorizacion
 *
 * Formulario para que un arrendatario solicite autorización
 * al propietario para realizar pagos de gastos comunes.
 */

import { useState } from 'react'
import { Button, Input, Card } from '@/shared/ui'
import { solicitarAutorizacion } from '@/shared/api'
import type { TipoAutorizacion } from '@/shared/types'
import { Plus, X, Send } from 'lucide-react'

interface SolicitudAutorizacionProps {
  onSuccess?: () => void
}

export const SolicitudAutorizacion = ({ onSuccess }: SolicitudAutorizacionProps) => {
  const [tipo, setTipo] = useState<TipoAutorizacion>('permanente')
  const [periodos, setPeriodos] = useState<string[]>([''])
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (tipo === 'ocasional') {
      const periodosValidos = periodos.filter((p) => p.trim() !== '')
      if (periodosValidos.length === 0) {
        setError('Debes agregar al menos un periodo para autorización ocasional')
        return
      }

      // Validar formato YYYY-MM
      const formatoInvalido = periodosValidos.some((p) => !/^\d{4}-\d{2}$/.test(p))
      if (formatoInvalido) {
        setError('Los periodos deben tener formato YYYY-MM (ej: 2025-01)')
        return
      }
    }

    try {
      setLoading(true)

      await solicitarAutorizacion({
        tipo,
        periodos_autorizados: tipo === 'ocasional' ? periodos.filter((p) => p.trim() !== '') : undefined,
        nota_solicitud: nota || undefined,
      })

      // Limpiar formulario
      setTipo('permanente')
      setPeriodos([''])
      setNota('')

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error('Error solicitando autorización:', err)
      setError(err.response?.data?.detail || 'Error al solicitar autorización')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Solicitar Autorización para Pagar</h2>
          <p className="text-sm text-gray-500 mt-1">
            Solicita permiso al propietario para realizar pagos de gastos comunes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                    Podrás pagar todos los periodos futuros sin necesidad de solicitar nuevamente
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
                    Podrás pagar solo los periodos específicos que selecciones
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Periodos autorizados (solo si es ocasional) */}
          {tipo === 'ocasional' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Periodos a Solicitar
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
              <p className="text-xs text-gray-500 mt-2">
                Ejemplo: 2025-01 para Enero 2025
              </p>
            </div>
          )}

          {/* Nota para el propietario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje para el Propietario (Opcional)
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Explica por qué necesitas la autorización..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}

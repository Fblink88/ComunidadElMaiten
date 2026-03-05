/**
 * Página de Confirmación de Pago
 *
 * Se muestra cuando el usuario regresa de Khipu después de completar un pago.
 */

import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, Button, Spinner } from '@/shared/ui'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { apiClient, getErrorMessage } from '@/shared/api/client'

export const PagoConfirmacionPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const pagoId = searchParams.get('pago_id')

  const [verificando, setVerificando] = useState(true)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verificarPago = async () => {
      if (!pagoId) {
        setError('No se encontró el ID del pago')
        setVerificando(false)
        return
      }

      try {
        const response = await apiClient.get(`/api/pagos/${pagoId}`)
        const pago = response.data

        // Si el estado es pagado o verificando, considerar exitoso
        if (pago.estado !== 'pagado' && pago.estado !== 'verificando') {
          setError('El pago no pudo ser verificado. Por favor contacta al administrador.')
        }
      } catch (err) {
        const errorMsg = getErrorMessage(err)
        setError(errorMsg || 'Error al verificar el pago')
      } finally {
        setVerificando(false)
      }
    }

    verificarPago()
  }, [pagoId])

  const handleVolverAPagos = () => {
    navigate('/dashboard/pagos')
  }

  if (verificando) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card>
          <div className="text-center py-12">
            <Spinner size="lg" />
            <div className="mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Verificando tu pago...
            </h2>
            <p className="text-gray-600">
              Estamos confirmando tu pago con Khipu. Esto tomará solo unos segundos.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Hubo un problema
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={handleVolverAPagos}>
              Volver a Mis Pagos
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Pago Exitoso!
          </h2>
          <p className="text-gray-600 mb-2">
            Tu pago ha sido procesado correctamente.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Recibirás un correo de confirmación en breve.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Estado:</strong> El pago está siendo verificado por Khipu.
              Una vez confirmado, se actualizará automáticamente en tu historial.
            </p>
          </div>

          <Button onClick={handleVolverAPagos}>
            Volver a Mis Pagos
          </Button>
        </div>
      </Card>
    </div>
  )
}

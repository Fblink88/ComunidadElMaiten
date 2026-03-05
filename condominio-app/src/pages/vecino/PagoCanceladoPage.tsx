/**
 * Página de Pago Cancelado
 *
 * Se muestra cuando el usuario cancela el pago en Khipu.
 */

import { useNavigate } from 'react-router-dom'
import { Card, Button } from '@/shared/ui'
import { XCircle } from 'lucide-react'

export const PagoCanceladoPage = () => {
  const navigate = useNavigate()

  const handleVolverAPagos = () => {
    navigate('/dashboard/pagos')
  }

  const handleIntentarNuevamente = () => {
    navigate('/dashboard/pagos')
  }

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Pago Cancelado
          </h2>
          <p className="text-gray-600 mb-6">
            Has cancelado el proceso de pago. Tu pago sigue pendiente.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              No te preocupes, puedes intentar pagar nuevamente cuando quieras o
              enviar un comprobante de transferencia manual.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={handleIntentarNuevamente}>
              Intentar Nuevamente
            </Button>
            <Button variant="secondary" onClick={handleVolverAPagos}>
              Volver a Mis Pagos
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

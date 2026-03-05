/**
 * Página de Realizar Pago
 *
 * Esta página permite a los vecinos enviar un comprobante de pago manual.
 * Muestra el formulario para ingresar los datos de la transferencia bancaria.
 */

import { ComprobanteForm } from "@/features/realizar-pago"
import { Card } from "@/shared/ui"

export const RealizarPagoPage = () => {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Enviar Comprobante de Pago</h1>
        <p className="text-gray-600 mt-2">
          Completa el formulario con los datos de tu transferencia bancaria. El
          administrador recibirá un correo con la información para verificar tu pago.
        </p>
      </div>

      {/* Card con el formulario */}
      <Card>
        <ComprobanteForm />
      </Card>

      {/* Instrucciones adicionales */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">Importante:</h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>Asegúrate de haber realizado la transferencia antes de enviar el formulario</li>
          <li>Verifica que el monto ingresado sea exacto al transferido</li>
          <li>La fecha y hora deben coincidir con las de tu comprobante bancario</li>
          <li>
            El administrador verificará tu pago y actualizará el estado en el sistema
          </li>
        </ul>
      </div>
    </div>
  )
}

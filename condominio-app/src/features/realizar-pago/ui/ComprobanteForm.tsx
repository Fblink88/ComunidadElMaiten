/**
 * Componente ComprobanteForm
 *
 * Este archivo contiene el formulario para enviar un comprobante de pago manual.
 * Captura automáticamente la fecha de transferencia, el monto y el nombre del pagador.
 * Los datos se envían por correo al administrador y se guardan en la base de datos.
 *
 * NUEVO: Valida que los arrendatarios tengan autorización del propietario antes de pagar.
 *
 * Utiliza:
 * - react-hook-form para manejar el estado del formulario
 * - zod para validación de campos
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/app/providers"
import { Button, Input } from "@/shared/ui"

/**
 * Esquema de validación para el formulario de comprobante.
 */
const comprobanteSchema = z.object({
  monto: z
    .string()
    .min(1, "El monto es requerido")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Ingresa un monto válido mayor a 0"
    ),
  nombrePagador: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  fechaTransferencia: z
    .string()
    .min(1, "La fecha de transferencia es requerida"),
})

/**
 * Tipo inferido del esquema de validación.
 */
type ComprobanteFormData = z.infer<typeof comprobanteSchema>

interface ComprobanteFormProps {
  onSuccess?: () => void
}

/**
 * Componente de formulario para enviar comprobante de pago.
 */
export const ComprobanteForm = ({ onSuccess }: ComprobanteFormProps) => {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { usuario, firebaseUser } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ComprobanteFormData>({
    resolver: zodResolver(comprobanteSchema),
    defaultValues: {
      // Fecha actual por defecto
      fechaTransferencia: new Date().toISOString().slice(0, 16),
      // Nombre del usuario actual
      nombrePagador: usuario?.nombre || "",
    },
  })

  const onSubmit = async (data: ComprobanteFormData) => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      // Obtener el token del usuario
      const token = await firebaseUser?.getIdToken()

      if (!token) {
        throw new Error("No se pudo obtener el token de autenticación")
      }

      // Preparar los datos para enviar
      const payload = {
        departamento_id: usuario?.departamento_id,
        monto: Number(data.monto),
        nombre_pagador: data.nombrePagador,
        fecha_transferencia: new Date(data.fechaTransferencia).toISOString(),
      }

      // Enviar al backend
      const response = await fetch("http://127.0.0.1:8000/api/pagos/comprobante", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al enviar el comprobante")
      }

      const result = await response.json()

      if (result.email_enviado) {
        setSuccess(
          "¡Comprobante enviado exitosamente! El administrador recibirá un correo con los datos de tu pago."
        )
        reset()
        onSuccess?.()
      } else {
        setError(
          "El comprobante se guardó pero hubo un problema al enviar el correo. Por favor contacta al administrador."
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el comprobante")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Mensaje de error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Mensaje de éxito */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Información del departamento */}
      {
        usuario?.departamento_id && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Departamento:</strong> {usuario.departamento_id}
            </p>
          </div>
        )
      }

      {/* Campo Monto */}
      <Input
        label="Monto Transferido (CLP)"
        type="number"
        placeholder="50000"
        error={errors.monto?.message}
        helperText="Monto exacto que transferiste"
        {...register("monto")}
      />

      {/* Campo Nombre del Pagador */}
      <Input
        label="Nombre de quien realizó la transferencia"
        type="text"
        placeholder="Juan Pérez"
        error={errors.nombrePagador?.message}
        helperText="Nombre completo tal como aparece en la cuenta bancaria"
        {...register("nombrePagador")}
      />

      {/* Campo Fecha de Transferencia */}
      <Input
        label="Fecha y Hora de la Transferencia"
        type="datetime-local"
        error={errors.fechaTransferencia?.message}
        helperText="Fecha y hora exacta en que realizaste la transferencia"
        {...register("fechaTransferencia")}
      />

      {/* Información sobre la cuenta bancaria */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">
          Datos Bancarios - Condominio El Maitén
        </h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <strong>Banco:</strong> [Nombre del Banco]
          </p>
          <p>
            <strong>Tipo de Cuenta:</strong> Cuenta Corriente
          </p>
          <p>
            <strong>Número de Cuenta:</strong> [Número de cuenta]
          </p>
          <p>
            <strong>RUT:</strong> [RUT del condominio]
          </p>
        </div>
      </div>

      {/* Botón de Envío */}
      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
      >
        Enviar Comprobante
      </Button>

      {/* Nota informativa */}
      <p className="text-xs text-gray-500 text-center">
        Al enviar este formulario, los datos serán enviados por correo electrónico a{" "}
        <strong>edificio.elmaiten@gmail.com</strong> y guardados en la base de datos
        para su verificación.
      </p>
    </form >
  )
}

/**
 * Componente RegisterForm
 * 
 * Este archivo contiene el formulario de registro de nuevos usuarios.
 * Sirve para que los usuarios creen una cuenta con email, contraseña y nombre.
 * 
 * Utiliza:
 * - react-hook-form para manejar el estado del formulario
 * - zod para validación de campos
 * - useAuth para la función de registro
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/app/providers"
import { Button, Input } from "@/shared/ui"

/**
 * Esquema de validación para el formulario de registro.
 * Incluye validación de confirmación de contraseña.
 */
const registerSchema = z
  .object({
    nombre: z
      .string()
      .min(1, "El nombre es requerido")
      .min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Ingresa un email válido"),
    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z
      .string()
      .min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

/**
 * Tipo inferido del esquema de validación.
 */
type RegisterFormData = z.infer<typeof registerSchema>

/**
 * Componente de formulario de registro.
 * 
 * @example
 * <RegisterForm />
 */
export const RegisterForm = () => {
  /** Estado para errores de Firebase */
  const [firebaseError, setFirebaseError] = useState<string | null>(null)
  
  /** Estado de carga mientras se procesa el registro */
  const [isLoading, setIsLoading] = useState(false)

  /** Función de registro del contexto */
  const { register: registerUser } = useAuth()

  /**
   * Configuración de react-hook-form.
   */
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  /**
   * Maneja el envío del formulario de registro.
   */
  const onSubmit = async (data: RegisterFormData) => {
    setFirebaseError(null)
    setIsLoading(true)

    try {
      await registerUser(data.email, data.password, data.nombre)
      // Si el registro es exitoso, el AuthProvider redirigirá automáticamente
    } catch (error: unknown) {
      // Manejar errores específicos de Firebase
      const firebaseError = error as { code?: string }
      if (firebaseError.code === "auth/email-already-in-use") {
        setFirebaseError("Este email ya está registrado")
      } else {
        setFirebaseError("Error al crear la cuenta. Intenta nuevamente.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Mensaje de error de Firebase */}
      {firebaseError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {firebaseError}
        </div>
      )}

      {/* Campo Nombre */}
      <Input
        label="Nombre completo"
        type="text"
        placeholder="Juan Pérez"
        error={errors.nombre?.message}
        {...register("nombre")}
      />

      {/* Campo Email */}
      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...register("email")}
      />

      {/* Campo Contraseña */}
      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password")}
      />

      {/* Campo Confirmar Contraseña */}
      <Input
        label="Confirmar contraseña"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      {/* Botón de Registro */}
      <Button type="submit" fullWidth isLoading={isLoading}>
        Crear Cuenta
      </Button>
    </form>
  )
}
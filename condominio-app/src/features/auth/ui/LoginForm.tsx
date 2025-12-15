/**
 * Componente LoginForm
 * 
 * Este archivo contiene el formulario de inicio de sesión.
 * Sirve para que los usuarios ingresen sus credenciales (email y contraseña)
 * o inicien sesión con Google.
 * 
 * Utiliza:
 * - react-hook-form para manejar el estado del formulario
 * - zod para validación de campos
 * - useAuth para las funciones de autenticación
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/app/providers"
import { Button, Input } from "@/shared/ui"

/**
 * Esquema de validación para el formulario de login.
 * Define las reglas que deben cumplir los campos.
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Ingresa un email válido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
})

/**
 * Tipo inferido del esquema de validación.
 * TypeScript sabe automáticamente qué campos tiene el formulario.
 */
type LoginFormData = z.infer<typeof loginSchema>

/**
 * Componente de formulario de login.
 * 
 * @example
 * <LoginForm />
 */
export const LoginForm = () => {
  /** Estado para errores de Firebase (credenciales inválidas, etc.) */
  const [firebaseError, setFirebaseError] = useState<string | null>(null)
  
  /** Estado de carga mientras se procesa el login */
  const [isLoading, setIsLoading] = useState(false)

  /** Funciones de autenticación del contexto */
  const { login, loginWithGoogle } = useAuth()

  /**
   * Configuración de react-hook-form.
   * - register: Conecta inputs al formulario
   * - handleSubmit: Maneja el envío del formulario
   * - formState.errors: Contiene errores de validación
   */
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  /**
   * Maneja el envío del formulario.
   * Se ejecuta solo si la validación de zod pasa.
   */
  const onSubmit = async (data: LoginFormData) => {
    setFirebaseError(null)
    setIsLoading(true)

    try {
      await login(data.email, data.password)
      // Si el login es exitoso, el AuthProvider redirigirá automáticamente
    } catch {
      // Manejar errores de Firebase
      setFirebaseError("Email o contraseña incorrectos")
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Maneja el login con Google.
   */
  const handleGoogleLogin = async () => {
    setFirebaseError(null)
    setIsLoading(true)

    try {
      await loginWithGoogle()
    } catch  {
      setFirebaseError("Error al iniciar sesión con Google")
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

      {/* Botón de Login */}
      <Button type="submit" fullWidth isLoading={isLoading}>
        Iniciar Sesión
      </Button>

      {/* Separador */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">o continúa con</span>
        </div>
      </div>

      {/* Botón de Google */}
{/* Botón de Google */}
      <Button
        type="button"
        variant="secondary"
        fullWidth
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Iniciar sesión con Google
        </span>
      </Button>
    </form>
  )
}
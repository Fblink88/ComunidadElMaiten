import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/app/providers"
import { Button, Input } from "@/shared/ui"

// Números de departamentos del edificio (hardcodeados, no requieren auth)
const DEPARTAMENTOS = ["11", "12", "21", "22", "31", "32", "41", "42", "51", "52"]

const registerSchema = z
  .object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Ingresa un email válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    departamento_numero: z.string().min(1, "Selecciona tu departamento"),
    rol: z.enum(["vecino", "propietario", "arrendatario"] as const, {
      message: "Selecciona un rol",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export const RegisterForm = () => {
  const [firebaseError, setFirebaseError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register: registerUser } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setFirebaseError(null)
    setIsLoading(true)
    try {
      await registerUser(data.email, data.password, data.nombre, data.departamento_numero, data.rol)
    } catch (error: unknown) {
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

  const rolLabels: Record<string, string> = {
    vecino: "Vecino (residente)",
    propietario: "Propietario del departamento",
    arrendatario: "Arrendatario",
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {firebaseError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {firebaseError}
        </div>
      )}

      <Input
        label="Nombre completo"
        type="text"
        placeholder="Juan Pérez"
        error={errors.nombre?.message}
        {...register("nombre")}
      />

      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password")}
      />

      <Input
        label="Confirmar contraseña"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      {/* Selección de Departamento por número */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ¿En qué departamento vives?
        </label>
        <select
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.departamento_numero ? "border-red-400" : "border-gray-300"
            }`}
          {...register("departamento_numero")}
        >
          <option value="">— Selecciona el número de tu depto —</option>
          {DEPARTAMENTOS.map((num) => (
            <option key={num} value={num}>
              Departamento {num}
            </option>
          ))}
        </select>
        {errors.departamento_numero && (
          <p className="text-red-500 text-xs mt-1">{errors.departamento_numero.message}</p>
        )}
      </div>

      {/* Selección de Rol */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ¿Cuál es tu rol en el departamento?
        </label>
        <select
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.rol ? "border-red-400" : "border-gray-300"
            }`}
          {...register("rol")}
        >
          <option value="">— Selecciona tu rol —</option>
          {(["vecino", "propietario", "arrendatario"] as const).map((r) => (
            <option key={r} value={r}>
              {rolLabels[r]}
            </option>
          ))}
        </select>
        {errors.rol && (
          <p className="text-red-500 text-xs mt-1">{errors.rol.message}</p>
        )}
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs">
        ℹ️ Tu cuenta quedará pendiente de aprobación por el administrador o el propietario del departamento.
      </div>

      <Button type="submit" fullWidth isLoading={isLoading}>
        Solicitar Acceso
      </Button>
    </form>
  )
}
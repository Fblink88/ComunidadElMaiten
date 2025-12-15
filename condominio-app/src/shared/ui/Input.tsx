/**
 * Componente Input
 * 
 * Este archivo contiene el componente de input reutilizable de la aplicación.
 * Sirve para mantener consistencia visual en todos los campos de formulario.
 * 
 * Características:
 * - Soporta label opcional
 * - Muestra mensajes de error de validación
 * - Compatible con react-hook-form mediante forwardRef
 * - Estados visuales para error y deshabilitado
 */

import type { InputHTMLAttributes } from "react"
import { forwardRef } from "react"
/**
 * Props del componente Input.
 * Extiende los atributos nativos de un input HTML.
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Texto del label que aparece sobre el input */
  label?: string
  /** Mensaje de error de validación */
  error?: string
  /** Texto de ayuda que aparece bajo el input */
  helperText?: string
}

/**
 * Componente Input reutilizable con soporte para react-hook-form.
 * 
 * Se usa forwardRef para que react-hook-form pueda registrar el input
 * y controlar su valor internamente.
 * 
 * @example
 * // Input básico
 * <Input label="Email" type="email" placeholder="tu@email.com" />
 * 
 * @example
 * // Input con error
 * <Input label="Contraseña" type="password" error="La contraseña es requerida" />
 * 
 * @example
 * // Con react-hook-form
 * <Input label="Nombre" {...register("nombre")} error={errors.nombre?.message} />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    /**
     * Estilos base del input.
     * Incluye bordes, padding, transiciones y estados de foco.
     */
    const baseStyles = "w-full px-4 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"

    /**
     * Estilos condicionales según el estado del input.
     * Rojo para error, azul para normal.
     */
    const stateStyles = error
      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"

    /**
     * Estilos para estado deshabilitado.
     */
    const disabledStyles = props.disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"

    return (
      <div className="w-full">
        {/* Label opcional */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          className={`${baseStyles} ${stateStyles} ${disabledStyles} ${className}`}
          {...props}
        />

        {/* Mensaje de error */}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}

        {/* Texto de ayuda (solo si no hay error) */}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

/**
 * displayName es necesario cuando se usa forwardRef.
 * Sirve para mostrar el nombre correcto en React DevTools.
 */
Input.displayName = "Input"
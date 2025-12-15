/**
 * Componente Button
 * 
 * Este archivo contiene el componente de botón reutilizable de la aplicación.
 * Sirve para mantener consistencia visual en todos los botones y evitar
 * repetir estilos de Tailwind en cada lugar donde se necesite un botón.
 * 
 * Variantes disponibles:
 * - primary: Botón principal (azul) para acciones importantes
 * - secondary: Botón secundario (gris) para acciones alternativas
 * - danger: Botón de peligro (rojo) para acciones destructivas
 * - ghost: Botón transparente para acciones sutiles
 */

import type { ButtonHTMLAttributes, ReactNode } from "react"

/**
 * Props del componente Button.
 * Extiende los atributos nativos de un botón HTML para mayor flexibilidad.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Contenido del botón (texto, iconos, etc.) */
  children: ReactNode
  /** Variante visual del botón */
  variant?: "primary" | "secondary" | "danger" | "ghost"
  /** Tamaño del botón */
  size?: "sm" | "md" | "lg"
  /** Muestra un estado de carga (spinner) */
  isLoading?: boolean
  /** Ocupa todo el ancho disponible */
  fullWidth?: boolean
}

/**
 * Componente Button reutilizable.
 * 
 * @example
 * // Botón primario (por defecto)
 * <Button onClick={handleClick}>Guardar</Button>
 * 
 * @example
 * // Botón de peligro con carga
 * <Button variant="danger" isLoading={true}>Eliminar</Button>
 * 
 * @example
 * // Botón pequeño de ancho completo
 * <Button size="sm" fullWidth>Enviar</Button>
 */
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  /**
   * Estilos base que se aplican a todas las variantes.
   * Incluye transiciones, bordes redondeados y estados de foco.
   */
  const baseStyles = "font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

  /**
   * Estilos específicos para cada variante.
   * Define colores de fondo, texto y estados hover.
   */
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500",
  }

  /**
   * Estilos de tamaño (padding y font-size).
   */
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }

  /**
   * Estilo para ancho completo.
   */
  const widthStyles = fullWidth ? "w-full" : ""

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          {/* Spinner SVG para estado de carga */}
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Cargando...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
/**
 * Componente Badge
 * 
 * Este archivo contiene el componente de badge/etiqueta reutilizable.
 * Sirve para mostrar estados, categorías o etiquetas de forma visual.
 * 
 * Uso típico:
 * - Estado de un pago (Pagado, Pendiente, Verificando)
 * - Rol de usuario (Admin, Vecino)
 * - Cualquier clasificación visual
 */

import type { ReactNode } from "react"
/**
 * Props del componente Badge.
 */
interface BadgeProps {
  /** Contenido del badge (texto o icono) */
  children: ReactNode
  /** Variante de color del badge */
  variant?: "success" | "warning" | "error" | "info" | "default"
  /** Tamaño del badge */
  size?: "sm" | "md"
}

/**
 * Componente Badge para mostrar estados o etiquetas.
 * 
 * @example
 * // Badge de éxito
 * <Badge variant="success">Pagado</Badge>
 * 
 * @example
 * // Badge de advertencia
 * <Badge variant="warning">Pendiente</Badge>
 * 
 * @example
 * // Badge de error pequeño
 * <Badge variant="error" size="sm">Atrasado</Badge>
 */
export const Badge = ({
  children,
  variant = "default",
  size = "md",
}: BadgeProps) => {
  /**
   * Estilos base del badge.
   * Incluye bordes redondeados completos y font-weight medium.
   */
  const baseStyles = "inline-flex items-center font-medium rounded-full"

  /**
   * Estilos de color para cada variante.
   * Cada variante tiene un fondo suave y texto del mismo tono.
   */
  const variantStyles = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    default: "bg-gray-100 text-gray-800",
  }

  /**
   * Estilos de tamaño (padding y font-size).
   */
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  }

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  )
}
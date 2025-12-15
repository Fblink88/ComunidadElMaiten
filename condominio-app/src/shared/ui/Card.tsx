/**
 * Componente Card
 * 
 * Este archivo contiene el componente de tarjeta reutilizable.
 * Sirve para agrupar contenido relacionado en un contenedor visual
 * con sombra y bordes redondeados.
 * 
 * Uso típico:
 * - Mostrar información de un departamento
 * - Mostrar resumen de pagos
 * - Agrupar formularios
 * - Mostrar estadísticas en el dashboard
 */

import type { ReactNode } from "react"
/**
 * Props del componente Card.
 */
interface CardProps {
  /** Contenido de la tarjeta */
  children: ReactNode
  /** Título opcional que aparece en la parte superior */
  title?: string
  /** Clases CSS adicionales */
  className?: string
  /** Elimina el padding interno */
  noPadding?: boolean
}

/**
 * Componente Card para agrupar contenido.
 * 
 * @example
 * // Card básica
 * <Card>
 *   <p>Contenido de la tarjeta</p>
 * </Card>
 * 
 * @example
 * // Card con título
 * <Card title="Información del Departamento">
 *   <p>Depto 11 - Andrea Rojas</p>
 * </Card>
 * 
 * @example
 * // Card sin padding (útil para tablas)
 * <Card title="Listado de Pagos" noPadding>
 *   <Table>...</Table>
 * </Card>
 */
export const Card = ({
  children,
  title,
  className = "",
  noPadding = false,
}: CardProps) => {
  /**
   * Estilos base de la tarjeta.
   * Fondo blanco, bordes redondeados y sombra sutil.
   */
  const baseStyles = "bg-white rounded-xl shadow-sm border border-gray-100"

  /**
   * Padding condicional.
   */
  const paddingStyles = noPadding ? "" : "p-6"

  return (
    <div className={`${baseStyles} ${paddingStyles} ${className}`}>
      {/* Título opcional */}
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}

      {/* Contenido */}
      {children}
    </div>
  )
}
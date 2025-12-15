/**
 * Componente Spinner
 * 
 * Este archivo contiene el componente de spinner/loader de la aplicación.
 * Sirve para indicar al usuario que algo se está cargando.
 * 
 * Uso típico:
 * - Mientras se cargan datos de Firebase
 * - Durante el envío de un formulario
 * - En la pantalla inicial mientras se verifica autenticación
 */

/**
 * Props del componente Spinner.
 */
interface SpinnerProps {
  /** Tamaño del spinner */
  size?: "sm" | "md" | "lg"
  /** Color del spinner */
  color?: "primary" | "white" | "gray"
}

/**
 * Componente Spinner para estados de carga.
 * 
 * @example
 * // Spinner por defecto
 * <Spinner />
 * 
 * @example
 * // Spinner grande blanco (sobre fondo oscuro)
 * <Spinner size="lg" color="white" />
 * 
 * @example
 * // Spinner en un botón
 * <Button disabled>
 *   <Spinner size="sm" color="white" /> Guardando...
 * </Button>
 */
export const Spinner = ({
  size = "md",
  color = "primary",
}: SpinnerProps) => {
  /**
   * Estilos de tamaño del spinner.
   */
  const sizeStyles = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  /**
   * Estilos de color del spinner.
   */
  const colorStyles = {
    primary: "text-blue-600",
    white: "text-white",
    gray: "text-gray-400",
  }

  return (
    <svg
      className={`animate-spin ${sizeStyles[size]} ${colorStyles[color]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Cargando"
    >
      {/* Círculo de fondo (más transparente) */}
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      {/* Arco que gira (más opaco) */}
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
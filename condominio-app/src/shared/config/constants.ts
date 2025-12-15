/**
 * Constantes de la Aplicación
 * 
 * Este archivo contiene todas las constantes globales de la aplicación.
 * Sirve para centralizar valores que se usan en múltiples lugares,
 * evitando "magic strings" y facilitando cambios futuros.
 * 
 * El uso de "as const" convierte los valores en tipos literales de TypeScript,
 * lo que proporciona mejor autocompletado y detección de errores.
 */

/**
 * Nombre de la aplicación.
 * Sirve para mostrar en el header, título de página, emails, etc.
 */

export const APP_NAME = "Comunidad El Maitén"


/**
 * Roles de usuario disponibles en el sistema.
 * - ADMIN: Puede gestionar departamentos, pagos, gastos y usuarios
 * - VECINO: Solo puede ver su información y realizar pagos
 */
export const ROLES = {
  ADMIN: "admin",
  VECINO: "vecino",
} as const

/**
 * Estados posibles de un pago.
 * - PENDIENTE: El pago aún no se ha realizado
 * - PAGADO: El pago fue confirmado exitosamente
 * - VERIFICANDO: El pago está siendo verificado (ej: transferencia manual)
 */
export const ESTADOS_PAGO = {
  PENDIENTE: "pendiente",
  PAGADO: "pagado",
  VERIFICANDO: "verificando",
} as const


/**
 * Nombres de los meses en español.
 * Sirve para mostrar los meses en la UI sin depender de librerías externas
 * en casos simples donde no se necesita formateo de fechas completo.
 */
export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
] as const
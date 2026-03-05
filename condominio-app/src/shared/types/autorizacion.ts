/**
 * Tipos relacionados con el sistema de autorización de pagos.
 *
 * Este sistema permite a propietarios autorizar a arrendatarios
 * para pagar gastos comunes.
 */

export type TipoAutorizacion = "permanente" | "ocasional"

export type EstadoAutorizacion = "pendiente" | "aprobada" | "rechazada" | "revocada"

/**
 * Interfaz completa de una autorización.
 */
export interface Autorizacion {
  id: string
  departamento_id: string
  propietario_id: string
  arrendatario_id: string
  tipo: TipoAutorizacion
  estado: EstadoAutorizacion

  /** Periodos autorizados (solo si tipo es 'ocasional') */
  periodos_autorizados?: string[]

  /** Nota del arrendatario al solicitar */
  nota_solicitud?: string

  /** Respuesta del propietario al aprobar/rechazar */
  nota_respuesta?: string

  /** True si arrendatario solicitó, False si propietario autorizó directamente */
  fue_solicitada: boolean

  /** Fecha de creación de la solicitud/autorización */
  fecha_creacion: Date

  /** Fecha en que se aprobó/rechazó */
  fecha_respuesta?: Date

  /** Fecha en que se revocó (si aplica) */
  fecha_revocacion?: Date
}

/**
 * Datos para solicitar una autorización (arrendatario).
 */
export interface SolicitudAutorizacionForm {
  tipo: TipoAutorizacion
  periodos_autorizados?: string[]
  nota_solicitud?: string
}

/**
 * Datos para autorizar directamente (propietario).
 */
export interface AutorizacionDirectaForm {
  arrendatario_id: string
  tipo: TipoAutorizacion
  periodos_autorizados?: string[]
  nota?: string
}

/**
 * Datos para aprobar/rechazar una solicitud.
 */
export interface RespuestaAutorizacionForm {
  nota_respuesta: string
}

/**
 * Datos para revocar una autorización.
 */
export interface RevocacionAutorizacionForm {
  motivo: string
}

/**
 * Respuesta del endpoint "puede-pagar".
 */
export interface PuedePagarResponse {
  puede_pagar: boolean
  motivo: string
  autorizacion_id?: string
}

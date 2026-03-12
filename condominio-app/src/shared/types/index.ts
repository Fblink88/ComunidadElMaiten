/**
 * Tipos e Interfaces Globales
 * 
 * Este archivo contiene todas las definiciones de tipos TypeScript
 * que representan las entidades de negocio de la aplicación.
 * 
 * NOTA: El backend Python devuelve campos en snake_case.
 * Los tipos incluyen ambos formatos (camelCase y snake_case)
 * para compatibilidad con código existente y datos reales del API.
 */

// ============================================
// USUARIO
// ============================================

export interface Usuario {
  id: string
  email: string
  nombre: string
  /** ID del departamento asociado (null si es admin sin depto) */
  departamentoId?: string | null
  departamento_id?: string | null
  /** ID del depto solicitado durante el registro (antes de aprobación) */
  departamento_solicitado_id?: string | null
  /** Número del depto solicitado durante el registro (e.g. "11") */
  departamento_solicitado_numero?: string | null
  rol: "admin" | "vecino" | "propietario" | "arrendatario"
  es_admin: boolean
  activo?: boolean
  esAdmin?: boolean
  /** Estado de la cuenta: activo o pendiente de aprobación */
  estado_cuenta?: "activo" | "pendiente_aprobacion"
  fechaRegistro?: Date
  fecha_registro?: string
  created_at?: string
  eliminado?: boolean
}

// ============================================
// DEPARTAMENTO
// ============================================

export interface Departamento {
  id: string
  numero: string
  propietario: string
  /** Superficie del departamento en m² */
  metrosCuadrados?: number
  metros_cuadrados: number
  /** Monto de la cuota mensual en CLP */
  cuotaMensual?: number
  cuota_mensual: number
  /** Saldo a favor acumulado */
  saldo_a_favor: number
  saldoAFavor?: number
  /** Lista de IDs de usuarios asociados */
  usuariosIds?: string[]
  usuarios_ids: string[]
  activo: boolean
  created_at: string
  updated_at: string
}

// ============================================
// PAGO
// ============================================

export interface Pago {
  id: string
  /** ID del departamento */
  departamentoId?: string
  departamento_id?: string
  /** Monto en CLP */
  monto: number
  /** Periodo "YYYY-MM" */
  periodo: string
  /** Estado actual del pago */
  estado: "pendiente" | "pagado" | "verificando" | "rechazado" | "proyectado"
  /** Monto ya pagado parcialmente */
  monto_pagado?: number
  montoPagado?: number
  /** Método utilizado */
  metodo: "khipu" | "transferencia_manual" | "saldo_a_favor" | "importacion_historica" | "ajuste_manual"
  /** ID de transacción de Khipu */
  khipuPaymentId?: string
  khipu_payment_id?: string
  /** Fecha en que se realizó el pago */
  fechaPago?: Date | string
  fecha_pago?: string
  /** ID del admin que verificó */
  verificadoPor?: string
  verificado_por?: string
  /** Nombre de quien realizó la transferencia (opcional) */
  nombre_pagador?: string
  nombrePagador?: string
  /** Fecha de la transferencia real anotada (opcional) */
  fecha_transferencia?: string
  fechaTransferencia?: string
  /** Notas adicionales o motivo del rechazo/ajuste */
  notas?: string
  /** Timestamps */
  created_at?: string
  updated_at?: string
}

// ============================================
// AUTORIZACION
// ============================================

export type TipoAutorizacion = 'permanente' | 'ocasional'
export type EstadoAutorizacion = 'pendiente' | 'aprobada' | 'rechazada' | 'revocada'

export interface Autorizacion {
  id: string
  /** ID del usuario arrendatario */
  usuario_id: string
  /** ID del departamento */
  departamento_id: string
  /** ID del usuario propietario que debe autorizar */
  propietario_id: string
  /** Tipo de autorización */
  tipo: TipoAutorizacion
  /** Estado de la solicitud */
  estado: EstadoAutorizacion
  /** Periodos específicos autorizados (solo para tipo 'ocasional') */
  periodos_autorizados?: string[]
  /** Fecha en que se solicitó (backend) */
  fecha_solicitud?: string | Date
  /** Alias para la UI */
  fecha_creacion?: string | Date
  /** Fecha en que se emitió una respuesta */
  fecha_respuesta?: string | Date
  /** Detalles adicionales o comentarios (backend) */
  notas?: string
  /** Alias para la UI */
  nota_solicitud?: string
  nota_respuesta?: string
  /** Si fue solicitada por arrendatario */
  fue_solicitada?: boolean
  /** Fecha en que fue revocada */
  fecha_revocacion?: string | Date
  created_at?: string
  updated_at?: string
}

// ============================================
// GASTOS
// ============================================

export interface GastoMensual {
  id: string
  periodo: string
  items: ItemGasto[]
  total: number
  /** Valor por m² */
  valorPorM2?: number
  valor_por_m2?: number
  created_at?: string
  saldo_mes?: number
}

export interface ItemGasto {
  concepto: string
  monto: number
}

export interface GastoExtraordinario {
  id: string
  concepto: string
  montoPorDepto?: number
  monto_por_depto?: number
  monto_total?: number
  fecha: Date | string
  pagos: Record<string, { pagado: boolean; fecha?: Date | string }>
}

// ============================================
// TRANSACCIONES Y PAGOS ADICIONALES
// ============================================

export interface Transaccion {
  id: string
  departamento_id: string
  monto_total: number
  metodo: string
  fecha: string
  notas?: string
  usuario_admin_id?: string
}

export interface PagoCreate {
  departamento_id: string
  monto: number
  periodo: string
  metodo?: string
}

export interface ComprobanteCreate {
  pago_id: string
  url_archivo: string
  notas?: string
}
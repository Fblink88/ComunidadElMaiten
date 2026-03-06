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
  rol: "admin" | "vecino" | "propietario" | "arrendatario"
  es_admin: boolean
  esAdmin?: boolean
  fechaRegistro?: Date
  fecha_registro?: string
  created_at?: string
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
  metros_cuadrados?: number
  /** Monto de la cuota mensual en CLP */
  cuotaMensual?: number
  cuota_mensual?: number
  /** Saldo a favor acumulado */
  saldo_a_favor?: number
  saldoAFavor?: number
  /** Lista de IDs de usuarios asociados */
  usuariosIds?: string[]
  usuarios_ids?: string[]
  activo: boolean
  created_at?: string
  updated_at?: string
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
  /** Timestamps */
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
  fecha: Date | string
  pagos: Record<string, { pagado: boolean; fecha?: Date | string }>
}
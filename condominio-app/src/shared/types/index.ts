/**
 * Tipos e Interfaces Globales
 * 
 * Este archivo contiene todas las definiciones de tipos TypeScript
 * que representan las entidades de negocio de la aplicación.
 * 
 * Sirve para:
 * - Tipar datos que vienen de Firebase
 * - Tipar props de componentes
 * - Tipar estados y formularios
 * - Proporcionar autocompletado en el IDE
 * - Detectar errores en tiempo de desarrollo
 */

// ============================================
// USUARIO
// ============================================

/**
 * Representa un usuario del sistema.
 * Puede ser un vecino (propietario/arrendatario) o un administrador.
 */
export interface Usuario {
  /** ID único generado por Firebase Auth */
  id: string
  /** Correo electrónico del usuario */
  email: string
  /** Nombre completo del usuario */
  nombre: string
  /** ID del departamento asociado (null si es admin sin depto) */
  departamentoId: string | null
  /** Rol del usuario en el sistema */
  rol: "admin" | "vecino"
  /** Indica si tiene permisos de administrador */
  esAdmin: boolean
  /** Fecha en que se registró en el sistema */
  fechaRegistro: Date
}

// ============================================
// DEPARTAMENTO
// ============================================

/**
 * Representa un departamento del condominio.
 * Contiene información sobre el propietario y la cuota mensual.
 */
export interface Departamento {
  /** ID único del departamento (ej: "depto_11") */
  id: string
  /** Número del departamento (ej: "11", "21") */
  numero: string
  /** Nombre del propietario actual */
  propietario: string
  /** Superficie del departamento en m² */
  metrosCuadrados: number
  /** Monto de la cuota mensual en CLP */
  cuotaMensual: number
  /** Lista de IDs de usuarios asociados (máximo 5) */
  usuariosIds: string[]
  /** Indica si el departamento está activo */
  activo: boolean
}

// ============================================
// PAGO
// ============================================

/**
 * Representa un pago de gastos comunes.
 * Registra el pago de un departamento para un mes específico.
 */
export interface Pago {
  /** ID único del pago */
  id: string
  /** ID del departamento que realizó el pago */
  departamentoId: string
  /** Monto pagado en CLP */
  monto: number
  /** Periodo del pago en formato "YYYY-MM" (ej: "2025-01") */
  periodo: string
  /** Estado actual del pago */
  estado: "pendiente" | "pagado" | "verificando"
  /** Método utilizado para el pago */
  metodo: "khipu" | "transferencia_manual"
  /** ID de transacción de Khipu (solo si se pagó con Khipu) */
  khipuPaymentId?: string
  /** Fecha en que se realizó el pago */
  fechaPago?: Date
  /** ID del admin que verificó el pago (solo para transferencias manuales) */
  verificadoPor?: string
}

// ============================================
// GASTOS
// ============================================

/**
 * Representa los gastos comunes de un mes específico.
 * Contiene el desglose de todos los gastos del condominio.
 */
export interface GastoMensual {
  /** ID único, igual al periodo (ej: "2025-01") */
  id: string
  /** Periodo en formato "YYYY-MM" */
  periodo: string
  /** Lista de items de gasto del mes */
  items: ItemGasto[]
  /** Suma total de todos los items */
  total: number
  /** Valor calculado por metro cuadrado */
  valorPorM2: number
}

/**
 * Representa un item individual dentro de los gastos mensuales.
 * Ejemplos: "Remuneración personal aseo", "Agua", "Electricidad"
 */
export interface ItemGasto {
  /** Descripción del gasto */
  concepto: string
  /** Monto del gasto en CLP */
  monto: number
}

/**
 * Representa un gasto extraordinario (fuera de los gastos comunes).
 * Ejemplos: Revisión sello verde gas, reparaciones mayores.
 */
export interface GastoExtraordinario {
  /** ID único del gasto extraordinario */
  id: string
  /** Descripción del gasto */
  concepto: string
  /** Monto que debe pagar cada departamento en CLP */
  montoPorDepto: number
  /** Fecha en que se registró el gasto */
  fecha: Date
  /** Registro de pagos por departamento: { "depto_11": { pagado: true, fecha: ... } } */
  pagos: Record<string, { pagado: boolean; fecha?: Date }>
}
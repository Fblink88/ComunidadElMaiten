/**
 * Funciones de Formateo
 * 
 * Este archivo contiene funciones utilitarias para formatear datos
 * antes de mostrarlos en la interfaz de usuario.
 * 
 * Sirve para:
 * - Formatear montos de dinero en formato chileno ($25.000)
 * - Formatear fechas en español (12 de diciembre, 2025)
 * - Formatear periodos (2025-01 → Enero 2025)
 * - Mantener consistencia visual en toda la aplicación
 */

import { format } from "date-fns"
import { es } from "date-fns/locale"

/**
 * Formatea un número como moneda chilena.
 * 
 * @param amount - Monto a formatear
 * @returns String formateado (ej: "$25.000")
 * 
 * @example
 * formatMoney(25000) // "$25.000"
 * formatMoney(1500000) // "$1.500.000"
 */
export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formatea una fecha en formato corto (dd/MM/yyyy).
 * 
 * @param date - Fecha a formatear
 * @returns String formateado (ej: "12/12/2025")
 * 
 * @example
 * formatDate(new Date()) // "12/12/2025"
 */
export const formatDate = (date: Date): string => {
  return format(date, "dd/MM/yyyy", { locale: es })
}

/**
 * Formatea una fecha en formato largo con texto en español.
 * 
 * @param date - Fecha a formatear
 * @returns String formateado (ej: "12 de diciembre, 2025")
 * 
 * @example
 * formatDateLong(new Date()) // "12 de diciembre, 2025"
 */
export const formatDateLong = (date: Date): string => {
  return format(date, "d 'de' MMMM, yyyy", { locale: es })
}

/**
 * Convierte un periodo en formato "YYYY-MM" a texto legible.
 * 
 * @param periodo - Periodo en formato "YYYY-MM"
 * @returns String formateado (ej: "Enero 2025")
 * 
 * @example
 * formatPeriodo("2025-01") // "enero 2025"
 * formatPeriodo("2025-12") // "diciembre 2025"
 */
export const formatPeriodo = (periodo: string): string => {
  const [year, month] = periodo.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return format(date, "MMMM yyyy", { locale: es })
}

/**
 * Capitaliza la primera letra de un string.
 * 
 * @param str - String a capitalizar
 * @returns String con primera letra en mayúscula
 * 
 * @example
 * capitalize("enero") // "Enero"
 * capitalize("HOLA") // "HOLA" (solo cambia la primera)
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
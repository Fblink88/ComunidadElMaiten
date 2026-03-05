/**
 * API Compartida
 * 
 * Este archivo contendrá funciones de API compartidas.
 * Por ahora solo re-exporta la configuración de Firebase.
 * 
 * En el futuro aquí irán funciones genéricas como:
 * - Manejo de errores de Firebase
 * - Helpers para queries de Firestore
 */

export { auth, db } from "../config/firebase"

export * from "./auth.api"
export * from "./departamentos.api"
export * from "./usuarios.api"
export * from "./pagos.api"
export * from "./gastos.api"
export * from "./admin.api"
export * from "./dashboard.api"
export * from "./autorizaciones.api"
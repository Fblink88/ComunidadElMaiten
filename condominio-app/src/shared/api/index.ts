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
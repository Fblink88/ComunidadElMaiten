/**
 * Barrel Export de Configuración
 * 
 * Este archivo sirve como punto de entrada único para todas las exportaciones
 * del módulo de configuración. Esto se conoce como "barrel export" o "re-export".
 * 
 * Beneficios:
 * - Permite importar desde un solo lugar: import { auth, APP_NAME } from "@/shared/config"
 * - Oculta la estructura interna de la carpeta
 * - Facilita refactorizaciones sin cambiar imports en toda la app
 */

export * from "./firebase"
export * from "./constants"
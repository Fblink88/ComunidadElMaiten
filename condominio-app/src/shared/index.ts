/**
 * Barrel Export Principal de Shared
 * 
 * Este archivo es el punto de entrada principal para todo el módulo shared.
 * Permite importar desde un solo lugar:
 * 
 * @example
 * import { Button, Card, formatMoney, auth } from "@/shared"
 * 
 * Nota: Algunos prefieren imports más específicos para mejor tree-shaking:
 * import { Button } from "@/shared/ui"
 * import { formatMoney } from "@/shared/lib"
 */

// Componentes UI
export * from "./ui"

// Funciones utilitarias
export * from "./lib"

// Configuración y API
export * from "./config"
export * from "./api"

// Tipos
export * from "./types"
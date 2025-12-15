/**
 * Declaraciones de Tipos para Vite
 * 
 * Este archivo contiene declaraciones de tipos para archivos que TypeScript
 * no reconoce nativamente, como CSS, imágenes, etc.
 */

/// <reference types="vite/client" />

/**
 * Permite importar archivos CSS como módulos.
 * Sin esto, TypeScript muestra error al hacer: import "./styles.css"
 */
declare module "*.css" {
  const content: string
  export default content
}
/**
 * Configuración de Vite
 * 
 * Este archivo configura el bundler Vite para el proyecto.
 * Incluye el plugin de React y los path aliases para usar "@/" en imports.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      /**
       * Alias "@" apunta a la carpeta "src".
       * Permite escribir: import { Button } from "@/shared/ui"
       * En lugar de: import { Button } from "../../shared/ui"
       */
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
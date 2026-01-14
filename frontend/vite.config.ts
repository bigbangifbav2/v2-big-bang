// Alternativa: Importar de 'vitest/config' em vez de 'vite'
import { defineConfig } from 'vitest/config' // <--- Mudou aqui
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
  },
})
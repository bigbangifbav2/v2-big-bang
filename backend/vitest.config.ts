import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true, // Permite usar describe, it, expect sem importar
        environment: 'node', // Ambiente Node.js (não browser)
    },
});
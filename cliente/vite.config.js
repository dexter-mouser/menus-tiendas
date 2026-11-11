// Configuración de Vite: la app vive en cliente/ y se compila a dist/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});

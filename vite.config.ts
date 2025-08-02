import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    // Optional: If you want to access env vars via import.meta.env
    'import.meta.env': JSON.stringify(process.env)
  }
});
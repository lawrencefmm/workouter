import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  const isTest = Boolean(process.env.VITEST);

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      allowedHosts: ['cpp.engineer'],
      hmr: isTest ? false : undefined,
      ws: isTest ? false : undefined
    },
    preview: {
      port: 4173,
      host: true,
      allowedHosts: ['cpp.engineer']
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      restoreMocks: true,
      server: {
        hmr: false,
        ws: false
      }
    }
  };
});

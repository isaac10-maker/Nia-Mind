import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { attachLocalGateway } from './api/localGateway';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.VITE_SUPABASE_URL) process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
  if (env.SUPABASE_URL) process.env.SUPABASE_URL = env.SUPABASE_URL;

  return {
  plugins: [
    react(),
    {
      name: 'nia-mind-local-api',
      configureServer(server) {
        // N'intercepte que /api/assistant et /backend. Le module /api/assistant.ts reste servi par Vite.
        attachLocalGateway(server.middlewares);
      },
      configurePreviewServer(server) {
        attachLocalGateway(server.middlewares);
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  esbuild: {
    legalComments: 'none',
    drop: ['debugger'],
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/src/locales/') ||
            id.includes('/src/lib/platformPhraseBank') ||
            id.includes('/src/lib/i18nEngine')
          ) {
            return 'nia-i18n';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          return undefined;
        },
      },
    },
  },
  };
});

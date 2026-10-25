import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { processAssistantPayload } from './api/assistant';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'nia-mind-local-api',
      configureServer(server) {
        server.middlewares.use('/api/assistant', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Méthode non autorisée. Utilisez POST.' }));
            return;
          }

          let rawBody = '';
          req.on('data', (chunk) => {
            rawBody += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = rawBody ? JSON.parse(rawBody) : {};
              const result = await processAssistantPayload(parsed, 'local-dev');
              res.statusCode = result.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result.body));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Requête JSON invalide.' }));
            }
          });
        });
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
});

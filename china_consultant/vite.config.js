import { defineConfig } from 'vite';
import { processInvoiceEmailRequest } from './sendInvoiceEmail.mjs';

export default defineConfig({
  base: '/',
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  plugins: [
    {
      name: 'invoice-email-api',
      configureServer(server) {
        server.middlewares.use('/api/send-invoice-email', async (req, res) => {
          if (req.method === 'OPTIONS') {
            res.writeHead(204, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
            });
            res.end();
            return;
          }

          if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed.' }));
            return;
          }

          let rawBody = '';
          req.on('data', (chunk) => {
            rawBody += chunk;
          });

          req.on('end', async () => {
            try {
              const payload = rawBody ? JSON.parse(rawBody) : {};
              const result = await processInvoiceEmailRequest(payload, process.env);

              res.writeHead(result.statusCode, result.headers);
              res.end(result.body);
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message || 'Failed to send invoice email.' }));
            }
          });
        });
      },
    },
  ],

  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom')) return 'vendor';
          if (id.includes('node_modules/react') && !id.includes('react-router')) return 'vendor';
          if (id.includes('node_modules/react-router')) return 'router';
          if (id.includes('node_modules/framer-motion')) return 'motion';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },

  css: {
    devSourcemap: true,
  },
});

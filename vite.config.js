import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const storefrontRoutingPlugin = () => {
  const rewriteStorefront = (req, _res, next) => {
    const urlPath = (req.url || '').split('?')[0];
    if (
      req.method === 'GET' &&
      (urlPath === '/storefront' || urlPath.startsWith('/storefront/')) &&
      !urlPath.includes('.')
    ) {
      req.url = '/storefront.html';
    }
    next();
  };

  return {
    name: 'hgs-storefront-routing',
    configureServer(server) {
      server.middlewares.use(rewriteStorefront);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteStorefront);
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), storefrontRoutingPlugin()],
  server: {
    port: 3000,
    open: false
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        storefront: resolve(__dirname, 'storefront.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});

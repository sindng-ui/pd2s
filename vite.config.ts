// C:/AntigravityWorkspace/pd2s/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createApiMiddleware } from './server/apiMiddleware';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'pd2-local-api-server',
      configureServer(server) {
        server.middlewares.use(createApiMiddleware());
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
  },
});

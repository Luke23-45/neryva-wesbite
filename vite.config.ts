import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    svgr(),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production') // set 'development' for showing the tanstackquery and others. 
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/components'),
      '@data': path.resolve(__dirname, './src/data'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@router': path.resolve(__dirname, './src/router'),
      '@store': path.resolve(__dirname, './src/store'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
      '@neryva_data': path.resolve(__dirname, './src/neryva_data'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // The engine, fully same-origin in dev: API + OP endpoints all route
      // through this prefix (CORS stays closed on the engine by policy —
      // a cross-origin token exchange would be blocked without it).
      // changeOrigin stays FALSE on the identity-bearing prefixes: the OP
      // absolutizes interaction URLs (notably the resume returnTo) from the
      // request Host, so rewriting it to :3001 would send the browser
      // cross-origin on resume — where the :3000 OP cookies never go.
      '/engine': {
        target: 'http://localhost:3001',
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/engine/, ''),
      },
      // The OP interaction pages (/login/:uid …). The provider redirects to
      // absolute /login/* paths, so without this prefix the browser would
      // resolve them against the website (TanStack 404) instead of the
      // engine. No rewrite — the engine serves /login/* directly, and the
      // OP cookies stay first-party on :3000.
      '/login': {
        target: 'http://localhost:3001',
        changeOrigin: false,
      },
      // The OP resume leg (/auth/auth/:uid — the interaction returnTo the
      // provider builds as <host>/auth + /auth/:uid). Without this prefix
      // the browser resolves resume against the website (TanStack 404) and
      // the login dies after the IdP round-trip. No rewrite — the engine's
      // stripAuthMountPrefix turns /auth/auth/:uid into the provider's
      // /auth/:uid resume route, and the resume cookie (Path=/auth/auth/:uid)
      // matches by construction. Longer than /auth, so the console's own
      // /auth sign-in page is unaffected.
      '/auth/auth': {
        target: 'http://localhost:3001',
        changeOrigin: false,
      },
      // The Agent Studio runtime, for the API explorer's live GETs (I-5).
      // Same-origin in dev; the edge routes /runtime in production.
      '/runtime': {
        target: process.env.RUNTIME_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/runtime/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@tanstack/react-router', '@tanstack/react-query'],
          animations: ['framer-motion'],
          styles: ['styled-components'],
          charts: ['recharts'],
        },
      },
    },
  },
});

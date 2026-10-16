import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  build:{rollupOptions:{output:{manualChunks(id){if(id.includes('/node_modules/')){if(id.includes('/zod/'))return 'validation';if(id.includes('/dexie'))return 'storage';if(/\/(react|react-dom|scheduler)\//.test(id))return 'react';}}}}},
  plugins: [react(), tailwind(), VitePWA({
    registerType: 'prompt', injectRegister: false,
    includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
    manifest: { name: 'oaolife', short_name: 'oaolife', description: 'Seu plano. Sua evolução. Todos os dias.', lang: 'pt-BR', start_url: '.', scope: '.', display: 'standalone', background_color: '#101311', theme_color: '#101311', orientation: 'portrait-primary', icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ] },
    workbox: { cleanupOutdatedCaches: true, skipWaiting: false, clientsClaim: true, navigateFallback: 'index.html', globPatterns: ['**/*.{js,css,html,png,svg,woff2}'], maximumFileSizeToCacheInBytes: 4000000 }
  })],
  test: { environment: 'node', include: ['src/**/*.test.ts'], setupFiles: ['src/test/setup.ts'] }
} as Parameters<typeof defineConfig>[0]);

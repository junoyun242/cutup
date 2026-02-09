import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/cutup/',
  optimizeDeps: {
    exclude: ['@huggingface/transformers'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CUT-UP MACHINE MK-II',
        short_name: 'CUT-UP',
        description: 'Burroughs-style cut-up and fold-in text machine',
        theme_color: '#1a1a1e',
        background_color: '#1a1a1e',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg}'],
      },
    }),
  ],
})

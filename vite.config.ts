/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const WARM_WHITE = '#FAF9F6'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // New versions install in the background and take over on the next load; no update UI.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Icons are already matched by globPatterns below; avoid listing them twice.
      includeManifestIcons: false,
      manifest: {
        name: 'נשום פנימה',
        short_name: 'נשום פנימה',
        lang: 'he',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: WARM_WHITE,
        background_color: WARM_WHITE,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Audio and fonts are listed explicitly: the default patterns would leave them out of the precache.
        // (manifest.webmanifest is added by the plugin itself.)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,mp3}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})

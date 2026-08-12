import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
      ],
      manifest: false, // we ship a hand-authored public/manifest.webmanifest
      workbox: {
        // Versioned precache: workbox fingerprints every built asset and
        // names the cache with a build-specific revision, so each deploy
        // gets a fresh cache and stale entries are cleaned up automatically.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})

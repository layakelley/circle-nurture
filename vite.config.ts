import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://<user>.github.io/circle-nurture/ (a project Pages
  // site, not a user/org root site) — every built asset reference needs
  // this prefix. public/manifest.webmanifest's own internal paths are set
  // to match by hand (Vite doesn't parse that file's contents).
  base: '/circle-nurture/',
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

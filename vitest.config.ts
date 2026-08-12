import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts (which owns the app build/PWA plugin) so the
// data-layer tests here run with a minimal, fast config: plain TS
// transpilation plus the fake-indexeddb polyfill, no React/PWA plugins
// needed since nothing under tests/ renders UI.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
})

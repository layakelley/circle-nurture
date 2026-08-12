import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts (which owns the app build/PWA plugin) so the
// data-layer tests here run with a minimal, fast config: plain TS
// transpilation plus the fake-indexeddb polyfill.
//
// Default environment is 'node' (fast, no DOM) for the data-layer tests.
// Component tests that need a DOM (e.g. tests/HomeView.test.tsx) opt into
// jsdom per-file via a `// @vitest-environment jsdom` docblock at the top
// of the file — vitest honors that override on a file-by-file basis, so
// this config doesn't need a second project just for the one DOM suite.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['./tests/setup.ts'],
  },
})

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Separate from vite.config.ts (which owns the app build/PWA plugin) so the
// data-layer tests here run with a minimal, fast config: plain TS
// transpilation plus the fake-indexeddb polyfill. The React plugin is
// still needed here (not just in vite.config.ts) so `.tsx` component
// tests under tests/ get a real JSX transform; data-layer `.test.ts`
// files ignore it entirely. Default environment stays 'node' — fast for
// the majority-DB test suite — and component tests opt into jsdom
// per-file via a `// @vitest-environment jsdom` docblock.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
  },
})

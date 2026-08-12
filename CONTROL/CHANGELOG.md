# Changelog — Circle Nurture

*(Document 5 — written by the merge train, one entry per atomic batch stamp: version, tag, the work items in the batch, and a one-line human note. Append-only.)*

## v0.0.0 — 2026-08-12 (apparatus)
- Project apparatus written by the conductor (sixteen documents). No app code yet.

## v0.2.0 — 2026-08-12 (tag: cn-0.2.0)
- WI-02 local-first data layer (Dexie): six tables (people, circles, circleMembers, memories, nextConnects, connectionLog), typed repository modules, versioned migration chain, dev-only smoke seed. Proven: CRUD round-trips, reload-survival (close/reopen against a persistent IndexedDB store), idempotent migrations, no view imports Dexie directly (8/8 tests pass). No visible surface yet — internal gate.

## v0.1.0 — 2026-08-12 (tag: cn-0.1.0)
- WI-01 repo scaffold + installable PWA shell. React+Vite+TS, `vite-plugin-pwa` (versioned SW cache, skipWaiting/clientsClaim), calm warm design tokens, safe-area-aware layout, zero horizontal overflow at 390×844. Build exits 0. Gate 3: comparable calm launch-state feel to Day One (tie, appropriate for a scaffold stage).

# Changelog — Circle Nurture

*(Document 5 — written by the merge train, one entry per atomic batch stamp: version, tag, the work items in the batch, and a one-line human note. Append-only.)*

## v0.0.0 — 2026-08-12 (apparatus)
- Project apparatus written by the conductor (sixteen documents). No app code yet.

## v0.4.0 — 2026-08-12 (tag: cn-0.4.0)
- Wave 4, three cards: WI-06 Bring My People (selective contact import via Contact Picker API or vCard file, dedupe by phone/name, bulk circle assignment, graceful iOS fallback), WI-07 Memories (quick capture ≤2 interactions, edit/delete/pin, newest-first, reload-durable), WI-11 Gentle Nudge (45-day calm threshold, never for people with no connection log, dismissal persists per-gap, no judgment language, no red/urgent styling — new `nudgeDismissals` table, additive schema v2). Conductor integration: NudgeCard now renders live on Home above the people list, and Home's empty state offers "bring in people you already know" → the import flow. **Completion box 3 (jot a memory) is functionally complete** (MemoryComposer/MemoryList proven) but not yet reachable from a person's page — that lands with WI-08 (person profile), next. 55/55 tests pass; build exits 0.

## v0.3.0 — 2026-08-12 (tag: cn-0.3.0)
- Wave 3, five cards landed together: WI-03 calm home screen, WI-04 add a person (capture-first) + Date We Met, WI-05 circles (CRUD + multi-circle + bulk-assign), WI-12 last connected (derived, factual), WI-20 export/backup + privacy statement. Plus a conductor-done integration pass: react-router (hash-based, GitHub Pages-safe) wiring Home ↔ Add Person ↔ Circles ↔ Settings behind a quiet bottom nav — no separate work item for this, just the glue the parallel cards were built to plug into. **Completion box 2 (add a person) verified working end-to-end at HEAD** (probe: tap the home FAB → fill a name → save → the person renders live on Home). 34/34 tests pass; build exits 0.

## v0.2.0 — 2026-08-12 (tag: cn-0.2.0)
- WI-02 local-first data layer (Dexie): six tables (people, circles, circleMembers, memories, nextConnects, connectionLog), typed repository modules, versioned migration chain, dev-only smoke seed. Proven: CRUD round-trips, reload-survival (close/reopen against a persistent IndexedDB store), idempotent migrations, no view imports Dexie directly (8/8 tests pass). No visible surface yet — internal gate.

## v0.1.0 — 2026-08-12 (tag: cn-0.1.0)
- WI-01 repo scaffold + installable PWA shell. React+Vite+TS, `vite-plugin-pwa` (versioned SW cache, skipWaiting/clientsClaim), calm warm design tokens, safe-area-aware layout, zero horizontal overflow at 390×844. Build exits 0. Gate 3: comparable calm launch-state feel to Day One (tie, appropriate for a scaffold stage).

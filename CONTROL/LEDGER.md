# Live Ledger — Circle Nurture

*(Document 6 — the single source of truth the loops read (decision C1). The build reads this file, dispatches the next ready card, and updates it. Statuses: `pending` → `queued` (deps met) → `building` → `review` → `merged`. `blocked` = a real blocker with a written reason — never a silent skip.)*

**Repo:** `circle-nurture` (branch `main`) · **Harness:** Claude-Nine · **Last heartbeat:** *(first loop writes here)*
**Batch counter:** 8 · **Last merge stamp:** v0.8.0 / tag cn-0.8.0 · **HEAD:** (updating after batch 8 commit)

---

## Completion definition (C5) — the four boxes
| Box | Status |
|---|---|
| 1. Opens on a phone (HTTPS, installable PWA) | pending (shell built, not yet deployed — WI-21) |
| 2. Add a person | **GREEN** — verified end-to-end at HEAD (probe: FAB → name → save → renders on Home) |
| 3. Jot a memory | **GREEN** — verified end-to-end at HEAD (probe: add person → tap card → profile → jot memory) |
| 4. Send a blast message | **GREEN** — verified end-to-end at HEAD (probe: 2 recipients selected, correct count, "no group text" line visible; WI-10's own suite proves every launch is single-recipient) |

## Work queue (order per the `depends on` column — not WI number; a card may only start when all deps are `merged`)
| WI | Card | Priority | Depends on | Status | Notes |
|---|---|---|---|---|---|
| WI-01 | Scaffold + PWA shell | P0 | — | merged | v0.1.0, score ~9.2/10, Gate 3 tie |
| WI-02 | Local-first data layer (Dexie) | P0 | WI-01 | merged | v0.2.0, score ~9.5/10, internal gate |
| WI-03 | Calm home screen | P0 | WI-02 | merged | v0.3.0, score ~9.3/10, Gate 3 tie |
| WI-04 | Add a person + Date We Met | P0 | WI-02 | merged | v0.3.0, score ~9.4/10, Gate 3 tie, box 2 GREEN |
| WI-05 | Circles | P0 | WI-02 | merged | v0.3.0, score ~9.2/10, internal gate |
| WI-06 | Bring My People (import) | P1 | WI-02, WI-04 | merged | v0.4.0, score ~9.1/10, internal gate |
| WI-07 | Memories | P0 | WI-02, WI-04 | merged | v0.4.0, score ~9.4/10, Gate 3 tie, box 3 functional |
| WI-08 | Person profile + Our Connection | P1 | WI-02, WI-04, WI-05, WI-07 | merged | v0.5.0, score ~9.2/10, tie, box 3 GREEN, 1 fix round (flaky test) |
| WI-09 | Message one person | P0 | WI-08 | merged | v0.6.0, score ~9.4/10, verified end-to-end |
| WI-10 | Private Blast | P0 | WI-05, WI-09 | merged | v0.7.0, score ~9.6/10, box 4 GREEN, highest-scrutiny review |
| WI-11 | Gentle Nudge | P1 | WI-12 | merged | v0.4.0, score ~9.3/10, Gate 3 tie |
| WI-12 | Last Connected | P1 | WI-02 | merged | v0.3.0, score ~9.3/10, internal gate |
| WI-13 | What's Next? | P1 | WI-04, WI-08 | merged | v0.6.0, score ~9.2/10, internal gate |
| WI-14 | Next Connect | P1 | WI-08, WI-13 | merged | v0.7.0, score ~9.3/10, internal gate |
| WI-15 | Calendar Connection | P2 | WI-14 | pending | |
| WI-16 | After-Connection Memory | P1 | WI-13, WI-14 | pending | |
| WI-17 | Context at the moment | P1 | WI-08, WI-12, WI-14 | pending | |
| WI-18 | TrueTone | P1 | WI-09 | merged | v0.7.0, score ~9.3/10, internal gate |
| WI-19 | Story of Your Year (data capture) | P2 | WI-04, WI-07, WI-12, WI-14 | pending | |
| WI-20 | Export/backup + privacy | P1 | WI-02 | merged | v0.3.0, score ~9.2/10, internal gate |
| WI-21 | Publish to GitHub Pages | P0 | WI-01 | merged | v0.8.0, Pages enabled, verifying live URL post-workflow |

## Current batch / stamp
*(The merger writes the batch here: which WIs landed, the version, the tag, the changelog + README + update-script pointer.)*

## Open blockers
*(Written here with a reason + what would unblock. Never a silent skip.)*

## QC verdict log
*(Each judge verdict + score + fix rounds, one row per card, appended as the run proceeds. Full detail in the dispatch log, document 13.)*
| WI | Score | Dim.1 | Gate 2 (fidelity) | Gate 3 (bar) | Fix rounds | Verdict |
|---|---|---|---|---|---|---|
| WI-01 | 9.2/10 | 10/10 | pass | tie (calm launch state) | 0 | MERGED |
| WI-02 | 9.5/10 | 10/10 | pass | n/a (internal gate) | 0 | MERGED |
| WI-03 | 9.3/10 | 10/10 | pass | tie (calm home) | 0 | MERGED |
| WI-04 | 9.4/10 | 10/10 | pass | tie (capture friction) | 0 | MERGED |
| WI-05 | 9.2/10 | 10/10 | pass | n/a (internal gate) | 0 | MERGED |
| WI-12 | 9.3/10 | 10/10 | pass | n/a (internal gate) | 0 | MERGED |
| WI-20 | 9.2/10 | 10/10 | pass | n/a (internal gate, GL-004) | 0 | MERGED |
| WI-06 | 9.1/10 | 10/10 | pass | n/a (internal gate) | 0 | MERGED |
| WI-07 | 9.4/10 | 10/10 | pass | tie (memory-capture feel) | 0 | MERGED |
| WI-11 | 9.3/10 | 10/10 | pass | tie (gentle tone) | 0 | MERGED |
| WI-08 | 9.2/10 | 10/10 | pass | tie (profile calmness) | 1 (fixed a flaky edit-persist test race, also backported to WI-07's test) | MERGED |
| WI-09 | 9.4/10 | 10/10 | pass | n/a (functional, probe-verified) | 0 | MERGED |
| WI-13 | 9.2/10 | 10/10 | pass | n/a (internal gate) | 0 | MERGED |
| WI-10 | 9.6/10 | 10/10 | pass | n/a (picker/flow visuals, no Day One analog per spec) | 0 | MERGED — highest scrutiny, privacy invariant personally verified by conductor |
| WI-14 | 9.3/10 | 10/10 | pass | n/a (internal gate) | 0 | MERGED |
| WI-18 | 9.3/10 | 10/10 | pass | n/a (optional assist, calm-feel check) | 0 | MERGED |

# Live Ledger — Circle Nurture

*(Document 6 — the single source of truth the loops read (decision C1). The build reads this file, dispatches the next ready card, and updates it. Statuses: `pending` → `queued` (deps met) → `building` → `review` → `merged`. `blocked` = a real blocker with a written reason — never a silent skip.)*

**Repo:** `circle-nurture` (branch `main`) · **Harness:** Claude-Nine · **Last heartbeat:** *(first loop writes here)*
**Batch counter:** 0 · **Last merge stamp:** — · **HEAD:** `d6f2673` (audited apparatus committed; repo created 2026-08-12, origin/main current)

---

## Completion definition (C5) — the four boxes
| Box | Status |
|---|---|
| 1. Opens on a phone (HTTPS, installable PWA) | pending |
| 2. Add a person | pending |
| 3. Jot a memory | pending |
| 4. Send a blast message | pending |

## Work queue (order per the `depends on` column — not WI number; a card may only start when all deps are `merged`)
| WI | Card | Priority | Depends on | Status | Notes |
|---|---|---|---|---|---|
| WI-01 | Scaffold + PWA shell | P0 | — | pending | |
| WI-02 | Local-first data layer (Dexie) | P0 | WI-01 | pending | |
| WI-03 | Calm home screen | P0 | WI-02 | pending | |
| WI-04 | Add a person + Date We Met | P0 | WI-02 | pending | |
| WI-05 | Circles | P0 | WI-02 | pending | |
| WI-06 | Bring My People (import) | P1 | WI-02, WI-04 | pending | |
| WI-07 | Memories | P0 | WI-02, WI-04 | pending | |
| WI-08 | Person profile + Our Connection | P1 | WI-02, WI-04, WI-05, WI-07 | pending | |
| WI-09 | Message one person | P0 | WI-08 | pending | |
| WI-10 | Private Blast | P0 | WI-05, WI-09 | pending | centerpiece |
| WI-11 | Gentle Nudge | P1 | WI-12 | pending | |
| WI-12 | Last Connected | P1 | WI-02 | pending | |
| WI-13 | What's Next? | P1 | WI-04, WI-08 | pending | |
| WI-14 | Next Connect | P1 | WI-08, WI-13 | pending | |
| WI-15 | Calendar Connection | P2 | WI-14 | pending | |
| WI-16 | After-Connection Memory | P1 | WI-13, WI-14 | pending | |
| WI-17 | Context at the moment | P1 | WI-08, WI-12, WI-14 | pending | |
| WI-18 | TrueTone | P1 | WI-09 | pending | runtime LLM key needed |
| WI-19 | Story of Your Year (data capture) | P2 | WI-04, WI-07, WI-12, WI-14 | pending | |
| WI-20 | Export/backup + privacy | P1 | WI-02 | pending | |
| WI-21 | Publish to GitHub Pages | P0 | WI-01 | pending | completes box 1 |

## Current batch / stamp
*(The merger writes the batch here: which WIs landed, the version, the tag, the changelog + README + update-script pointer.)*

## Open blockers
*(Written here with a reason + what would unblock. Never a silent skip.)*

## QC verdict log
*(Each judge verdict + score + fix rounds, one row per card, appended as the run proceeds. Full detail in the dispatch log, document 13.)*

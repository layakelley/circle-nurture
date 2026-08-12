# Execution Plan — Circle Nurture

*(Document 16 — waves, lanes, the holding pen + landing queue, the loop register, the three-part Gauntlet block, and the budget. Written 2026-08-12. This is a living document.)*

---

## 1. Capacity (Block A answers + budget derivation)

*Interview answers recorded verbatim in `SPEC/DECISIONS.md`. Each figure below is either verified by web-research on 2026-08-12 (research §6) or marked PENDING with its source.*

| Quantity | Symbol | Value | Source / status |
|----------|--------|-------|-----------------|
| Harness | — | Claude-Nine (9Router, local) | Measured by auto-detect, 2026-08-12 |
| Paid tier / allowance | A | Unknown → conservative | User: "I don't know." (A2) |
| Effort multiplier | T | xhigh / ultracode (full effort) | User confirmed (A3) |
| Builder ceiling | N | 2500 concurrent (flash, account-level, verified) | Research §6, 2026-08-12 |
| Judge ceiling | N | 500 concurrent (deepseek-v4-pro; `pro-max` name UNVERIFIED — nearest verified figure) | Research §6 |
| Usage window | W | No rolling window documented; cap is concurrency, HTTP 429 beyond | Research §6 |
| Reserve | R | A quarter of the cap or two free slots, whichever is larger (flash: 625; pro: 125) | User: "hold back a slice" (A7) → Law 44 |
| Build interval | — | Time-triggered merge batches every 15 minutes, one atomic stamp, no count cap | Operator doctrine 2026-08-10 (B3) |
| Watch interval | — | Every 5 minutes: workflows running, `[MODEL xN]` prefixes, no idle capacity, fresh heartbeats | Operator doctrine |

**Model roles (decision A5):** builder `ds/deepseek-v4-flash(max)` · planner/judge/fixer `ds/deepseek-v4-pro-max` (judge is a different model from the builder — Law 7) · merger `ollama/glm-5.2` (local, no cost) · comparative critic per wiring · readers `agnes/agnes-2.5-flash` / `ollama/kimi-k2.6` fallbacks (A8).

**Rough budget estimate (2026-08-12, deliberately rough — never a commitment):** ~21 cards × (build ~150K tokens + judge ~60K + fix ~40K) ≈ 5–7M tokens across the run, split flash (bulk) vs pro (judge/fix). At verified rates (flash ~$0.14/$0.28 per M; pro ~$0.42/$0.84 per M) the run is on the order of **$2–8**. Caveats: the `pro-max` name is unverified (nearest is `v4-pro`), and DeepSeek has officially announced a significant near-term price increase (research §6) — budget is not locked to current rates.

---

## 2. Waves and lanes

*Waves computed from the master spec's dependency graph (Law 18 — computed, never chosen). One lane (`app`) for one repo. Within a wave, all independent cards fan out at full width (maximum-parallelism doctrine). A card may only start when every dependency is MERGED.*

| Wave | Cards (build in parallel) |
|---|---|
| 1 | WI-01 (scaffold+PWA) |
| 2 | WI-02 (data layer) |
| 3 | WI-03 (home), WI-04 (add person), WI-05 (circles), WI-12 (last connected), WI-20 (export/privacy) |
| 4 | WI-06 (import), WI-07 (memories), WI-11 (nudge) |
| 5 | WI-08 (profile+Our Connection) |
| 6 | WI-09 (message one), WI-13 (What's Next) |
| 7 | WI-10 (private blast), WI-14 (Next Connect), WI-18 (TrueTone) |
| 8 | WI-15 (calendar), WI-16 (after-connect memory), WI-17 (context strip), WI-19 (story capture) |
| — | WI-21 (Pages deploy): dep-graph wave 2 (only needs the shell) but positioned as the run's FINAL gate — it proves completion box 1, so it runs after the P0 core is merged. |

*Waves are computed: a card's wave = 1 + the max wave of its dependencies (Kahn-verified acyclic). **P0 = completion-definition core:** WI-01…05, 07, 09, 10 (boxes 2–4) plus WI-21 (box 1). Everything else is P1/P2 flowing by priority after the core is merged.*

## 3. Holding pen + landing queue

*One pen per repo (Law 39 — a table, not a file). Built cards sit in the pen until the merge train collects them.*

**Holding pen (app lane):**
| WI | Built at | Verdict (8.5/10) | Gate 3 (bar slice) | Batch |
|---|---|---|---|---|
| *(the build appends each finished card here)* | | | | |

**Landing queue (this run's batches):**
| Batch # | Stamp (version + tag) | Cards in batch | Merged at |
|---|---|---|---|
| 0 | — | — | — |

## 4. Loop register

*Derived from C0 (overnight, unattended) + the operator doctrine. Each loop is a separate terminal/process; each reads the ledger (C1) and writes back.*

| Loop | Cadence | Job |
|---|---|---|
| **Build loop** | continuous | Dispatches the next dependency-ready card to a builder (`[MODEL xN]` prefixed); writes results to the ledger; never inline. |
| **Review loop** | continuous, parallel | QC pool — one judge per completed card, three-gate stack (QC rulebook), fixer rounds, verdicts to the ledger + dispatch log. |
| **Merge train** | every 15 min | Whatever is merged-ready lands as ONE batch with one atomic stamp: version + tag + changelog + README + update-script. No count cap. |
| **Watch loop** | every 5 min | Enforces maximum parallelism: workflows running, `[MODEL xN]` prefixes, no capacity idle while work waits, fresh heartbeats. Logs + auto-corrects violations. |
| **Bar loop** | per review tick | Gate 3 comparative checks on visual cards — one comparative critic read per tick, counted in the budget. |
| **Survival loop** | continuous | Heartbeat freshness, the C5 completion check, morning report generation when the run ends. |

## 5. The three-part Gauntlet block (THE TASK / THE BUILD METHOD / THE BAR TO HIT)

*Compiled from GOAL.md + the confirmed feature list + the closed decisions + the ratified bar. Validated against GL-001…GL-008 (QC rulebook §4). Referenced by pointer from the launch command — never inlined past the character fence.*

### THE TASK (WHAT)
Build **Circle Nurture** — a private, mobile-first relationship-nurturing app. One place for your people, your circles, your memories, and your private messages. The user brings in the people who matter, organizes them into circles, remembers what matters about them, and stays in communication — one person at a time, or many people each on their own private one-to-one line (never a group text). The app nudges gently (never guilt, never scores), helps find the right words when asked (and only when the user reviews and approves — it never speaks for you), and quietly accumulates the story of your year. It feels calm, human, and visual — never a CRM dashboard, never homework for your relationships. Everything lives on the user's phone.

### THE BUILD METHOD (HOW)
Decompose the task into the 21 atomic work items (WI-01…WI-21) defined in the master spec, each with its own binary-acceptance rubric. Build in dependency order, fanning out to full width inside each computed wave, using the builder tier. QC every finished card through the three-gate stack (8.5 hard rubric → GOAL fidelity → bar-comparative) before it merges, with a judge that never built it. Land finished cards as one atomic batch every 15 minutes (version + tag + changelog + README + update-script). A watch-loop audits parallelism, model prefixes, capacity, and heartbeat freshness every 5 minutes and auto-corrects violations. Run unattended; the build, review, and merge loops drive themselves from the live ledger.

### THE BAR TO HIT (WHEN TO STOP)
Stop when the completion definition's four boxes are proven at HEAD by the checklist — the app opens on a phone over HTTPS and is installable, the user can add a person, jot a memory, and send a blast message (one message, several people, each a private one-to-one message) — AND every merged card has scored 8.5/10 or better with its bar slice passing wins-or-ties against Day One wherever a comparable surface exists. Cards beyond the four boxes keep flowing by priority until the run ends. Any piece that is correct and built as asked but not yet as good as Day One is written down plainly — "here is the one gap" — never left waiting for a win it may never score.

## 6. Completion definition (from C5)

**Done (MVP):** the app opens on a phone, and the user can (1) add people, (2) jot a memory, and (3) send a blast message (one-to-selected, individual delivery). Proven: merged (trunk ancestry) AND verified at HEAD by the checks in the checklist (document 2) AND all four completion boxes green in the ledger.

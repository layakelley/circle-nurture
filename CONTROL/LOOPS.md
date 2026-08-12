# Loops — Circle Nurture

*(Document 11 — the loop derivation. Decision C0: this project runs unattended, overnight, while the user sleeps. Decision C1: every loop reads the live ledger. Decision C2: the build merges on its own. Decision C3: overnight (~8–12 hours). The launch command (document 12) tells the user how to start these in separate terminals.)*

---

## Why loops
A single long run in one terminal would lose state and stop on the first hiccup. Loops are small, restartable, stateless-until-they-read-the-ledger processes: if one dies, the user (or the watch loop) restarts it and it picks up from the ledger. Every loop writes a heartbeat stamp; the watch loop treats a stale stamp as a violation to log and correct.

## The loops

### 1. Build loop (continuous)
Reads the ledger, finds the next card whose every dependency is `merged`, dispatches **one builder subagent** for it (never inline — Law 41; prompt carries the `[MODEL xN]` prefix; prompt kept small per the harness's large-prompt limit — current state §2), waits for the result, writes the outcome to the ledger (card → `review`, or `blocked` with a reason) and the dispatch log. One card at a time per builder slot; within a wave, fan out to full width (operator doctrine) up to the capacity ceiling minus the reserve.

### 2. Review loop / QC pool (continuous, parallel)
The instant a card is `review`, dispatch **one QC judge subagent** (a DIFFERENT model than the builder that produced it — Law 7). The judge runs the three-gate stack (QC rulebook §3): 8.5 hard rubric, GOAL fidelity, bar-comparative (blind, wins-or-ties). Fail → fixer round (fix → rebuild → re-review), at most three rounds per card per pass; then the card is parked with a written status and the queue moves on (no silent skip). Verdicts go to the ledger + dispatch log.

### 3. Merge train (every 15 minutes)
Collect every card sitting merged-ready (reviewed, gates passed), land them as **ONE batch with one atomic stamp**: version bump + git tag + changelog entry + README touch + update-script pointer. No count cap, never piecemeal (operator doctrine B3). After the stamp, the build loop can start dependents (a card may only start when all deps are merged).

### 4. Watch loop (every 5 minutes)
Enforces maximum parallelism: (a) workflows/subagents are running — never inline; (b) each carries the `[MODEL xN]` prefix; (c) no capacity sits idle while work waits (auto-dispatch more if it does); (d) every loop's heartbeat is fresh. Violations are logged and auto-corrected. This is the operator doctrine's enforcement arm.

### 5. Bar loop (per review tick)
For cards with a bar slice, Gate 3 compares the card's screenshot against the comparable Day One surface — one comparative critic read per tick, counted in the budget. A loss returns the card for one targeted round on the named gap, then the gate closes with the gap recorded (never an infinite loop; QC rulebook §5).

### 6. Survival loop (continuous)
Heartbeat freshness; when the completion definition's four boxes (C5) are all green in the ledger at HEAD, the run ends: it stops dispatching new cards, writes the morning report (document 15's runtime sibling), and stays quiet. If the run is still going when the user returns, it reports status and keeps going or stops on the user's word.

## Restart rules
- **Power / crash:** the user pastes the launch command again; every loop re-reads the ledger and resumes. Nothing is lost (see `IF-THE-POWER-GOES-OUT.md` beside the launch command).
- **A loop dies:** the watch loop logs it; the user (or a restart) relaunches that one loop; it picks up from the ledger.
- **A card is blocked:** written to the ledger with the reason and what would unblock. The queue skips it and continues; blocked cards are re-evaluated on each build tick in case the blocker cleared.

## Capacity guardrails
- Reserve (decision A7): a quarter of the cap or two free slots, whichever is larger — flash 625, pro 125. The loops never dispatch into the reserve.
- 429s are handled by backoff and re-dispatch, never by abandoning the card.
- The verified matrix (research §6) is the source of truth for ceilings; if a limit changes mid-run, the watch loop logs it and the plan adjusts.

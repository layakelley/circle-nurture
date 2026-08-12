# QC Rulebook — Circle Nurture

*(Document 7 — how every piece is judged, scored, and gated before it merges. The QC gate is HARD at 8.5/10. The judge is never the builder (Law 7). QC runs as a parallel pool — one QC sub-agent per completed work item, dispatched the instant the item completes, never a serial blocker.)*

---

## 1. Roles
| Role | Model alias (decision A5) | Notes |
|---|---|---|
| Builder | `ds/deepseek-v4-flash(max)` | Builds one work item. |
| QC judge | `ds/deepseek-v4-pro-max` | Different underlying model from the builder (Law 7). Scores the merged card against its rubric + runs the three-gate stack. |
| Fixer | `ds/deepseek-v4-pro-max` | Fixes what the judge rejects. |
| Comparative critic (Gate 3) | per current wiring | Blind A/B verdicts vs the bar, on screenshots the critic is PROVEN to see (never judged unproven). |
| Merger | `ollama/glm-5.2` | Batches merges (time-triggered, 15 min, one atomic stamp). |
| Fallbacks | `agnes/agnes-2.5-flash`, `ollama/kimi-k2.6` | Cross-provider backups (decision A8). |

## 2. The scoring rubric (0–10, HARD gate at 8.5)
Every card is scored on four weighted dimensions against its OWN rubric (master spec §2 + card `quality check` row):

1. **Correctness / binary acceptance (40%):** every binary acceptance criterion in the card's rubric passes at HEAD, proven by the checklist (document 2). A single failed box caps the score at 7.9 — no gate.
2. **Fidelity to intent (30%):** the card does what the confirmed feature list + GOAL.md intend — no more, no less (Law 42 anti-overbuild). Off-brief (missing the point, or gold-plating) caps at 7.9.
3. **Calm / privacy / product-rules compliance (20%):** the two product rules hold (never obligation, human-first engagement); the UI is calm and human, never a CRM dashboard; data stays on-device; no group-text privacy leaks; no AI autosend. Any violation caps at 6.9 and is sent to the fixer.
4. **Craft (10%):** reads like surrounding code, meets mobile-hardening rules (§1.3 of the master spec), no dead code, no console spam.

**The gate:** a merged card must score ≥ 8.5 overall AND ≥ 8.5 on dimension 1. Below that → fix loop.

## 3. The three-gate stack (every card that has a bar slice)
1. **Gate 1 — 8.5 hard rubric:** the QC judge scores the card as in §2. Fail → fix loop.
2. **Gate 2 — GOAL.md fidelity (on-brief):** the card serves the three verbs and the product rules. Fail → fix loop.
3. **Gate 3 — B2H comparative (blind):** for cards with a bar slice (visual surfaces), the comparative critic A/Bs the card's screenshot against the comparable Day One surface, blind, wins-or-ties (decision D2FROZEN). A loss is NOT a permanent block — the gap is written down plainly ("not yet as good as the example — here is the one gap") and returns to the fixer for one round on just that gap. Nothing waits forever for a win it may never score; the gate may close with the gap recorded if the fix round cannot beat it and the bar-fidelity gate otherwise passes.

## 4. GL-001…GL-008 (the Gauntlet block validation rules)
The three-part Gauntlet block in the execution plan must satisfy every rule. The QC judge re-validates the block before the first dispatch and on any edit:
- **GL-001 — THE TASK:** states WHAT; must not contain method, stop-condition, critic, or orchestration language.
- **GL-002 — THE BUILD METHOD:** states HOW; must not contain the bar or a success-stop.
- **GL-003 — THE BAR TO HIT:** states WHEN TO STOP; must not introduce new scope. Never merged into the Build Method.
- **GL-004 — bar present:** every card's bar slice is present; a card with no comparative surface carries an explicit "internal gate" note instead of a silently-missing slice.
- **GL-005 — completion definition:** the C5 four boxes appear in THE BAR TO HIT (not THE BUILD METHOD).
- **GL-006 — acyclicity:** the dependency graph topological sort returns every card, or the spec is defective.
- **GL-007 — no silent caps:** any boundary (e.g., "priority stops here") is logged, never silently truncated.
- **GL-008 — judge≠builder:** no model scores work it built (Law 7); enforced by the role split.

## 5. The fix loop
1. Judge rejects → the finding (what is wrong + how to fix, or what to improve + how) goes to the fixer, one round.
2. Fixer fixes → rebuild → re-merge → re-judge. At most **three** fix rounds per card per pass before the card is parked with a written status in the ledger and the queue moves on (no silent skip, GL-007).
3. Gate 3 loss → one targeted round on the named gap, then the gate closes with the gap recorded (never an infinite loop).

## 6. QC pool discipline
- One QC sub-agent per completed work item, dispatched the instant the item completes — parallel, never a serial blocker.
- The judge for a card is a DIFFERENT model instance from the builder that produced it (Law 7).
- All scores, verdicts, and fix rounds are written to the ledger (document 6) and the dispatch log (document 13). The morning report (document 15's sibling at runtime) summarizes the verdicts.
- Prompt hygiene: keep judge prompts small (harness rejects large system prompts — see current state §2).

## 7. What "done for the run" means
The run is complete when the **completion definition** (C5) four boxes are proven at HEAD by the checklist AND the merged tree has passed the gates above. Additional confirmed-MVP cards continue to flow by priority until the run ends; the morning report states plainly which cards are done, which are pending, and any recorded "not yet as good as the bar" gaps.

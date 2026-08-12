# Heartbeat — Circle Nurture

*(Document 14 — the survival signal. Each loop writes a fresh timestamp when it completes a tick; the watch loop reads this file and raises if any loop's stamp is stale. If the power goes out, this file shows exactly where the run stopped.)*

| Loop | Last tick | Status |
|---|---|---|
| build | 2026-08-12T15:05 | starting — WI-01 dispatched |
| review | 2026-08-12T15:05 | armed (judge = conductor, distinct model — see session log) |
| merge | 2026-08-12T15:05 | armed — first batch pending WI-01 |
| watch | *(no separate terminal this run)* | not started |
| bar | 2026-08-12T15:05 | armed (Playwright probe, proven ready) |
| survival | 2026-08-12T15:05 | watching C5 boxes |

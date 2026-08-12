# Heartbeat — Circle Nurture

*(Document 14 — the survival signal. Each loop writes a fresh timestamp when it completes a tick; the watch loop reads this file and raises if any loop's stamp is stale. If the power goes out, this file shows exactly where the run stopped.)*

| Loop | Last tick | Status |
|---|---|---|
| build | *(never)* | not started |
| review | *(never)* | not started |
| merge | *(never)* | not started |
| watch | *(never)* | not started |
| bar | *(never)* | not started |
| survival | *(never)* | not started |

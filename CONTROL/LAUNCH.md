# Launch — Circle Nurture

*(Document 12 — the handover. You run this, then you can walk away. The build reads the documents and runs itself overnight; you come back to a built, QC'd app live on GitHub Pages. If anything needs a decision only you can make, it is written down for you — it does not wait up for you.)*

---

## Before you start
- The repo `circle-nurture` is created on GitHub (`main` branch). The build pushes to it automatically (decision B2).
- The app will be **public** on GitHub (needed for free Pages). Your people, memories, and messages stay on your phone — the app is local-first. The code and spec are what become public.
- **The bar:** every finished piece is measured against **Day One** (the app you picked). Tie counts as done. If a piece is right but not yet as good as Day One, that is written down plainly — "here is the one gap" — never left waiting.

## Launch (two terminals)
Open **two terminal windows**. Paste the matching command into each, in order. Both can run at the same time.

**TERMINAL 1 — the build (this does the whole job: builds, quality-checks, merges, deploys):**
```
cd ~/Downloads/projects/circle-nurture && claude --dangerously-skip-permissions "Build Circle Nurture. Read CONTROL/EXECUTION-PLAN.md section 5 (THE TASK, THE BUILD METHOD, THE BAR TO HIT) plus CONTROL/LOOPS.md, CONTROL/LEDGER.md, CONTROL/QC-RULEBOOK.md, SPEC/MASTER-SPEC.md, SPEC/CHECKLIST.md, SPEC/GOAL.md. Drive the build, review, and merge loops from them — dispatch one builder subagent per work item (small prompts, [MODEL xN] prefix), judge each via the three-gate stack in CONTROL/QC-RULEBOOK.md, and merge one atomic batch every 15 minutes (version + tag + changelog + README + update-script). Deploy to GitHub Pages when the completion definition allows. Stop when the four C5 boxes in CONTROL/LEDGER.md are green at HEAD, then write CONTROL/MORNING-REPORT.md. Keep CONTROL/LEDGER.md, CONTROL/HEARTBEAT.md, CONTROL/DISPATCH-LOG.md, and CONTROL/CHANGELOG.md current as you go."
```

**TERMINAL 2 — the watch (keeps an eye on Terminal 1; run it if you want the automatic safety net):**
```
cd ~/Downloads/projects/circle-nurture && claude --dangerously-skip-permissions "Run the WATCH LOOP from CONTROL/LOOPS.md section 4: every 5 minutes, check that the build in the other terminal is alive, dispatched work carries the [MODEL xN] prefix, no capacity sits idle while work waits, and CONTROL/HEARTBEAT.md stamps are fresh. Log any violation to CONTROL/HEARTBEAT.md and keep watching until the build loop finishes."
```

That's it. Once both are pasted and Terminal 1 is running, you can walk away.

## If your computer restarts or the power goes out
Don't worry. Paste the same commands again — the build reads `CONTROL/LEDGER.md` and picks up exactly where it stopped. See `IF-THE-POWER-GOES-OUT.md` (same folder) for the short version.

## When you come back
- If Terminal 1 finished, `CONTROL/MORNING-REPORT.md` has the plain-language summary: the four done-boxes, what was built, what's still pending, and any "not yet as good as Day One" gaps.
- The app's live URL is in the morning report. Open it on your phone, add it to your home screen, and try it.
- To stop the build early, press Ctrl+C in Terminal 1. To pause the safety net, Ctrl+C in Terminal 2.

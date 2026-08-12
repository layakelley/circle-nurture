# Current State — Circle Nurture

*(Document 15 — what is actually true on this machine, measured 2026-08-12, not inferred. Law 28: a specification written from inference is a list of guesses. The build reads this before dispatching.)*

---

## 1. The project
- **Kind:** greenfield build (decision ARCH). Nothing existed before 2026-08-12.
- **Folder:** `~/Downloads/projects/circle-nurture/` (decision C4).
- **Repo:** to be created — none exists yet (task 9). GitHub account `layakelley` is authenticated with full scopes (see §3).
- **Code state:** zero source files. The only content in the project folder is the apparatus (SPEC/, CONTROL/, 00-INPUT/).

## 2. Harness and capacity (measured)
- **Harness:** Claude-Nine (9Router, local) — measured by auto-detect (`~/.9router/db/data.sqlite` present). Model split in decision A5; verified capacity matrix in `00-INPUT/RESEARCH-2026-08-12.md` §6.
- **A notable harness behavior:** the local router rejects agent requests whose system prompt is large with a "Prompt is too long" error at the router level (observed 2026-08-12: a workflow stack agent and a skill-loading agent both failed this way; a minimal prompt succeeded). **Build guidance:** keep dispatched prompts small and avoid loading heavyweight skills into build/QC subagents.

## 3. Credentials and environment (measured, names only — never values)
| Key / tool | Location checked | Status | Liveness check |
|---|---|---|---|
| `gh` CLI | PATH | INSTALLED — v2.87.2 (Homebrew present) | `gh --version` exit 0 |
| GitHub auth | `gh auth status` | SET — `layakelley`, full scopes (repo, workflow, delete_repo, …) | exit 0 |
| `GITHUB_TOKEN` / `GH_TOKEN` | `~/.openclaw/secrets/.env`, `~/.openclaw/.env` | present by name in env files (fallback available) | not probed independently (gh suffices) |
| AI key for TrueTone (runtime) | `~/.openclaw/secrets/.env` | `AGNES_AI_API_KEY`, `OPENROUTER_API_KEY` SET by name | OpenAI-compatible endpoints; TrueTone uses a user-supplied on-device key (WI-18) — the project needs no key now |
| Router keys (build) | `~/.openclaw/secrets/.env` | `DEEPSEEK_*_NINE_ROUTER`, `OLLAMA_*_NINE_ROUTER`, `OPENROUTER_*_NINE_ROUTER`, `AGNES_AI_API_KEY_NINE_ROUTER` SET by name | used by the 9Router harness, already proven by this session |
| Node toolchain | PATH | INSTALLED — node v26.7.0, npm 11.19.0, git 2.50.1 | exit 0 each |
| Capture tool (Gate 3 visual bars) | Playwright (Chromium) | **READY — already installed and PROVEN** | real probe screenshot `00-INPUT/scratch/capture-probe.png` = 4,839 bytes, exit 0 (no download needed; decision D3 consent unused) |
| Notion | `NOTION_API_TOKEN` in `~/.openclaw/secrets/.env` | SET (used this session to publish the feature list) | live calls exit 0 |
| Fleet env paths (`~/.openclaw/.skill-38-…`, `~/clawd/secrets/.env`, Docker/VPS) | checked | not present (normal on a personal Mac) | — |

**Hosting (decision H1):** GitHub Pages — free, zero new credentials; serves the app over HTTPS to the phone. Note: Pages free tier requires a public repo; app data stays on-device regardless (local-first privacy core).

## 4. Research feed (measured facts with sources — `00-INPUT/RESEARCH-2026-08-12.md`)
- **Domain:** personal-CRM category; the consumer, non-CRM-feeling segment is underserved. The psychology (underestimating reach-out appreciation; relationship drift) validates the gentle-nudge feature.
- **Best practice:** local-first as the core value prop; minimize relationship administration; notification discipline; delivery intents (`sms:` RFC 5724).
- **Pitfalls:** iOS IndexedDB eviction (7 days — installed PWA exempt), `svh`/`dvh`, safe-area insets, 44pt targets, notification one-shot, AI disclosure penalty, SW `skipWaiting`/`clientsClaim`.
- **Messaging verdict:** per-recipient native composer (iOS `MFMessageComposeViewController` / Android `ACTION_SENDTO` `sms:`) — one per recipient, never multi-recipient; avoids A2P 10DLC entirely; ~N taps for N recipients; no in-app reply surfacing. Two hard NOs: no multi-recipient array, no programmatic SEND_SMS.
- **Stack:** React + Vite + `vite-plugin-pwa`; Dexie; OpenAI-compatible LLM for TrueTone; `sms:` per-recipient.
- **Reference apps:** Day One is the BAR (decision BAR) — mirror memory-resurfacing, privacy-as-feature, streaks; avoid self-focus. Dex, Monica, Mesh, Contacts Journal contribute mirror ideas (decision MIRROR).

## 5. Bar and bar-availability
- **BAR (decision BAR):** Day One — dayoneapp.com, 4.8★/117k+ ratings. Named, Fetchable (live site + App Store listing), Comparable. Comparison relationship: wins-or-ties (decision D2FROZEN).
- **Capture tool:** READY (Playwright Chromium, proven §3) — Gate 3 visual comparisons can run on every visual card.
- **Vision-capable critic:** the judge tier for Gate 3 — to be proven by sending the probe screenshot to the exact judge alias BEFORE the first visual verdict (per the gauntlet; if it cannot describe the probe, route to a vision-capable alias or record the seat BLOCKED — never let a critic judge screenshots it was never proven to see).

## 6. Completion definition (decision C5)
Four binary boxes — proven at HEAD by the checklist, not screenshots alone: (1) opens on a phone (HTTPS, installable), (2) add a person, (3) jot a memory, (4) send a blast message. The 19 confirmed MVP capabilities are the scope, built in dependency order (decision FL); C5 is the done-bar for the run.

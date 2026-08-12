# Checklist — Circle Nurture

*(Document 2 — the verification commands that prove each work item at HEAD. Every binary acceptance criterion in the master spec has a check here. The build runs these at HEAD after each merge; the completion definition (C5) is proven by the four completion boxes at the bottom. Command convention: run from the repo root. `pnpm`/`npm` interchangeable; the project uses npm.)*

---

## Build & static gates (every card)
- [ ] `npm ci && npm run build` → exit 0, `dist/` produced
- [ ] `npm run lint` → exit 0 (if lint configured)
- [ ] `git status --porcelain` clean at HEAD after merge (nothing uncommitted)

## Mobile-hardening sweep (every visual card, one-time basis)
- [ ] grep: no bare `100vh` in `src/` (`grep -rn "100vh" src/` → only inside `svh/dvh` fallbacks)
- [ ] grep: `env(safe-area-inset-` present in base layout CSS
- [ ] probe screenshot at 390×844 → no horizontal overflow, nothing under notch/home indicator

---

## Per-card checks

### WI-01 — Scaffold + PWA shell
- [ ] `npm ci && npm run build` → exit 0
- [ ] probe screenshot 390×844 of shell → renders, zero horizontal overflow, safe-area applied
- [ ] `public/manifest.webmanifest` parses (name "Circle Nurture", `display: standalone`)
- [ ] service worker file present; `skipWaiting`/`clientsClaim` in SW; versioned cache name
- [ ] `public/apple-touch-icon.png` exists and is a real PNG
- [ ] `src/styles/tokens.css` exists and defines the base design tokens (palette, spacing, type)

### WI-02 — Data layer (Dexie)
- [ ] test: each table round-trips create/read/update/delete
- [ ] test: data survives a full page reload (IndexedDB persistence)
- [ ] test: migrations run idempotently from empty DB
- [ ] grep: no view imports `dexie` directly (`grep -rn "from 'dexie'" src/views/ src/components/` → empty)

### WI-03 — Calm home
- [ ] people + circles render from repos on Home (probe screenshot)
- [ ] visual audit: no charts/scoreboard UI present
- [ ] empty state renders for a fresh DB
- [ ] tap targets ≥ 44pt (probe/audit)

### WI-04 — Add a person + Date We Met
- [ ] a name-only add completes in ≤ 3 taps from Home (manual/scripted probe)
- [ ] whenMet defaults to today; accept/change/remove/unknown each persist
- [ ] new person appears in `people` and on Home
- [ ] skipped optional fields never demanded

### WI-05 — Circles
- [ ] circle create/rename/delete works
- [ ] one person belongs to ≥ 2 circles (repo assert)
- [ ] bulk-assign ≥ 5 people to a circle in one action
- [ ] no circle implies any messaging behavior (no `sms:` from CircleView)

### WI-06 — Bring My People
- [ ] import is selective (never wholesale address-book dump)
- [ ] imported people bulk-assignable to circles
- [ ] re-import dedupes by phone/name (test fixture)
- [ ] unsupported platform (iOS) degrades to manual/file with a plain message

### WI-07 — Memories
- [ ] jot a memory in ≤ 2 interactions from a person's page
- [ ] edit/delete/pin each work and persist
- [ ] list newest-first after reload
- [ ] no reminder/obligation UI anywhere in the flow

### WI-08 — Person profile + Our Connection
- [ ] profile renders context + circles + memories + actions
- [ ] Our Connection fields edit and persist
- [ ] unknown whenMet → no date shown, no error
- [ ] context ≠ memories in both the model and the UI (distinct sections)

### WI-09 — Message one person
- [ ] one tap → `sms:` URL with exactly one recipient (test spy on launcher)
- [ ] never multi-recipient (assert URL has no comma-separated recipients)
- [ ] missing number → plain-language guard, no silent failure
- [ ] `connectionLog` row written (kind=message)

### WI-10 — Private Blast
- [ ] select 3 people + a 2-person circle → 5 sequential single-recipient launches (spy)
- [ ] every produced URL contains exactly one recipient (assert, no group arrays)
- [ ] 5 `connectionLog` rows (kind=blast)
- [ ] last connected bumps after blast
- [ ] "each person gets their own private message — no group text" line visible

### WI-11 — Gentle nudge
- [ ] person past threshold → nudge renders; recent → none
- [ ] string audit: no judgment/score wording
- [ ] dismissal persists across reload
- [ ] never red/urgent styling

### WI-12 — Last Connected
- [ ] derived date correct from `connectionLog` max
- [ ] manual "we connected" log works (kind=manual)
- [ ] displayed factually, not as a score

### WI-13 — What's Next?
- [ ] sheet appears after add and after a logged interaction
- [ ] all four options route correctly (Send Message / Next Connect / Add Memory / Nothing Yet)
- [ ] no task-manager framing (no overdue/count language)

### WI-14 — Next Connect
- [ ] picker lists exactly: Coffee/Lunch/Call/Meeting/Dinner/Activity/Visit/Other/Not Yet
- [ ] plan persists and displays on profile
- [ ] mark-done writes a `connectionLog` row (kind=meet)
- [ ] picker prominent right after adding a person

### WI-15 — Calendar Connection
- [ ] chosen time → working calendar deep link OR parseable `.ics`
- [ ] no sync/OAuth/availability features present (scope audit)
- [ ] unsupported platform → `.ics` fallback, never a silent no-op

### WI-16 — After-Connection Memory
- [ ] prompt appears once after blast/marked-done
- [ ] capture optional; fully dismissible
- [ ] saved text becomes a memory on the person

### WI-17 — Context at the moment
- [ ] strip shows ≤ 3 short lines from real data
- [ ] shown at the message/composer moment
- [ ] empty data → no strip, no errors
- [ ] no dossier styling (visual audit)

### WI-18 — TrueTone
- [ ] with a test key: drafting returns 2–3 versions
- [ ] approval places an EDITABLE draft in the composer (never auto-sent)
- [ ] code review: no code path sends without the user tapping Send in the phone messenger
- [ ] LLM-echo test: drafts preserve the user's stated meaning/tone
- [ ] no-key state explains how to add a key, never errors
- [ ] audit: only the single draft prompt + the user-supplied key leave the device

### WI-19 — Story of Your Year (data capture + first glance)
- [ ] categories (people added / memories / connections / next connects this year) read from repos
- [ ] framed as narrative, never scores (string audit)
- [ ] empty state is gentle
- [ ] no popularity measures

### WI-20 — Export/backup + privacy
- [ ] export produces valid JSON containing all tables
- [ ] restore round-trips (test fixture)
- [ ] privacy statement present and accurate ("no account, no cloud, no analytics")

### WI-21 — Publish to GitHub Pages
- [ ] live URL `curl -I` → 200 over HTTPS
- [ ] probe screenshot of the live URL renders the app
- [ ] manifest + SW serve under the Pages base path
- [ ] completion box 1 proven at HEAD

---

## Completion definition (C5) — proven at HEAD, all four boxes
- [ ] **Box 1 — opens on a phone:** live URL loads over HTTPS on a phone-size viewport (probe), installable (manifest + SW)
- [ ] **Box 2 — add a person:** WI-04 proven at HEAD
- [ ] **Box 3 — jot a memory:** WI-07 proven at HEAD
- [ ] **Box 4 — send a blast message:** WI-10 proven at HEAD

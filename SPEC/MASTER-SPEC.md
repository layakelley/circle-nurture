# Master Specification — Circle Nurture

*(Document 1 — the build's instruction book. Every work item is a SECTION of this file, never a separate file (Law 39). Written by the conductor 2026-08-12 from the confirmed feature list, the closed decision register, and the sourced research. The build reads this document and dispatches builders, one work item at a time, in dependency order.)*

---

## 0. How to read this specification

- **Work items** are `WI-NN`. Each is atomic, independently verifiable, and carries its own rubric with **binary acceptance criteria** (Law 29). No unit ships without its rubric passing at 8.5/10 (the QC gate) — and each card's **Bar slice** (comparative, vs the Day One bar) is checked at Gate 3 where the card has a visual surface.
- **Dependencies** (`depends on`) define the order. The dependency graph must stay acyclic (proven in the execution plan). A card may only start when every card it depends on is **MERGED** (not merely built).
- **Lanes** = repositories. This project is ONE repo (`circle-nurture`), so every card is in the `app` lane.
- **Priorities** drive the queue: `P0` = the C5 core (must ship for the completion definition), `P1` = the remaining confirmed MVP features, `P2` = polish.
- **Conventions** (section 1) are binding on every card. When a card says "per conventions," it means section 1.
- **The three-part Gauntlet block** (THE TASK / THE BUILD METHOD / THE BAR TO HIT) lives in the execution plan (document 16) and is referenced here, never inlined (v4 7.2 clause 4).

### Completion definition (from decision C5 — the binary boxes)

1. The app opens on a phone (installable PWA served over HTTPS; a phone browser can load it and it works in an iOS/Android mobile viewport).
2. The user can **add a person** (capture-first: a name is enough; enrich later).
3. The user can **jot a memory** attached to a person.
4. The user can **send a blast message** — write once, select several people (or a circle), and each recipient's own SMS composer opens pre-filled for an individual private 1:1 message.

Each box is proven at HEAD by the checklist (document 2), not by screenshots alone.

---

## 1. Conventions (binding)

### 1.1 Product principles (from GOAL.md + the confirmed feature list)
- **Two product rules, non-negotiable:** (1) never make relationships feel like obligations; (2) the primary engagement is with another human being, not the app.
- **Calm, human, visual** — never a CRM dashboard. No charts, scores, overdue-task lists, or relationship rankings.
- **Private by default** — all data stays on the device (local-first). No accounts, no cloud sync, no analytics, no data leaving the device except (a) the single TrueTone AI call and (b) the phone's own SMS composer when the user taps Send.
- **Private Blast is not a group text.** A multi-recipient SMS array is FORBIDDEN (creates a group MMS — privacy violation). One recipient per composer launch; N recipients = N composer launches (research §5).
- **TrueTone never sends on its own.** Drafts are always reviewed and approved by the user before anything is sent.
- **Capture first. Enrich later.** Adding a person never demands a full record.

### 1.2 Stack (from research §7 — binding)
- React + Vite (client-only build), `vite-plugin-pwa` (manifest + Workbox service worker + offline caching), served on GitHub Pages.
- Dexie (IndexedDB wrapper) for local-first data.
- Private messaging via the `sms:` URL scheme (RFC 5724) — ONE recipient per launch, body percent-encoded UTF-8.
- TrueTone via an OpenAI-compatible endpoint, called from the device with a user-supplied key stored on-device; a thin note in settings documents the exposure/cost tradeoff. TrueTone is NOT required for the C5 completion boxes.

### 1.3 Mobile-hardening rules (from research §3 — binding on every visual card)
- Use `svh`/`dvh` viewport units, never bare `100vh`.
- Respect `env(safe-area-inset-*)` for the notch and home indicator.
- Tap targets ≥ 44pt; inputs ≥ 16px (no iOS auto-zoom).
- The installable PWA ships `apple-touch-icon` (standalone display honors it) and a service worker that never gets renamed; version caches and purges old ones; `skipWaiting`/`clientsClaim` so users don't sit on stale builds.
- iOS Safari can evict IndexedDB after 7 days of non-use — installed home-screen PWAs are exempt; the export/backup card (WI-20) is the safety net.

### 1.4 Data model (Dexie tables — established in WI-02, extended by later cards)
| Table | Key fields |
|---|---|
| `people` | id, name (required), phone?, email?, howMet?, whenMet? (Date\|null), whereMet?, whatConnectedUs?, organization?, remember?, createdAt, updatedAt, metDateIsExplicit (bool) |
| `circles` | id, name, createdAt |
| `circleMembers` | personId, circleId, addedAt |
| `memories` | id, personId, text, createdAt, pinned? |
| `nextConnects` | id, personId, type (coffee/lunch/call/meeting/dinner/activity/visit/other/none), targetDate?, note?, status (planned/done/none), createdAt |
| `connectionLog` | id, personId, kind (blast/message/call/meet/interaction/manual), at, note? |

All reads/writes go through typed repository modules under `src/data/`. No view touches Dexie directly.

### 1.5 File map (planned — cards extend it, never contradict it)
- `src/main.tsx`, `src/App.tsx`, `src/router.tsx` — shell
- `src/data/db.ts` + `src/data/*.repo.ts` — data layer
- `src/views/` — HomeView, PeopleView, PersonView, CircleView, BlastView, MemoriesView, SettingsView
- `src/components/` — PersonCard, CircleChip, NudgeCard, ContextStrip, Composer (message), TrueTonePanel, WhatNextSheet, NextConnectSheet
- `public/` — icons, manifest, apple-touch-icon
- `src/styles/` — tokens.css (colors, spacing, type), base.css
- `tests/` — per-card verification scripts (see checklist, document 2)

### 1.6 Quality check (every card — see the QC rulebook, document 7)
Each card's `quality check` row names its rubric + acceptance criteria (binary). The QC judge (a different model than the builder — Law 7) scores the merged card at the 8.5/10 gate and runs the three-gate stack (8.5 hard, GOAL fidelity on-brief, B2H comparative) where the card has a bar slice.

---

## 2. Work items

---

### WI-01 — Repo scaffold + installable PWA shell
- **Surface:** An empty-but-installable Circle Nurture app opens on a phone: correct safe-area padding, no notch/home-indicator overlap, no horizontal scroll, a placeholder home that later cards fill.
- **Priority:** P0. **Lane:** app. **Depends on:** — (nothing; the root).
- **Touches:** package.json, vite.config.ts, index.html, `public/manifest.webmanifest`, `public/icons/*`, `public/apple-touch-icon.png`, `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/styles/base.css`, `src/components/Shell.tsx`.
- **Current state:** greenfield — no code exists.
- **Change:** Scaffold a React+Vite app with `vite-plugin-pwa`. Configure manifest (name "Circle Nurture", standalone display, theme), icons (512/192 + apple-touch-icon), a service worker using versioned caches + `skipWaiting`/`clientsClaim`, `svh`/`dvh` base layout, `env(safe-area-inset-*)` padding, a token-based design system (calm palette, generous type). Empty shell routes.
- **Verify:** `npm run build` exits 0; a phone-size viewport (390×844) renders with no horizontal scroll and no content under the notch/home indicator; `npm run preview` serves; manifest parses (Lighthouse PWA smoke where available).
- **Quality check:** Rubric WI-01. **Binary acceptance:** (a) `npm run build` exits 0; (b) the shell renders at 390×844 with zero horizontal overflow and safe-area insets applied (probe screenshot); (c) the manifest + service worker exist and the SW version-caches assets; (d) the base design tokens are present. **Bar slice:** installable-shell feel comparable to a mobile Day One launch state (visual, Gate 3).
- **Rollback:** revert scaffold commit; re-run build.

### WI-02 — Local-first data layer (Dexie) + repositories
- **Surface:** (No visible surface yet — the foundation.) Data persists across reloads and app restarts.
- **Priority:** P0. **Lane:** app. **Depends on:** WI-01.
- **Touches:** `src/data/db.ts`, `src/data/people.repo.ts`, `src/data/circles.repo.ts`, `src/data/memories.repo.ts`, `src/data/nextConnects.repo.ts`, `src/data/connectionLog.repo.ts`, `src/data/migrations.ts`.
- **Current state:** none.
- **Change:** Establish the Dexie schema (tables in §1.4), typed repositories, a versioned migration path, and a smoke seed (a dev-only sample person). All later cards read/write only through these repos.
- **Verify:** A unit script creates, reads, updates, deletes, and re-opens records across a page reload (IndexedDB persistence proven).
- **Quality check:** Rubric WI-02. **Binary acceptance:** (a) each table round-trips CRUD; (b) data survives a full reload; (c) migrations run idempotently from an empty DB; (d) views never import Dexie directly (grep proves only repos touch it). **Bar slice:** n/a (no surface) — internal gate only.
- **Rollback:** revert; clear IndexedDB dev state.

### WI-03 — Calm home screen
- **Surface:** Home shows "your people" and "your circles" at a glance — human, visual, zero analytics. Taps: a person → their profile; a circle → its people; a floating action → add person / message.
- **Priority:** P0. **Lane:** app. **Depends on:** WI-02.
- **Touches:** `src/views/HomeView.tsx`, `src/components/PersonCard.tsx`, `src/components/CircleChip.tsx`, `src/App.tsx`.
- **Current state:** placeholder shell.
- **Change:** Render people as warm cards (name, one-line context, circle chips) and circles as chips/tiles. No charts, no counts-as-urgency, no overdue styling. Empty state invites "start with one circle / add your first person."
- **Verify:** Home lists people and circles from the repos; a person's card opens their profile (route added in WI-08 — verify navigation wiring only here).
- **Quality check:** Rubric WI-03. **Binary acceptance:** (a) people + circles render from repos; (b) the screen is calm — no scoreboard UI present (visual audit); (c) empty state renders; (d) tap targets ≥ 44pt. **Bar slice:** visual calm comparable to Day One's home (Gate 3).
- **Rollback:** revert home commit.

### WI-04 — Add a person (capture-first) + Date We Met
- **Surface:** An "Add person" flow: a name is enough; optional phone/email/remember and Our-Connection fields expand as needed. "Date we met" defaults to today, is editable, removable, or "unknown," and is stored as explicit-or-unknown.
- **Priority:** P0. **Lane:** app. **Depends on:** WI-02.
- **Touches:** `src/views/AddPersonView.tsx`, `src/data/people.repo.ts`, `src/router.tsx`.
- **Current state:** none.
- **Change:** Capture-first add flow (name → optional details), the whenMet default-to-today with accept/change/remove/unknown, and "What's Next?" entry point (surfaced fully in WI-13; wire the hook here).
- **Verify:** Adding a person with just a name succeeds; whenMet defaults to today and can be changed/cleared/marked unknown; the person appears on Home.
- **Quality check:** Rubric WI-04. **Binary acceptance:** (a) a name-only add completes in ≤ 3 taps from Home; (b) whenMet default/edit/remove/unknown all persist; (c) the new person appears in `people` and on Home; (d) the flow never asks for fields the user skips. **Bar slice:** add-flow friction comparable to Day One's capture (Gate 3).
- **Rollback:** revert; delete dev-added rows.

### WI-05 — Circles
- **Surface:** Create a circle, rename/delete it, add/remove people, multi-circle membership, and bulk-assign several people to a circle at once.
- **Priority:** P0. **Lane:** app. **Depends on:** WI-02.
- **Touches:** `src/views/CircleView.tsx`, `src/data/circles.repo.ts`, `src/data/circleMembers.repo.ts`, `src/components/PersonCard.tsx`.
- **Current state:** circles table exists (WI-02), no UI.
- **Change:** Circle CRUD, membership management, and a bulk-select → assign-to-circle flow (multi-person selection with "add to circle," then "also add to another"). A circle is purely organizational — no messaging semantics here (that's WI-10).
- **Verify:** Create a circle, add 3 people, bulk-assign 5 more across two circles; a person appears in both; deletion removes memberships cleanly.
- **Quality check:** Rubric WI-05. **Binary acceptance:** (a) circle CRUD works; (b) a person can belong to ≥ 2 circles; (c) bulk assignment works for many people at once; (d) no circle implies any messaging behavior. **Bar slice:** n/a (functional) — internal gate.
- **Rollback:** revert; wipe circle tables.

### WI-06 — Bring My People (contact import)
- **Surface:** On first run, "Who belongs in your Circle Nurture?" — the user selects existing contacts deliberately (never an auto-dump of the address book) and assigns them to circles in bulk. Where the platform allows (Android/Chrome Contact Picker), pick from the phone's contacts; otherwise import a vCard/file or add manually. On iOS Safari (no Contacts API), the manual + file-import path is the honest fallback, stated plainly in the flow.
- **Priority:** P1. **Lane:** app. **Depends on:** WI-02, WI-04.
- **Touches:** `src/views/ImportView.tsx`, `src/data/import.ts` (Contact Picker where available, vCard parse, dedupe), `src/data/people.repo.ts`, `src/data/circleMembers.repo.ts`.
- **Current state:** none.
- **Change:** Selective contact import (Contact Picker API guarded by capability check), vCard/file import, dedupe by phone/name, bulk circle assignment on imported people, and a "start with one circle" onboarding hint.
- **Verify:** Import N contacts → select subset → assign to a circle → dedupe on re-import; on iOS the flow degrades to manual/file without error.
- **Quality check:** Rubric WI-06. **Binary acceptance:** (a) import is selective (never wholesale); (b) imported people are assignable to circles in bulk; (c) re-import dedupes; (d) unsupported platforms degrade gracefully with a plain-language message. **Bar slice:** n/a (functional) — internal gate.
- **Rollback:** revert; clear imported rows.

### WI-07 — Memories, jotted down
- **Surface:** Jot a memory on a person (one field, quick), see their memories in a list, edit/delete/pin. No obligation prompts — capture is always optional.
- **Priority:** P0. **Lane:** app. **Depends on:** WI-02, WI-04.
- **Touches:** `src/components/MemoryList.tsx`, `src/components/MemoryComposer.tsx`, `src/data/memories.repo.ts`, PersonView surface (WI-08 wires it; build the components here).
- **Current state:** memories table exists (WI-02), no UI.
- **Change:** Quick-capture memory composer, list, edit, delete, pin; timestamps shown softly.
- **Verify:** Add, edit, delete, and pin memories; list is newest-first; text survives reload.
- **Quality check:** Rubric WI-07. **Binary acceptance:** (a) jot a memory in ≤ 2 interactions from a person's page; (b) edit/delete/pin work; (c) persistence across reload; (d) no reminder/obligation UI anywhere in this flow. **Bar slice:** memory-capture feel comparable to Day One's quick entry (Gate 3).
- **Rollback:** revert; clear memory rows.

### WI-08 — Person profile + Our Connection
- **Surface:** A person's page answers "Who is this person, how do I know them, and what connects us?" — Our Connection fields (how/when/where met, what connected us, organization, remember), circles, memories, actions (message, next connect, add memory). Date-we-met renders soft chronology ("Met August 2026").
- **Priority:** P1. **Lane:** app. **Depends on:** WI-02, WI-04, WI-05, WI-07.
- **Touches:** `src/views/PersonView.tsx`, `src/components/ContextStrip.tsx` (foundation), `src/data/people.repo.ts`.
- **Current state:** add flow captures some fields; no profile view.
- **Change:** The profile view composes context + circles + memories + actions; edit Our Connection fields; show "Met <date>" softly (unknown → omit). Keeps Our Connection distinct from Memories in the data and the UI.
- **Verify:** Opening a person shows all captured context, their circles, their memories, and the action row; editing a field persists.
- **Quality check:** Rubric WI-08. **Binary acceptance:** (a) profile renders context, circles, memories, actions; (b) Our Connection fields edit and persist; (c) unknown whenMet renders no date and no error; (d) context ≠ memories visually and in the model. **Bar slice:** profile calmness comparable to a Day One entry view (Gate 3).
- **Rollback:** revert; restore PersonView.

### WI-09 — Message one person
- **Surface:** From a person's page, one tap opens the phone's own messenger pre-filled to that person. Where a phone number is missing, the app says so plainly instead of failing silently.
- **Priority:** P0. **Lane:** app. **Depends on:** WI-08.
- **Touches:** `src/components/Composer.tsx` (message launcher), `src/views/PersonView.tsx`.
- **Current state:** no messaging.
- **Change:** Build the single-recipient `sms:` launcher (per-recipient, one composer). Guard: no number → clear message. Log to `connectionLog` when launched (kind=message).
- **Verify:** Tapping message opens an `sms:` URL with that one recipient; a missing number shows the plain-language guard; a log row is written.
- **Quality check:** Rubric WI-09. **Binary acceptance:** (a) one tap → composer pre-filled for exactly one recipient; (b) never multi-recipient; (c) missing-number guard present; (d) log row written. **Bar slice:** n/a (functional, device-dependent) — Gate 3 via probe where the harness can capture the URL.
- **Rollback:** revert launcher.

### WI-10 — Private Blast
- **Surface:** Write one message → select people (individuals, a circle, or across circles) → each recipient's SMS composer opens one at a time, pre-filled, individual and private. The flow states "each person gets their own private message — no group text." After the blast, Last Connected updates and an optional "Anything worth remembering?" prompt appears (surface wired here, logic in WI-16).
- **Priority:** P0. **Lane:** app. **Depends on:** WI-05, WI-09.
- **Touches:** `src/views/BlastView.tsx`, `src/data/connectionLog.repo.ts`, `src/components/WhatNextSheet.tsx` (hook).
- **Current state:** single-message launcher exists.
- **Change:** Blast composer + recipient picker (individuals and circles), per-recipient sequential composer launches (one `sms:` at a time, never an array), recipient count shown, per-person log rows (kind=blast), Last Connected bump, "What's Next?" hook.
- **Verify:** Select 3 people + a 2-person circle → 5 sequential single-recipient composers launch; log has 5 blast rows; no multi-recipient URL is ever produced.
- **Quality check:** Rubric WI-10. **Binary acceptance:** (a) write once → select people/circle/across circles; (b) N recipients → N single-recipient composer launches, never a group array; (c) each launch's URL contains exactly one recipient; (d) last-connected bumps; (e) the "no group text" line is visible. **Bar slice:** the blast flow's calm clarity — the closest comparable in Day One's surface is irrelevant here, so Gate 3 verifies the picker/flow visuals, not a Day One analog. **Note:** this is the centerpiece behavior to protect.
- **Rollback:** revert BlastView; clear blast log rows.

### WI-11 — Gentle Nudge, never homework
- **Surface:** Home quietly surfaces "It's been a little while since you and <name> connected" for people past a calm, non-urgent threshold — a soft card, never red, never "you failed." The user decides; no guilt, no scores.
- **Priority:** P1. **Lane:** app. **Depends on:** WI-12.
- **Touches:** `src/components/NudgeCard.tsx`, `src/views/HomeView.tsx`, `src/data/connectionLog.repo.ts`.
- **Current state:** connectionLog exists; no nudge logic.
- **Change:** Compute "days since last meaningful connection" from `connectionLog`; render a calm nudge card (e.g., threshold ~45 days, calm styling) that dismisses without judgment. Never shows for people with no log yet, never shows scores.
- **Verify:** A person with an old last-connected renders the nudge; a recent one does not; dismissing it is quiet; wording is gentle.
- **Quality check:** Rubric WI-11. **Binary acceptance:** (a) nudge appears past threshold only; (b) wording contains no judgment/score language (string audit); (c) dismissal persists; (d) never red/urgent styling. **Bar slice:** nudge tone mirrors Day One's gentle "On This Day" (Gate 3).
- **Rollback:** revert nudge card + logic.

### WI-12 — Last Connected
- **Surface:** Each person's page shows a simple factual "Last connected: <date>" — not a score.
- **Priority:** P1. **Lane:** app. **Depends on:** WI-02; integrates with WI-10 (blasts) and WI-14/16 (interactions).
- **Touches:** `src/data/connectionLog.repo.ts` (derived read), `src/views/PersonView.tsx`, `src/components/ContextStrip.tsx`.
- **Current state:** connectionLog rows written by blasts/messages; no derived display.
- **Change:** Derived "last connected" from `connectionLog` (max `at` per person) rendered factually; manual "we connected" log action available from the profile (kind=manual).
- **Verify:** After a blast and after a manual log, Last Connected reflects the latest; wording is factual; manual log works.
- **Quality check:** Rubric WI-12. **Binary acceptance:** (a) derived date is correct from logs; (b) manual log works; (c) displayed as a fact, not a score. **Bar slice:** n/a (functional) — internal gate.
- **Rollback:** revert display.

### WI-13 — What's Next?
- **Surface:** After adding a person or completing an interaction, a lightweight sheet asks "What's next?" — Send a Message / Next Connect / Add a Memory / Nothing Yet. Not a task manager — a bridge.
- **Priority:** P1. **Lane:** app. **Depends on:** WI-04, WI-08.
- **Touches:** `src/components/WhatNextSheet.tsx`, wiring into AddPerson and PersonView.
- **Current state:** hooks exist (WI-04, WI-10); sheet absent.
- **Change:** The What's Next sheet, its four options, and the routing to message composer / next-connect sheet (WI-14) / memory composer / dismiss.
- **Verify:** Adding a person then triggers the sheet; each option routes correctly; "Nothing Yet" dismisses quietly.
- **Quality check:** Rubric WI-13. **Binary acceptance:** (a) sheet appears after add and after a logged interaction; (b) all four options route to the right surface; (c) no task-manager framing (no overdue/count language). **Bar slice:** n/a (functional) — internal gate.
- **Rollback:** revert sheet.

### WI-14 — Next Connect
- **Surface:** On a person's page (and prominently right after adding them), "What's your Next Connect?" — Coffee/Lunch/Call/Meeting/Dinner/Activity/Visit/Other/Not Yet. The plan shows on the profile and in Context Strip.
- **Priority:** P1. **Lane:** app. **Depends on:** WI-08, WI-13.
- **Touches:** `src/components/NextConnectSheet.tsx`, `src/data/nextConnects.repo.ts`, `src/views/PersonView.tsx`.
- **Current state:** table exists (WI-02), no UI.
- **Change:** Next Connect picker, save the plan (type + optional date + note), show on profile, mark done/clear, feed Context Strip.
- **Verify:** Set a Next Connect (Coffee), it shows on the profile; mark done moves it to log; "Not Yet" stores none.
- **Quality check:** Rubric WI-14. **Binary acceptance:** (a) the picker lists the nine options exactly; (b) plan persists and displays; (c) mark-done updates Last Connected (log row kind=meet); (d) prominent after add (per the networking principle). **Bar slice:** n/a (functional) — internal gate.
- **Rollback:** revert sheet; clear nextConnect rows.

### WI-15 — Calendar Connection (lightweight)
- **Surface:** From a Next Connect, "Add to calendar" — pick a time, and the phone's calendar app opens pre-filled (or a small `.ics` is produced where deep links are unavailable). Intentionally narrow: not a scheduling platform.
- **Priority:** P2. **Lane:** app. **Depends on:** WI-14.
- **Touches:** `src/components/CalendarLink.tsx`, `src/utils/calendar.ts` (platform calendar deep-links + `.ics` generator), NextConnectSheet wiring.
- **Current state:** Next Connect plans exist; no calendar action.
- **Change:** Lightweight calendar deep-link launch + `.ics` fallback for the Next Connect; a note explains the platform limits. No sync, no OAuth, no Calendly-like scheduling.
- **Verify:** A Next Connect with a chosen time produces a working calendar link or a parseable `.ics`; unsupported platforms get the `.ics` fallback, not an error.
- **Quality check:** Rubric WI-15. **Binary acceptance:** (a) deep link or `.ics` produced; (b) narrow scope — no sync/OAuth/availability features; (c) failure degrades to `.ics`, never a silent no-op. **Bar slice:** n/a (functional) — internal gate.
- **Rollback:** revert calendar util.

### WI-16 — After-Connection Memory
- **Surface:** After a scheduled interaction or a blast, an optional gentle prompt: "Anything worth remembering?" Capturing is always optional and dismissible.
- **Priority:** P1. **Lane:** app. **Depends on:** WI-13, WI-14.
- **Touches:** `src/components/AfterConnectPrompt.tsx`, wiring into WI-10's blast tail and WI-14's mark-done.
- **Current state:** memory composer exists (WI-07); no post-interaction prompt.
- **Change:** The optional prompt after a completed interaction; it writes a memory (or nothing) and never reappears naggingly.
- **Verify:** After a blast / marked-done, the prompt appears once, saves a memory if entered, and is fully dismissible.
- **Quality check:** Rubric WI-16. **Binary acceptance:** (a) prompt appears after interaction once; (b) capture optional; (c) dismissible without friction; (d) saved text becomes a memory on the person. **Bar slice:** n/a (functional) — internal gate.
- **Rollback:** revert prompt.

### WI-17 — Context at the moment of connection
- **Surface:** Before messaging/calling/meeting, a small Context Strip surfaces one or two useful pieces: last connected, a remembered detail, last memory, upcoming Next Connect. Not a dossier.
- **Priority:** P1. **Lane:** app. **Depends on:** WI-08, WI-12, WI-14.
- **Touches:** `src/components/ContextStrip.tsx` (fill out), `src/views/PersonView.tsx`, Composer wiring.
- **Current state:** ContextStrip exists as a stub (WI-08).
- **Change:** Populate the strip from people (remember), memories (latest/pinned), connectionLog (last connected), nextConnects (upcoming). Show max 3 short lines; keep it human.
- **Verify:** A person with data shows the strip before messaging; empty data → no strip; it never overwhelms.
- **Quality check:** Rubric WI-17. **Binary acceptance:** (a) strip shows ≤ 3 short lines from real data; (b) shown at the message/composer moment; (c) empty-state renders nothing, no errors; (d) no dossier styling. **Bar slice:** contextual usefulness comparable to Day One's context presentation (Gate 3).
- **Rollback:** revert strip population.

### WI-18 — TrueTone
- **Surface:** In the message composer, "Need the right words?" — the user says what they mean; TrueTone drafts a few versions preserving meaning/tone/voice; the user picks/edits and reviews the exact text before sending. It never sends on its own and never touches contacts.
- **Priority:** P1. **Lane:** app. **Depends on:** WI-09 (composer); runtime LLM key.
- **Touches:** `src/components/TrueTonePanel.tsx`, `src/utils/llm.ts` (OpenAI-compatible call, on-device key), Settings (key field + disclosure note), `src/data/people.repo.ts` (minimal context passed to the prompt).
- **Current state:** none.
- **Change:** The TrueTone panel: user intent input → LLM drafts (2–3 versions, short) → user approves/edits → text drops into the composer as an editable draft, NEVER auto-sent. Key stored on-device (settings), the call goes straight to the endpoint from the device; the settings disclosure documents that the key lives on the phone and the single prompt leaves the device. AI-disclosure is respected (draft is the user's own voice; user reviews). If no key is set, the panel explains how to add one and stays optional.
- **Verify:** With a test key, drafting returns 2–3 versions; approval places an editable draft in the composer; nothing is ever sent without the user tapping Send in the phone's own messenger; no-key state explains itself.
- **Quality check:** Rubric WI-18. **Binary acceptance:** (a) drafts are editable before send; (b) never autosend (code review + behavior check); (c) drafts respect the user's stated meaning/tone (LLM-echo test); (d) no-key state is a plain explanation, not an error; (e) only the single draft prompt + the user-supplied key leave the device. **Bar slice:** n/a (optional assist) — Gate 3 checks the panel's calm, non-manufactured feel.
- **Rollback:** revert panel; keep composer independent (TrueTone off is a fully working composer).

### WI-19 — Story of Your Year (data capture + a first glance)
- **Surface:** A quiet "This year" corner on Home (or Settings) that can list, from captured data: people added this year, memories captured, connections kept, Next Connects made — without scorekeeping or popularity framing. The FULL annual storytelling experience is future; the MVP captures the data and offers a modest first glance.
- **Priority:** P2. **Lane:** app. **Depends on:** WI-04, WI-07, WI-12, WI-14 (data already exists; this card surfaces it).
- **Touches:** `src/views/YearView.tsx`, `src/utils/year.ts` (aggregation from repos), Home wiring.
- **Current state:** the underlying data is captured by earlier cards; no aggregate surface.
- **Change:** A simple, calm aggregation view: people added this year, memories count, connections count, next-connect count — framed as "your year," never as metrics or scores.
- **Verify:** With sample data, the year view lists the categories truthfully; empty data renders a gentle "your year is taking shape" state.
- **Quality check:** Rubric WI-19. **Binary acceptance:** (a) categories read from real repos; (b) framed as narrative, never scores (string audit); (c) empty state is gentle; (d) no popularity measures. **Bar slice:** emotional tone mirrors Day One's year-in-review (Gate 3).
- **Rollback:** revert view.

### WI-20 — Export/backup + privacy
- **Surface:** Settings offers "Export my data" (a single JSON download of everything, for backup or peace of mind) and a plain-language privacy statement: everything lives on this device, nothing is uploaded (except the single TrueTone draft if used).
- **Priority:** P1. **Lane:** app. **Depends on:** WI-02.
- **Touches:** `src/views/SettingsView.tsx`, `src/utils/export.ts`, `src/styles/base.css`.
- **Current state:** data is local; no export surface.
- **Change:** JSON export (all tables), the privacy statement, and a clear "no account, no cloud, no analytics" line.
- **Verify:** Export produces a valid JSON containing all rows; re-importing it (test) restores the data; the privacy statement is accurate.
- **Quality check:** Rubric WI-20. **Binary acceptance:** (a) export file contains all tables and is valid JSON; (b) restore round-trips (test fixture); (c) privacy statement present and accurate. **Bar slice:** internal gate — no direct Day One comparable surface; privacy-as-feature is a principle, not a visual A/B (GL-004).
- **Rollback:** revert export util.

### WI-21 — Publish to GitHub Pages
- **Surface:** The app is live over HTTPS on GitHub Pages — a phone anywhere can open it. The install prompt works (PWA installable). Deployment is the final gate of the completion definition.
- **Priority:** P0 (needed for C5 box 1). **Lane:** app (deploy). **Depends on:** WI-01 (the shell must build); runs after all P0 cards merge.
- **Touches:** GitHub Pages workflow/config, `public/` artifacts, CI wiring, the repo settings.
- **Current state:** repo to be created (document 11 / task 9); no Pages.
- **Change:** Configure Pages deployment (build + publish `dist`), the PWA base-path handling for the repo's Pages URL, and an installability smoke test on a phone-sized viewport from the live URL.
- **Verify:** `curl -I` on the live URL returns 200 over HTTPS; a probe screenshot of the live URL renders the app; manifest serves; the app installs (Lighthouse PWA smoke).
- **Quality check:** Rubric WI-21. **Binary acceptance:** (a) live URL serves 200 over HTTPS; (b) app renders on a phone-size probe from the live URL; (c) manifest + SW serve correctly under the Pages base path; (d) completion-definition box 1 proven at HEAD. **Bar slice:** launch-state experience comparable to opening a polished installed app (Gate 3).
- **Rollback:** unpublish/disable Pages; revert config.

---

## 3. Dependency index (each card's direct dependencies)

| Card | Depends on |
|---|---|
| WI-01 | — |
| WI-02 | WI-01 |
| WI-03 | WI-02 |
| WI-04 | WI-02 |
| WI-05 | WI-02 |
| WI-06 | WI-02, WI-04 |
| WI-07 | WI-02, WI-04 |
| WI-08 | WI-02, WI-04, WI-05, WI-07 |
| WI-09 | WI-08 |
| WI-10 | WI-05, WI-09 |
| WI-11 | WI-12 |
| WI-12 | WI-02 |
| WI-13 | WI-04, WI-08 |
| WI-14 | WI-08, WI-13 |
| WI-15 | WI-14 |
| WI-16 | WI-13, WI-14 |
| WI-17 | WI-08, WI-12, WI-14 |
| WI-18 | WI-09 |
| WI-19 | WI-04, WI-07, WI-12, WI-14 |
| WI-20 | WI-02 |
| WI-21 | WI-01 |

*Acyclicity: proven by topological sort in the execution plan (document 16). The sort must return every card or the spec is defective (Law 18).*

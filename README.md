# Circle Nurture

**My people. My circles. One private place to remember, communicate, and stay connected.**

Circle Nurture is a mobile-first, local-first app for nurturing the people in your life —
personal and professional. Everything lives on your device: **no account, no cloud sync,
no analytics.** The app is deliberately calm — no dashboards, no scores, no overdue lists.

- **People** — add someone with just a name (capture first, enrich later)
- **Circles** — the groups in your life; a circle never implies group chat
- **Memories** — jot a moment attached to a person
- **Message / Private Blast** — each recipient opens their *own* private 1:1 SMS composer,
  never a group text
- **Next Connect** — a gentle, never-homework nudge to stay in touch
- **TrueTone** — optional AI draft assistance, always reviewed by you before sending

Built with React + Vite, stored in IndexedDB (Dexie), served as an installable PWA.

## Status

The app is being built by an autonomous build/QC/merge loop — see `CONTROL/LEDGER.md` for
live status and `CONTROL/CHANGELOG.md` for what's landed. Current: `v0.6.0` — scaffold through one-to-one messaging are in and navigable
end to end (add a person → What's Next → message them, or open their profile any
time). Private Blast (the centerpiece multi-recipient flow) is still building.

## Update

To pull the latest merged build and rebuild locally: `./scripts/update.sh`

## Development

```bash
npm ci
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Deployment

The app is published to GitHub Pages. Deployment is driven by the build's WI-21 card
(see `SPEC/MASTER-SPEC.md`) and the merge train in `CONTROL/EXECUTION-PLAN.md`.

## Privacy

All data stays on the device. The only things that ever leave it: a single TrueTone
AI call (only if you add a key and approve a draft) and the phone's own SMS composer
when you tap Send.

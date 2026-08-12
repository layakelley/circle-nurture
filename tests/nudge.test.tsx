// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

import { db } from '../src/data/db'
import { createPerson } from '../src/data/people.repo'
import { createConnectionLog } from '../src/data/connectionLog.repo'
import {
  NUDGE_THRESHOLD_DAYS,
  getPeopleNeedingNudge,
  dismissNudge,
} from '../src/utils/nudge'
import NudgeCard from '../src/components/NudgeCard'
import fs from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------
// WI-11: Gentle Nudge, never homework.
// ---------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS)
}

beforeEach(async () => {
  await db.people.clear()
  await db.connectionLog.clear()
  await db.nudgeDismissals.clear()
})

afterEach(() => {
  cleanup()
})

describe('getPeopleNeedingNudge', () => {
  it('includes a person whose last connection is older than the threshold', async () => {
    const personId = await createPerson({ name: 'Older Gap', metDateIsExplicit: false })
    await createConnectionLog({
      personId,
      kind: 'call',
      at: daysAgo(NUDGE_THRESHOLD_DAYS + 5),
    })

    const results = await getPeopleNeedingNudge()

    expect(results.map((r) => r.personId)).toContain(personId)
    const entry = results.find((r) => r.personId === personId)
    expect(entry?.name).toBe('Older Gap')
    expect(entry?.lastConnected).toBeInstanceOf(Date)
  })

  it('excludes a person connected recently (within the threshold)', async () => {
    const personId = await createPerson({ name: 'Recent Connect', metDateIsExplicit: false })
    await createConnectionLog({
      personId,
      kind: 'message',
      at: daysAgo(NUDGE_THRESHOLD_DAYS - 10),
    })

    const results = await getPeopleNeedingNudge()

    expect(results.map((r) => r.personId)).not.toContain(personId)
  })

  it('never includes a person with no connectionLog entry at all', async () => {
    const personId = await createPerson({ name: 'Brand New', metDateIsExplicit: false })
    // No connectionLog rows created for this person — should never nudge.

    const results = await getPeopleNeedingNudge()

    expect(results.map((r) => r.personId)).not.toContain(personId)
  })

  it('dismissing a nudge persists across a subsequent call, but a later NEW gap can nudge again', async () => {
    const personId = await createPerson({ name: 'Reconnector', metDateIsExplicit: false })
    await createConnectionLog({
      personId,
      kind: 'call',
      at: daysAgo(NUDGE_THRESHOLD_DAYS + 5),
    })

    let results = await getPeopleNeedingNudge()
    expect(results.map((r) => r.personId)).toContain(personId)

    const entry = results.find((r) => r.personId === personId)!
    await dismissNudge(personId, entry.lastConnected)

    // Simulate a reload: a fresh call should not surface the dismissed nudge.
    results = await getPeopleNeedingNudge()
    expect(results.map((r) => r.personId)).not.toContain(personId)

    // Now simulate reconnecting: a fresh log entry more recent than the
    // dismissed gap. `getLastConnected` is a max-of-`at`, so a new, more
    // recent entry moves `lastConnected` forward past what was dismissed.
    await createConnectionLog({ personId, kind: 'meet', at: daysAgo(1) })

    // Right after reconnecting, no nudge (gap is fresh).
    results = await getPeopleNeedingNudge()
    expect(results.map((r) => r.personId)).not.toContain(personId)

    // Advance time past the threshold from that new reconnect point.
    const future = new Date(Date.now() + (NUDGE_THRESHOLD_DAYS + 5) * DAY_MS)
    results = await getPeopleNeedingNudge(future)
    expect(results.map((r) => r.personId)).toContain(personId)
  })
})

describe('NudgeCard — never judgment/score language, never urgent color', () => {
  const judgmentWords = /\b(score|streak|failed|overdue)\b|%/i

  it('renders the gentle message with the person\'s name and no judgment language', () => {
    render(<NudgeCard name="Jamie" onDismiss={() => {}} />)

    const message = screen.getByText(/It's been a little while since you and Jamie connected\./)
    expect(message).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(judgmentWords)
  })

  it('calls onDismiss when the dismiss control is used', async () => {
    let dismissed = false
    render(<NudgeCard name="Riley" onDismiss={() => (dismissed = true)} />)

    screen.getByRole('button', { name: /dismiss/i }).click()

    expect(dismissed).toBe(true)
  })

  it('never uses a red/alert color in its stylesheet', () => {
    const cssPath = path.resolve(__dirname, '../src/components/NudgeCard.css')
    const css = fs.readFileSync(cssPath, 'utf-8')

    // No hardcoded red hex triplets/shorthand, and no CSS color-name "red".
    expect(css).not.toMatch(/#f00\b/i)
    expect(css).not.toMatch(/#ff0000\b/i)
    expect(css).not.toMatch(/\bred\b/i)
    expect(css).not.toMatch(/\bcrimson\b/i)
    expect(css).not.toMatch(/\bcolor-danger\b/i)
    expect(css).not.toMatch(/\bcolor-alert\b/i)

    // It only draws colors from the established warm/gentle token set.
    expect(css).toMatch(/--color-(gentle|accent-soft|text|text-muted|surface|border)/)
  })
})

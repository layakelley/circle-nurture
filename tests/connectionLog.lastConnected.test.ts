import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/data/db'
import {
  createConnectionLog,
  getConnectionLog,
  getLastConnected,
  listConnectionLogByPerson,
  logManualConnection,
} from '../src/data/connectionLog.repo'
import { formatLastConnected } from '../src/components/LastConnectedLabel'

// WI-12: Last Connected — a derived, factual date (never a score) computed
// as the max `at` timestamp among a person's connectionLog rows.
describe('getLastConnected / logManualConnection (WI-12)', () => {
  beforeEach(async () => {
    await db.connectionLog.clear()
  })

  it('returns null when nothing is logged yet', async () => {
    expect(await getLastConnected(999)).toBeNull()
  })

  it('returns the max `at` across a blast log and a manual log for the same person', async () => {
    const personId = 1
    const earlier = new Date('2026-01-15T10:00:00Z')
    const later = new Date('2026-06-20T10:00:00Z')

    // Blast log logged first (earlier timestamp)...
    await createConnectionLog({ personId, kind: 'blast', at: earlier })
    // ...then a manual log with a later timestamp.
    const manualId = await logManualConnection(personId, 'Caught up over coffee')

    const manualRow = await getConnectionLog(manualId)
    expect(manualRow?.kind).toBe('manual')
    expect(manualRow?.personId).toBe(personId)
    // logManualConnection stamps "now" — patch it to the intended `later`
    // fixture time so the max-of-two assertion below is deterministic.
    await db.connectionLog.update(manualId, { at: later })

    const lastConnected = await getLastConnected(personId)
    expect(lastConnected).toBeInstanceOf(Date)
    expect(lastConnected?.getTime()).toBe(later.getTime())

    // Sanity: it's genuinely the max, not just "the most recently written row".
    const rows = await listConnectionLogByPerson(personId)
    expect(rows).toHaveLength(2)
    expect(Math.max(...rows.map((r) => r.at.getTime()))).toBe(lastConnected?.getTime())
  })

  it('does not mix up connection logs between different people', async () => {
    const personA = 10
    const personB = 20
    await createConnectionLog({ personId: personA, kind: 'call', at: new Date('2026-03-01') })
    await createConnectionLog({ personId: personB, kind: 'meet', at: new Date('2026-07-01') })

    const lastA = await getLastConnected(personA)
    const lastB = await getLastConnected(personB)
    expect(lastA?.getTime()).toBe(new Date('2026-03-01').getTime())
    expect(lastB?.getTime()).toBe(new Date('2026-07-01').getTime())
  })

  it('logManualConnection writes a retrievable kind="manual" row stamped with the current time', async () => {
    const before = Date.now()
    const id = await logManualConnection(42)
    const after = Date.now()

    const row = await getConnectionLog(id)
    expect(row).toBeDefined()
    expect(row?.kind).toBe('manual')
    expect(row?.personId).toBe(42)
    expect(row?.at.getTime()).toBeGreaterThanOrEqual(before)
    expect(row?.at.getTime()).toBeLessThanOrEqual(after)

    // And it's what getLastConnected picks up for that person.
    const lastConnected = await getLastConnected(42)
    expect(lastConnected?.getTime()).toBe(row?.at.getTime())
  })

  it('logManualConnection stores an optional note', async () => {
    const id = await logManualConnection(7, 'Ran into her at the farmers market')
    const row = await getConnectionLog(id)
    expect(row?.note).toBe('Ran into her at the farmers market')
  })
})

// The label is a stated FACT ("Last connected: <Month Year>" / "No
// connection logged yet") — never a score, percentage, or streak. This
// tests the exact copy-formatting function the component renders,
// end-to-end from real repo data.
describe('LastConnectedLabel copy (WI-12)', () => {
  const scoreLikeWords = /\b(score|streak)\b|%/i

  beforeEach(async () => {
    await db.connectionLog.clear()
  })

  it('renders "No connection logged yet" for a person with no logs — never a score', async () => {
    const lastConnected = await getLastConnected(555)
    const label = formatLastConnected(lastConnected)

    expect(label).toBe('No connection logged yet')
    expect(label).not.toMatch(scoreLikeWords)
    expect(label.toLowerCase()).not.toContain('overdue')
  })

  it('renders "Last connected: <Month Year>" from real connection-log data — never a score', async () => {
    const personId = 3
    await createConnectionLog({ personId, kind: 'message', at: new Date('2026-02-10') })
    await logManualConnection(personId)

    const lastConnected = await getLastConnected(personId)
    const label = formatLastConnected(lastConnected)

    expect(label).toMatch(/^Last connected: [A-Z][a-z]+ \d{4}$/)
    expect(label).not.toMatch(scoreLikeWords)
    expect(label.toLowerCase()).not.toContain('overdue')
  })
})

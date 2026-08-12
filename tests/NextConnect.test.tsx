// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import NextConnectSheet from '../src/components/NextConnectSheet'
import NextConnectSummary from '../src/components/NextConnectSummary'
import { db } from '../src/data/db'
import { listNextConnectsByPerson } from '../src/data/nextConnects.repo'
import { listConnectionLogByPerson } from '../src/data/connectionLog.repo'

// ---------------------------------------------------------------------
// WI-14 acceptance tests.
//
// NextConnectSheet is a nine-option picker (eight concrete plans + "Not
// Yet"), never a task manager: it saves a single planned `nextConnects`
// row, and "Not Yet" is a fully legitimate answer that saves nothing.
// NextConnectSummary displays the current plan as a plain fact and lets
// the user mark it done, which logs a connectionLog row (kind: 'meet')
// and flips the plan's status — with no urgent/overdue framing anywhere.
// ---------------------------------------------------------------------

const EXPECTED_OPTIONS = [
  'Coffee',
  'Lunch',
  'Call',
  'Meeting',
  'Dinner',
  'Activity',
  'Visit',
  'Other',
  'Not Yet',
]

// Phrases that would turn this into a task-manager / overdue surface.
const FORBIDDEN_PATTERNS = [
  /overdue/i,
  /past due/i,
  /\btask(s)?\b/i,
  /\bto-?do(s)?\b/i,
  /\bchecklist\b/i,
  /\breminder(s)?\b/i,
  /\bbacklog\b/i,
  /\burgent\b/i,
]

beforeEach(async () => {
  await Promise.all([db.nextConnects.clear(), db.connectionLog.clear()])
})

afterEach(() => {
  cleanup()
})

describe('NextConnectSheet — lists exactly the nine options, in order', () => {
  it('renders the nine options with the exact labels and order', () => {
    render(<NextConnectSheet personId={1} open={true} onClose={vi.fn()} />)

    const buttons = screen.getAllByRole('button')
    const labels = buttons.map((button) => button.textContent)

    expect(labels).toEqual(EXPECTED_OPTIONS)
  })

  it('renders nothing when closed', () => {
    render(<NextConnectSheet personId={1} open={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Coffee' })).not.toBeInTheDocument()
  })
})

describe('NextConnectSheet — picking a plan persists it, and it then displays', () => {
  it('picking "Coffee" with a date saves a planned nextConnects row and calls onSaved + onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSaved = vi.fn()
    const personId = 101

    render(<NextConnectSheet personId={personId} open={true} onClose={onClose} onSaved={onSaved} />)

    await user.click(screen.getByRole('button', { name: 'Coffee' }))

    // Detail step: date + note, both optional. fireEvent.change (not
    // user.type) because jsdom's type="date" input validates the full
    // ISO string on every keystroke, which rejects the partial
    // intermediate values character-by-character typing would send —
    // same approach as tests/AddPersonView.test.tsx.
    const dateInput = screen.getByLabelText('Date (optional)') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-08-20' } })
    expect(dateInput.value).toBe('2026-08-20')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(onClose).toHaveBeenCalledTimes(1)

    const rows = await listNextConnectsByPerson(personId)
    expect(rows).toHaveLength(1)
    expect(rows[0].type).toBe('coffee')
    expect(rows[0].status).toBe('planned')
    expect(rows[0].targetDate).toBeInstanceOf(Date)
    expect(rows[0].targetDate?.getFullYear()).toBe(2026)
    expect(rows[0].targetDate?.getMonth()).toBe(7) // August, 0-indexed
    expect(rows[0].targetDate?.getDate()).toBe(20)

    // The sheet's `open` prop is controlled by the parent in real usage;
    // here nothing flips it back to false, so unmount it explicitly
    // before rendering the summary — otherwise its still-mounted detail
    // view (which also contains the text "Coffee") would shadow the
    // summary's own text queries below.
    cleanup()

    // ...and the summary component then displays it.
    render(<NextConnectSummary personId={personId} />)
    expect(await screen.findByText(/Coffee/)).toBeInTheDocument()
    expect(screen.getByText(/Aug 20/)).toBeInTheDocument()
  })

  it('picking a plan with no date saves it and the summary shows "no date set"', async () => {
    const user = userEvent.setup()
    const personId = 102

    render(<NextConnectSheet personId={personId} open={true} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Call' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(async () => {
      const rows = await listNextConnectsByPerson(personId)
      expect(rows).toHaveLength(1)
    })

    cleanup()
    render(<NextConnectSummary personId={personId} />)
    expect(await screen.findByText('Call — no date set')).toBeInTheDocument()
  })
})

describe('NextConnectSheet — "Not Yet" saves nothing', () => {
  it('closes immediately with no nextConnects row created, and no active plan displays', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSaved = vi.fn()
    const personId = 103

    render(<NextConnectSheet personId={personId} open={true} onClose={onClose} onSaved={onSaved} />)

    await user.click(screen.getByRole('button', { name: 'Not Yet' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSaved).not.toHaveBeenCalled()

    const rows = await listNextConnectsByPerson(personId)
    expect(rows).toHaveLength(0)

    cleanup()
    const { container } = render(<NextConnectSummary personId={personId} />)
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })
})

describe('NextConnectSummary — "Mark done" logs a connection and flips status', () => {
  it('writes a connectionLog row (kind: meet) and updates the nextConnects row to status: done', async () => {
    const user = userEvent.setup()
    const personId = 104

    // Seed a planned Next Connect directly via the sheet's save path.
    render(<NextConnectSheet personId={personId} open={true} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Lunch' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    let planId: number | undefined
    await waitFor(async () => {
      const rows = await listNextConnectsByPerson(personId)
      expect(rows).toHaveLength(1)
      planId = rows[0].id
    })

    cleanup()
    render(<NextConnectSummary personId={personId} />)
    const markDone = await screen.findByRole('button', { name: 'Mark done' })
    await user.click(markDone)

    await waitFor(async () => {
      const logs = await listConnectionLogByPerson(personId)
      expect(logs).toHaveLength(1)
      expect(logs[0].kind).toBe('meet')
    })

    await waitFor(async () => {
      const rows = await listNextConnectsByPerson(personId)
      const updated = rows.find((row) => row.id === planId)
      expect(updated?.status).toBe('done')
    })

    // Once done, it's no longer the "current" plan.
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Mark done' })).not.toBeInTheDocument()
    })
  })
})

describe('NextConnectSheet + NextConnectSummary — no urgency/overdue framing anywhere', () => {
  it('never renders overdue/urgent/task-manager language in the sheet', () => {
    const { container } = render(<NextConnectSheet personId={1} open={true} onClose={vi.fn()} />)
    const rendered = container.textContent ?? ''
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(rendered).not.toMatch(pattern)
    }
  })

  it('never renders overdue/urgent/task-manager language in the summary, even for a past target date', async () => {
    const personId = 105
    await db.nextConnects.add({
      personId,
      type: 'coffee',
      targetDate: new Date('2020-01-01'), // long past — must never read as "overdue"
      status: 'planned',
      createdAt: new Date(),
    })

    const { container } = render(<NextConnectSummary personId={personId} />)
    await screen.findByText(/Coffee/)

    const rendered = container.textContent ?? ''
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(rendered).not.toMatch(pattern)
    }
  })
})

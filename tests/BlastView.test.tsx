// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import BlastView from '../src/views/BlastView'
import { smsNavigation } from '../src/components/Composer'
import { db } from '../src/data/db'
import { createPerson } from '../src/data/people.repo'
import { createCircle } from '../src/data/circles.repo'
import { addCircleMember } from '../src/data/circleMembers.repo'
import { listConnectionLog } from '../src/data/connectionLog.repo'

// ---------------------------------------------------------------------
// WI-10 acceptance tests, run against real Dexie/IndexedDB
// (fake-indexeddb, installed globally by tests/setup.ts), exactly like
// tests/PersonView.test.tsx and tests/Composer.test.tsx do.
//
// The single most important assertion in this whole file: EVERY sms:
// launch produced by a blast addresses exactly one recipient. Nothing
// here should ever see a comma or multiple phone numbers in one
// navigate() call — that would mean a group text slipped through.
// ---------------------------------------------------------------------

beforeEach(async () => {
  await Promise.all([
    db.people.clear(),
    db.circles.clear(),
    db.circleMembers.clear(),
    db.connectionLog.clear(),
  ])
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('BlastView — copy', () => {
  it('always visibly renders the no-group-text privacy line', () => {
    render(<BlastView />)
    expect(
      screen.getByText(/each person gets their own private message.*no group text/i),
    ).toBeInTheDocument()
  })
})

describe('BlastView — send: individuals + a circle, no overlap', () => {
  it('sends 3 individuals plus a 2-person circle as 5 sequential single-recipient launches, each writing one connectionLog row', async () => {
    const user = userEvent.setup()
    const navigateSpy = vi.spyOn(smsNavigation, 'navigate').mockImplementation(() => {})

    const alice = await createPerson({ name: 'Alice Adams', phone: '+15550000001', metDateIsExplicit: false })
    const bob = await createPerson({ name: 'Bob Baker', phone: '+15550000002', metDateIsExplicit: false })
    const cara = await createPerson({ name: 'Cara Cole', phone: '+15550000003', metDateIsExplicit: false })
    const dana = await createPerson({ name: 'Dana Diaz', phone: '+15550000004', metDateIsExplicit: false })
    const eli = await createPerson({ name: 'Eli Evans', phone: '+15550000005', metDateIsExplicit: false })

    const circleId = await createCircle({ name: 'Book Club' })
    await addCircleMember({ personId: dana, circleId })
    await addCircleMember({ personId: eli, circleId })

    render(<BlastView />)

    await user.type(screen.getByLabelText('Message'), "Thinking of you!")

    await user.click(screen.getByRole('checkbox', { name: 'Alice Adams' }))
    await user.click(screen.getByRole('checkbox', { name: 'Bob Baker' }))
    await user.click(screen.getByRole('checkbox', { name: 'Cara Cole' }))
    await user.click(screen.getByRole('button', { name: 'Book Club' }))

    // Live-updating distinct-recipient count: 3 individuals + 2 circle
    // members, zero overlap, so 5.
    expect(screen.getByText(/5 people selected/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /send private blast to 5/i }))

    await waitFor(() => expect(navigateSpy).toHaveBeenCalledTimes(5))

    // Every produced URL addresses exactly one recipient: no comma, no
    // multiple phone numbers, ever.
    const urls = navigateSpy.mock.calls.map(([url]) => url)
    for (const url of urls) {
      expect(url).not.toContain(',')
      const matches = url.match(/\+1555000000\d/g) ?? []
      expect(matches.length).toBe(1)
    }

    const addressed = urls.map((url) => url.match(/sms:(\+\d+)/)?.[1]).sort()
    expect(addressed).toEqual(
      ['+15550000001', '+15550000002', '+15550000003', '+15550000004', '+15550000005'].sort(),
    )

    // Exactly 5 connectionLog rows, all kind: 'blast'.
    const logs = await waitFor(async () => {
      const rows = await listConnectionLog()
      expect(rows).toHaveLength(5)
      return rows
    })
    expect(logs.every((row) => row.kind === 'blast')).toBe(true)
    const loggedPersonIds = logs.map((row) => row.personId).sort((a, b) => a - b)
    expect(loggedPersonIds).toEqual([alice, bob, cara, dana, eli].sort((a, b) => a - b))
  })
})

describe('BlastView — dedup across individual + circle overlap', () => {
  it('a person selected individually AND in a selected circle gets exactly one launch, not two', async () => {
    const user = userEvent.setup()
    const navigateSpy = vi.spyOn(smsNavigation, 'navigate').mockImplementation(() => {})

    const overlap = await createPerson({ name: 'Overlap Person', phone: '+15551110000', metDateIsExplicit: false })
    const other = await createPerson({ name: 'Other Person', phone: '+15551110001', metDateIsExplicit: false })

    const circleId = await createCircle({ name: 'Overlap Circle' })
    await addCircleMember({ personId: overlap, circleId })
    await addCircleMember({ personId: other, circleId })

    render(<BlastView />)

    await user.type(screen.getByLabelText('Message'), 'Hi there')

    // Select Overlap Person individually AND select the circle they're in.
    await user.click(screen.getByRole('checkbox', { name: 'Overlap Person' }))
    await user.click(screen.getByRole('button', { name: 'Overlap Circle' }))

    // Distinct count is 2 (Overlap Person, Other Person), not 3.
    expect(screen.getByText(/2 people selected/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /send private blast to 2/i }))

    await waitFor(() => expect(navigateSpy).toHaveBeenCalledTimes(2))

    const urls = navigateSpy.mock.calls.map(([url]) => url)
    const overlapLaunches = urls.filter((url) => url.startsWith('sms:+15551110000'))
    expect(overlapLaunches).toHaveLength(1)

    const logs = await waitFor(async () => {
      const rows = await listConnectionLog()
      expect(rows).toHaveLength(2)
      return rows
    })
    const overlapLogs = logs.filter((row) => row.personId === overlap)
    expect(overlapLogs).toHaveLength(1)
  })
})

describe('BlastView — skips people with no phone number, never silently', () => {
  it('skips a person with no phone, mentions them in a visible summary, and still messages people who do have a phone', async () => {
    const user = userEvent.setup()
    const navigateSpy = vi.spyOn(smsNavigation, 'navigate').mockImplementation(() => {})

    const hasPhone = await createPerson({ name: 'Has Phone', phone: '+15552220000', metDateIsExplicit: false })
    const noPhone = await createPerson({ name: 'No Phone Person', metDateIsExplicit: false })

    render(<BlastView />)

    await user.type(screen.getByLabelText('Message'), 'Hello!')
    await user.click(screen.getByRole('checkbox', { name: 'Has Phone' }))
    await user.click(screen.getByRole('checkbox', { name: 'No Phone Person' }))

    expect(screen.getByText(/2 people selected/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /send private blast to 2/i }))

    // Only one navigation attempt — the person with no phone is never
    // sent to buildSmsUrl/navigate at all.
    await waitFor(() => expect(navigateSpy).toHaveBeenCalledTimes(1))
    expect(navigateSpy.mock.calls[0][0].startsWith('sms:+15552220000')).toBe(true)

    // Visible, plain-language summary mentions the skip — never silent.
    // ("No Phone Person" also appears in the checkbox list above, so
    // scope this assertion to the skip-summary element specifically.)
    const skippedSummary = await screen.findByText(/skipped/i)
    expect(skippedSummary.textContent).toContain('No Phone Person')

    // The person with a phone still gets logged.
    const logs = await waitFor(async () => {
      const rows = await listConnectionLog()
      expect(rows).toHaveLength(1)
      return rows
    })
    expect(logs[0].personId).toBe(hasPhone)
    expect(logs[0].kind).toBe('blast')

    // Nothing logged for the skipped person.
    expect(logs.some((row) => row.personId === noPhone)).toBe(false)
  })
})

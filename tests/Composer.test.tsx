// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import Composer, { buildSmsUrl, smsNavigation } from '../src/components/Composer'
import { db } from '../src/data/db'
import { listConnectionLogByPerson } from '../src/data/connectionLog.repo'

// ---------------------------------------------------------------------
// WI-09 acceptance tests, run against real Dexie/IndexedDB
// (fake-indexeddb, installed globally by tests/setup.ts), exactly like
// tests/PersonView.test.tsx and tests/memories.test.tsx do.
//
// The core property under test throughout: ONE recipient, never a
// comma-joined or array-of-recipients URL.
// ---------------------------------------------------------------------

beforeEach(async () => {
  await db.connectionLog.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('buildSmsUrl — pure sms: URL builder', () => {
  it('addresses exactly one recipient with no comma anywhere in the URL', () => {
    const url = buildSmsUrl('+15551234567')
    expect(url).toBe('sms:+15551234567')
    expect(url).not.toContain(',')
  })

  it('percent-encodes a body and never introduces a comma', () => {
    const url = buildSmsUrl('+15551234567', 'Hey, how are you?')
    expect(url).toBe('sms:+15551234567?body=Hey%2C%20how%20are%20you%3F')
    // The comma in the message text is percent-encoded (%2C), so the raw
    // URL string itself contains no literal comma — the one hallmark of
    // a multi-recipient sms: URL.
    expect(url).not.toContain(',')
    expect(url).toContain('%2C')
  })

  it('percent-encodes UTF-8 body text correctly', () => {
    const url = buildSmsUrl('+15551234567', 'Thinking of you 💛')
    expect(url).toBe(`sms:+15551234567?body=${encodeURIComponent('Thinking of you 💛')}`)
  })

  it('omits the body param entirely when no body is given', () => {
    expect(buildSmsUrl('+15551234567')).toBe('sms:+15551234567')
    expect(buildSmsUrl('+15551234567', '')).toBe('sms:+15551234567')
  })
})

describe('Composer — single-recipient message launcher', () => {
  it('tapping Message with a valid phone navigates to an sms: URL for exactly that one person', async () => {
    const user = userEvent.setup()
    const navigateSpy = vi.spyOn(smsNavigation, 'navigate').mockImplementation(() => {})

    render(<Composer person={{ id: 1, name: 'Jamie Chen', phone: '+15551234567' }} />)

    await user.click(screen.getByRole('button', { name: /message jamie chen/i }))

    expect(navigateSpy).toHaveBeenCalledTimes(1)
    const [url] = navigateSpy.mock.calls[0]
    expect(url.startsWith('sms:+15551234567')).toBe(true)
    expect(url).not.toContain(',')
  })

  it('a person with no phone shows a plain-language guard message and never attempts navigation', async () => {
    const navigateSpy = vi.spyOn(smsNavigation, 'navigate').mockImplementation(() => {})

    render(<Composer person={{ id: 2, name: 'Alex Rivera' }} />)

    expect(screen.getByText('Add a phone number to message Alex Rivera')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('a person with an empty/whitespace phone also shows the guard, not a crash or silent no-op', () => {
    render(<Composer person={{ id: 3, name: 'Sam Lee', phone: '   ' }} />)

    expect(screen.getByText('Add a phone number to message Sam Lee')).toBeInTheDocument()
  })

  it('a successful launch writes a connectionLog row with kind="message" for that person', async () => {
    const user = userEvent.setup()
    vi.spyOn(smsNavigation, 'navigate').mockImplementation(() => {})

    const personId = 42
    render(<Composer person={{ id: personId, name: 'Jamie Chen', phone: '+15551234567' }} />)

    await user.click(screen.getByRole('button', { name: /message jamie chen/i }))

    const rows = await vi.waitFor(async () => {
      const logs = await listConnectionLogByPerson(personId)
      expect(logs).toHaveLength(1)
      return logs
    })

    expect(rows[0].kind).toBe('message')
    expect(rows[0].personId).toBe(personId)
  })

  it('does not write a connectionLog row when there is no phone to message', async () => {
    render(<Composer person={{ id: 99, name: 'No Phone Person' }} />)

    const rows = await listConnectionLogByPerson(99)
    expect(rows).toHaveLength(0)
  })
})

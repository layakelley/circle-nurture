// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import AddPersonView from '../src/views/AddPersonView'
import { db } from '../src/data/db'
import { listPeople } from '../src/data/people.repo'

// ---------------------------------------------------------------------
// WI-04 acceptance tests, run against real Dexie/IndexedDB (fake-indexeddb,
// installed globally by tests/setup.ts) exactly like the repo tests do —
// this file just adds the React render layer on top via jsdom.
// ---------------------------------------------------------------------

function todayParts() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }
}

beforeAll(async () => {
  await db.people.clear()
})

beforeEach(async () => {
  await db.people.clear()
})

afterEach(() => {
  cleanup()
})

describe('AddPersonView — capture-first add', () => {
  it('saves a person from a name-only submission in <=3 interactions and calls onDone', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<AddPersonView onDone={onDone} />)

    // Interaction 1+2: click the name field, type a name.
    const nameInput = screen.getByLabelText('Name')
    await user.click(nameInput)
    await user.type(nameInput, 'Jamie Chen')

    // Interaction 3: tap Save.
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    const newId = onDone.mock.calls[0][0]
    expect(typeof newId).toBe('number')

    const people = await listPeople()
    const saved = people.find((p) => p.id === newId)
    expect(saved).toBeDefined()
    expect(saved?.name).toBe('Jamie Chen')
  })

  it('defaults whenMet to today with metDateIsExplicit false when untouched', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<AddPersonView onDone={onDone} />)

    await user.type(screen.getByLabelText('Name'), 'Default Date Person')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    const newId = onDone.mock.calls[0][0]
    const saved = (await listPeople()).find((p) => p.id === newId)

    expect(saved?.whenMet).toBeInstanceOf(Date)
    const parts = todayParts()
    expect(saved!.whenMet!.getFullYear()).toBe(parts.year)
    expect(saved!.whenMet!.getMonth()).toBe(parts.month)
    expect(saved!.whenMet!.getDate()).toBe(parts.day)
    expect(saved?.metDateIsExplicit).toBe(false)
  })

  it('persists an explicitly changed whenMet with metDateIsExplicit true', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<AddPersonView onDone={onDone} />)

    await user.type(screen.getByLabelText('Name'), 'Changed Date Person')

    // fireEvent.change (not user.type) because jsdom's type="date" input
    // validates the full ISO string on every keystroke, which rejects
    // the partial intermediate values character-by-character typing
    // would send.
    const dateInput = screen.getByLabelText('Date we met') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2020-05-17' } })
    expect(dateInput.value).toBe('2020-05-17')

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    const newId = onDone.mock.calls[0][0]
    const saved = (await listPeople()).find((p) => p.id === newId)

    expect(saved?.whenMet?.getFullYear()).toBe(2020)
    expect(saved?.whenMet?.getMonth()).toBe(4) // 0-indexed: May
    expect(saved?.whenMet?.getDate()).toBe(17)
    expect(saved?.metDateIsExplicit).toBe(true)
  })

  it('persists a cleared whenMet as null with metDateIsExplicit false', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<AddPersonView onDone={onDone} />)

    await user.type(screen.getByLabelText('Name'), 'Cleared Date Person')
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    const newId = onDone.mock.calls[0][0]
    const saved = (await listPeople()).find((p) => p.id === newId)

    expect(saved?.whenMet).toBeNull()
    expect(saved?.metDateIsExplicit).toBe(false)
  })

  it('persists an explicitly-marked-unknown whenMet as null with metDateIsExplicit false', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<AddPersonView onDone={onDone} />)

    await user.type(screen.getByLabelText('Name'), 'Unknown Date Person')
    await user.click(screen.getByRole('button', { name: "I don't know" }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    const newId = onDone.mock.calls[0][0]
    const saved = (await listPeople()).find((p) => p.id === newId)

    expect(saved?.whenMet).toBeNull()
    expect(saved?.metDateIsExplicit).toBe(false)
  })

  it('never requires optional fields — leaving them all blank still saves', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<AddPersonView onDone={onDone} />)

    // Optional fields live inside a <details> disclosure that starts
    // collapsed (no `open` attribute) and is never opened in this test —
    // proving they aren't required for a successful save.
    const details = document.querySelector('details')
    expect(details).not.toBeNull()
    expect(details).not.toHaveAttribute('open')

    await user.type(screen.getByLabelText('Name'), 'Only A Name')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    const newId = onDone.mock.calls[0][0]
    const saved = (await listPeople()).find((p) => p.id === newId)

    expect(saved?.name).toBe('Only A Name')
    expect(saved?.phone).toBeUndefined()
    expect(saved?.email).toBeUndefined()
    expect(saved?.howMet).toBeUndefined()
    expect(saved?.whereMet).toBeUndefined()
    expect(saved?.whatConnectedUs).toBeUndefined()
    expect(saved?.organization).toBeUndefined()
    expect(saved?.remember).toBeUndefined()
  })

  it('does not save when name is blank, and shows no blocking validation on optional fields', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<AddPersonView onDone={onDone} />)

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onDone).not.toHaveBeenCalled()
    expect(await listPeople()).toHaveLength(0)
    expect(screen.getByRole('alert')).toHaveTextContent(/name/i)
  })
})

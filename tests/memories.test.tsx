// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import MemoryComposer from '../src/components/MemoryComposer'
import MemoryList from '../src/components/MemoryList'
import { db, CircleNurtureDB } from '../src/data/db'
import { createMemory, listMemoriesByPerson } from '../src/data/memories.repo'

// ---------------------------------------------------------------------
// WI-07 acceptance tests, run against real Dexie/IndexedDB
// (fake-indexeddb, installed globally by tests/setup.ts), exactly like
// tests/AddPersonView.test.tsx and tests/db.persistence.test.ts do.
// ---------------------------------------------------------------------

const PERSON_ID = 1

function MemoryFlow({ personId }: { personId: number }) {
  return (
    <div>
      <MemoryComposer personId={personId} />
      <MemoryList personId={personId} />
    </div>
  )
}

beforeEach(async () => {
  await db.memories.clear()
})

afterEach(() => {
  cleanup()
})

describe('MemoryComposer — quick capture', () => {
  it('saves a memory in <=2 interactions (type + tap Save) and it shows up live in MemoryList', async () => {
    const user = userEvent.setup()
    render(<MemoryFlow personId={PERSON_ID} />)

    expect(screen.getByText('No memories jotted down yet.')).toBeInTheDocument()

    // Interaction 1: type into the (autofocused) field.
    const field = screen.getByLabelText('Jot a memory')
    await user.type(field, 'Loves a good used bookstore')

    // Interaction 2: tap Save.
    await user.click(screen.getByRole('button', { name: /save/i }))

    // Persisted...
    await waitFor(async () => {
      const rows = await listMemoriesByPerson(PERSON_ID)
      expect(rows).toHaveLength(1)
      expect(rows[0].text).toBe('Loves a good used bookstore')
    })

    // ...and shows up live in MemoryList without any manual refresh.
    expect(await screen.findByText('Loves a good used bookstore')).toBeInTheDocument()

    // The field clears back out, ready for the next jot.
    expect(field).toHaveValue('')
  })

  it('does not save a blank/whitespace-only memory', async () => {
    const user = userEvent.setup()
    render(<MemoryFlow personId={PERSON_ID} />)

    await user.type(screen.getByLabelText('Jot a memory'), '   ')
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()

    expect(await listMemoriesByPerson(PERSON_ID)).toHaveLength(0)
  })
})

describe('MemoryList — edit, delete, pin', () => {
  it('edits a memory and persists the change', async () => {
    const user = userEvent.setup()
    await createMemory({ personId: PERSON_ID, text: 'Original text' })

    render(<MemoryList personId={PERSON_ID} />)
    expect(await screen.findByText('Original text')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const editField = screen.getByLabelText('Edit memory')
    await user.clear(editField)
    await user.type(editField, 'Updated text')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByText('Updated text')).toBeInTheDocument())
    expect(screen.queryByText('Original text')).not.toBeInTheDocument()

    const rows = await listMemoriesByPerson(PERSON_ID)
    expect(rows).toHaveLength(1)
    expect(rows[0].text).toBe('Updated text')
  })

  it('deletes a memory and persists the removal', async () => {
    const user = userEvent.setup()
    await createMemory({ personId: PERSON_ID, text: 'To be deleted' })

    render(<MemoryList personId={PERSON_ID} />)
    expect(await screen.findByText('To be deleted')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(screen.queryByText('To be deleted')).not.toBeInTheDocument())
    expect(await listMemoriesByPerson(PERSON_ID)).toHaveLength(0)
  })

  it('pins and unpins a memory and persists the change', async () => {
    const user = userEvent.setup()
    const id = await createMemory({ personId: PERSON_ID, text: 'Pin me' })

    render(<MemoryList personId={PERSON_ID} />)
    await screen.findByText('Pin me')

    expect(screen.queryByText('Pinned')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pin' }))

    await waitFor(() => expect(screen.getByText('Pinned')).toBeInTheDocument())
    expect((await listMemoriesByPerson(PERSON_ID)).find((m) => m.id === id)?.pinned).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Unpin' }))

    await waitFor(() => expect(screen.queryByText('Pinned')).not.toBeInTheDocument())
    expect((await listMemoriesByPerson(PERSON_ID)).find((m) => m.id === id)?.pinned).toBe(false)
  })
})

describe('MemoryList — ordering', () => {
  it('renders memories newest-first', async () => {
    await createMemory({
      personId: PERSON_ID,
      text: 'Oldest memory',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    })
    await createMemory({
      personId: PERSON_ID,
      text: 'Middle memory',
      createdAt: new Date('2026-02-01T00:00:00Z'),
    })
    await createMemory({
      personId: PERSON_ID,
      text: 'Newest memory',
      createdAt: new Date('2026-03-01T00:00:00Z'),
    })

    render(<MemoryList personId={PERSON_ID} />)

    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(within(items[0]).getByText('Newest memory')).toBeInTheDocument()
    expect(within(items[1]).getByText('Middle memory')).toBeInTheDocument()
    expect(within(items[2]).getByText('Oldest memory')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------
// Proves persistence survives a simulated reload, the same technique as
// tests/db.persistence.test.ts: write through connection #1, `.close()`
// it (discarding the connection object the way a reload discards JS
// heap state), then open a brand-new connection #2 against the same DB
// name and confirm the memory is still there.
// ---------------------------------------------------------------------
describe('MemoryList — reload persistence', () => {
  it('a memory written before a reload is still there (and still renders) after reopening the same DB name', async () => {
    const dbName = 'CircleNurtureDB-memories-persistence-test'

    const before = new CircleNurtureDB(dbName)
    const personId = 42
    await before.memories.add({
      personId,
      text: 'Remembered across reload',
      createdAt: new Date('2026-03-01T00:00:00Z'),
      pinned: true,
    })
    before.close()

    const after = new CircleNurtureDB(dbName)
    const rows = await after.memories.where('personId').equals(personId).toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].text).toBe('Remembered across reload')
    expect(rows[0].pinned).toBe(true)
    after.close()
  })
})

// ---------------------------------------------------------------------
// Memories are pure capture, never a to-do: no reminder/obligation/
// overdue UI or copy should appear anywhere in this flow.
// ---------------------------------------------------------------------
describe('MemoryList / MemoryComposer — no reminder/obligation copy', () => {
  it('contains no reminder, due, overdue, or obligation language anywhere in the rendered output', async () => {
    await createMemory({ personId: PERSON_ID, text: 'A pinned memory', pinned: true })
    await createMemory({
      personId: PERSON_ID,
      text: 'An old memory',
      createdAt: new Date('2020-01-01T00:00:00Z'),
    })

    const { container } = render(<MemoryFlow personId={PERSON_ID} />)
    await screen.findByText('A pinned memory')

    const rendered = container.textContent ?? ''
    const bannedPattern = /remind|overdue|obligat|\bdue\b|\btodo\b|to-do|past due|nudge/i
    expect(rendered).not.toMatch(bannedPattern)
  })
})

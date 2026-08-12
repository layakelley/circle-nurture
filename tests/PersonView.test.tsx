// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import PersonView from '../src/views/PersonView'
import { db } from '../src/data/db'
import { createPerson, getPerson } from '../src/data/people.repo'
import { createCircle } from '../src/data/circles.repo'
import { addCircleMember } from '../src/data/circleMembers.repo'
import { createMemory } from '../src/data/memories.repo'

// ---------------------------------------------------------------------
// WI-08 acceptance tests, run against real Dexie/IndexedDB
// (fake-indexeddb, installed globally by tests/setup.ts), exactly like
// tests/AddPersonView.test.tsx and tests/memories.test.tsx do.
// ---------------------------------------------------------------------

beforeEach(async () => {
  await Promise.all([
    db.people.clear(),
    db.circles.clear(),
    db.circleMembers.clear(),
    db.memories.clear(),
    db.connectionLog.clear(),
  ])
})

afterEach(() => {
  cleanup()
})

describe('PersonView — profile renders context, circles, memories, actions', () => {
  it('renders Our Connection context, circle chips, memories, and the actions area for a person with real data', async () => {
    const personId = await createPerson({
      name: 'Jamie Chen',
      howMet: 'Met at a conference',
      whenMet: new Date(2026, 7, 15), // August 2026
      whereMet: 'Tech conference downtown',
      whatConnectedUs: 'Both love houseplants',
      organization: 'Acme Co',
      remember: 'Has a cat named Biscuit',
      metDateIsExplicit: true,
    })
    const circleId = await createCircle({ name: 'College Friends' })
    await addCircleMember({ personId, circleId })
    await createMemory({ personId, text: 'Told a great story about hiking' })

    render(<PersonView personId={personId} />)

    // Name.
    expect(await screen.findByRole('heading', { name: 'Jamie Chen' })).toBeInTheDocument()

    // Our Connection section — a distinct labeled region with the full context.
    const ourConnection = screen.getByRole('region', { name: 'Our Connection' })
    expect(ourConnection.textContent).toMatch(/Met August 2026/)
    expect(ourConnection.textContent).toContain('Met at a conference')
    expect(ourConnection.textContent).toContain('Tech conference downtown')
    expect(ourConnection.textContent).toContain('Both love houseplants')
    expect(ourConnection.textContent).toContain('Acme Co')
    expect(ourConnection.textContent).toContain('Has a cat named Biscuit')

    // Circles, rendered as chips.
    expect(screen.getByText('College Friends')).toBeInTheDocument()

    // Memories — a distinct labeled region containing the jotted memory.
    const memories = screen.getByRole('region', { name: 'Memories' })
    await waitFor(() => expect(memories.textContent).toContain('Told a great story about hiking'))

    // Actions area.
    const actions = screen.getByRole('group', { name: 'Actions' })
    expect(within(actions).getByRole('button', { name: 'Add memory' })).toBeInTheDocument()
  })
})

describe('PersonView — inline editing of Our Connection', () => {
  it('edits the "remember" field and persists it via the people repo, re-rendering with the new value', async () => {
    const user = userEvent.setup()
    const personId = await createPerson({
      name: 'Alex Rivera',
      remember: 'Original detail',
      whenMet: null,
      metDateIsExplicit: false,
    })

    render(<PersonView personId={personId} />)

    await screen.findByRole('heading', { name: 'Alex Rivera' })
    const ourConnection = screen.getByRole('region', { name: 'Our Connection' })
    expect(ourConnection.textContent).toContain('Original detail')

    await user.click(within(ourConnection).getByRole('button', { name: 'Edit' }))

    const rememberField = screen.getByLabelText('Something to remember')
    await user.clear(rememberField)
    await user.type(rememberField, 'Updated detail')

    await user.click(within(ourConnection).getByRole('button', { name: 'Save' }))

    // Re-renders with the new value. The live-query subscription and the
    // edit-mode state update both settle asynchronously (independently of
    // each other), so check both conditions together inside one waitFor
    // rather than as two separate assertions — that avoids a benign
    // intermediate-render flicker (the DB write landing a tick before the
    // live query's own re-render lands) from being mistaken for a bug.
    await waitFor(() => {
      expect(ourConnection.textContent).toContain('Updated detail')
      expect(ourConnection.textContent).not.toContain('Original detail')
    })

    // ...and it's actually persisted via people.repo.updatePerson, not just local state.
    const saved = await getPerson(personId)
    expect(saved?.remember).toBe('Updated detail')
  })
})

describe('PersonView — unknown met-date', () => {
  it('renders no date and throws no error when whenMet is null and metDateIsExplicit is false', async () => {
    const personId = await createPerson({
      name: 'Unknown Date Person',
      whenMet: null,
      metDateIsExplicit: false,
    })

    render(<PersonView personId={personId} />)

    await screen.findByRole('heading', { name: 'Unknown Date Person' })
    const ourConnection = screen.getByRole('region', { name: 'Our Connection' })

    expect(ourConnection.textContent).not.toMatch(/Met \w+ \d{4}/)
    expect(screen.queryByText(/^Met /)).not.toBeInTheDocument()
  })
})

describe('PersonView — Our Connection vs Memories are distinct sections', () => {
  it('keeps context and memories in separate, non-interleaved, distinctly-labeled sections', async () => {
    const personId = await createPerson({
      name: 'Sam Rivera',
      remember: 'Loves used bookstores',
      whenMet: null,
      metDateIsExplicit: false,
    })
    await createMemory({ personId, text: 'Spent an afternoon at the farmers market' })

    render(<PersonView personId={personId} />)

    await screen.findByRole('heading', { name: 'Sam Rivera' })

    const ourConnection = screen.getByRole('region', { name: 'Our Connection' })
    const memories = screen.getByRole('region', { name: 'Memories' })

    // Two distinct DOM nodes, neither nested inside the other.
    expect(ourConnection).not.toBe(memories)
    expect(ourConnection.contains(memories)).toBe(false)
    expect(memories.contains(ourConnection)).toBe(false)

    // Content doesn't cross over between the two sections.
    expect(ourConnection.textContent).toContain('Loves used bookstores')
    expect(ourConnection.textContent).not.toContain('Spent an afternoon at the farmers market')

    await waitFor(() =>
      expect(memories.textContent).toContain('Spent an afternoon at the farmers market'),
    )
    expect(memories.textContent).not.toContain('Loves used bookstores')
  })
})

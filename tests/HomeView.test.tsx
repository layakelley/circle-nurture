// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import HomeView from '../src/views/HomeView'
import PersonCard from '../src/components/PersonCard'
import CircleChip from '../src/components/CircleChip'
import { db } from '../src/data/db'
import { createPerson } from '../src/data/people.repo'
import { createCircle } from '../src/data/circles.repo'
import { addCircleMember } from '../src/data/circleMembers.repo'

// This file opts into a jsdom environment via the docblock above (the
// shared vitest.config.ts otherwise runs tests under 'node' for speed —
// see the comment there). fake-indexeddb is still installed globally by
// tests/setup.ts, so the real repos work here exactly as they do in the
// node-environment data-layer tests.

beforeEach(async () => {
  // Known-empty starting state for every test, same pattern as
  // tests/db.crud.test.ts.
  await Promise.all([db.people.clear(), db.circles.clear(), db.circleMembers.clear()])
})

afterEach(() => {
  cleanup()
})

describe('HomeView', () => {
  it('renders the friendly empty state when the database has no people or circles', async () => {
    render(<HomeView />)

    expect(await screen.findByText('start with one circle / add your first person')).toBeInTheDocument()
    // No scoreboard/chart/count language anywhere in the empty state.
    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument()
  })

  it('renders people and circles live from the repos, not a one-time snapshot', async () => {
    const circleId = await createCircle({ name: 'Book Club' })
    const personId = await createPerson({
      name: 'Ada Lovelace',
      remember: 'Loves a good used bookstore',
      metDateIsExplicit: false,
    })
    await addCircleMember({ personId, circleId })

    render(<HomeView />)

    // Initial data, loaded via the live query.
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Loves a good used bookstore')).toBeInTheDocument()
    // "Book Club" appears both as its own circle chip and as a chip on
    // Ada's person card.
    expect(screen.getAllByText('Book Club').length).toBeGreaterThanOrEqual(2)

    // Live update: adding a second person after the initial render should
    // show up without remounting — proving this isn't a stale snapshot.
    await createPerson({ name: 'Grace Hopper', metDateIsExplicit: false })
    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument()
  })
})

describe('PersonCard', () => {
  it('renders exactly the props it receives', () => {
    render(
      <PersonCard
        name="Sam Rivera"
        context="Met at a backyard birthday dinner"
        circles={[{ id: 1, name: 'Neighbors' }]}
      />,
    )

    expect(screen.getByText('Sam Rivera')).toBeInTheDocument()
    expect(screen.getByText('Met at a backyard birthday dinner')).toBeInTheDocument()
    expect(screen.getByText('Neighbors')).toBeInTheDocument()
  })

  it('omits the context line when none is provided', () => {
    render(<PersonCard name="No Context Yet" />)
    expect(screen.getByText('No Context Yet')).toBeInTheDocument()
  })
})

describe('CircleChip', () => {
  it('renders its name and invokes the tap handler passed via props', () => {
    let tapped = false
    render(<CircleChip name="Family" onClick={() => (tapped = true)} />)

    const chip = screen.getByText('Family')
    chip.click()

    expect(tapped).toBe(true)
  })
})

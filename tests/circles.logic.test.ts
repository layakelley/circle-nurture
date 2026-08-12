import { beforeAll, describe, expect, it } from 'vitest'
import { db } from '../src/data/db'
import { createPerson } from '../src/data/people.repo'
import { createCircle, getCircle, listCircles, updateCircle } from '../src/data/circles.repo'
import { listCircleMembers, listCirclesForPerson, listMembersForCircle } from '../src/data/circleMembers.repo'
import { addPersonToCircle, bulkAddPeopleToCircle, deleteCircleCascade } from '../src/views/circles.logic'

// WI-05 — Circles. Exercises the composed logic in src/views/circles.logic.ts
// (which CircleView.tsx's UI calls into) against the real repo layer, backed
// by fake-indexeddb (see tests/setup.ts). No DOM rendering needed — this
// proves the data behavior the binary acceptance criteria care about.
describe('circles logic', () => {
  beforeAll(async () => {
    await Promise.all([db.people.clear(), db.circles.clear(), db.circleMembers.clear()])
  })

  it('circle CRUD: create, rename, delete', async () => {
    const id = await createCircle({ name: 'Book Club' })
    expect(await getCircle(id)).toMatchObject({ name: 'Book Club' })
    expect((await listCircles()).some((c) => c.id === id)).toBe(true)

    await updateCircle(id, { name: 'Sunday Book Club' })
    expect((await getCircle(id))?.name).toBe('Sunday Book Club')

    await deleteCircleCascade(id)
    expect(await getCircle(id)).toBeUndefined()
  })

  it('a person can belong to two or more circles at once', async () => {
    const personId = await createPerson({ name: 'Multi Circle Person', metDateIsExplicit: false })
    const circleAId = await createCircle({ name: 'Circle A' })
    const circleBId = await createCircle({ name: 'Circle B' })
    const circleCId = await createCircle({ name: 'Circle C' })

    await addPersonToCircle(personId, circleAId)
    await addPersonToCircle(personId, circleBId)
    await addPersonToCircle(personId, circleCId)

    const memberships = await listCirclesForPerson(personId)
    expect(memberships.map((m) => m.circleId).sort()).toEqual([circleAId, circleBId, circleCId].sort())

    // Re-adding to a circle the person is already in must not create a
    // duplicate membership row.
    await addPersonToCircle(personId, circleAId)
    expect((await listCirclesForPerson(personId)).length).toBe(3)
  })

  it('bulk-assigns five or more people to a circle in one action', async () => {
    const circleId = await createCircle({ name: 'Big Gathering' })
    const personIds = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        createPerson({ name: `Bulk Person ${i}`, metDateIsExplicit: false }),
      ),
    )

    await bulkAddPeopleToCircle(personIds, circleId)

    const members = await listMembersForCircle(circleId)
    expect(members.length).toBe(personIds.length)
    expect(members.map((m) => m.personId).sort()).toEqual([...personIds].sort())
  })

  it('deleting a circle cleanly removes its memberships (no orphaned circleMembers rows)', async () => {
    const circleId = await createCircle({ name: 'Temporary Circle' })
    const personIds = await Promise.all(
      Array.from({ length: 3 }, (_, i) =>
        createPerson({ name: `Orphan Check Person ${i}`, metDateIsExplicit: false }),
      ),
    )
    await bulkAddPeopleToCircle(personIds, circleId)
    expect((await listMembersForCircle(circleId)).length).toBe(3)

    await deleteCircleCascade(circleId)

    expect(await getCircle(circleId)).toBeUndefined()
    expect(await listMembersForCircle(circleId)).toEqual([])

    // No leftover rows anywhere in circleMembers referencing the deleted circle.
    const allMemberships = await listCircleMembers()
    expect(allMemberships.some((m) => m.circleId === circleId)).toBe(false)
  })
})

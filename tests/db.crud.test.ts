import { beforeAll, describe, expect, it } from 'vitest'
import { db } from '../src/data/db'
import { createPerson, deletePerson, getPerson, listPeople, updatePerson } from '../src/data/people.repo'
import { createCircle, deleteCircle, getCircle, listCircles, updateCircle } from '../src/data/circles.repo'
import {
  addCircleMember,
  getCircleMember,
  listCirclesForPerson,
  listMembersForCircle,
  removeCircleMember,
  removeMembership,
  updateCircleMember,
} from '../src/data/circleMembers.repo'
import {
  createMemory,
  deleteMemory,
  getMemory,
  listMemoriesByPerson,
  updateMemory,
} from '../src/data/memories.repo'
import {
  createNextConnect,
  deleteNextConnect,
  getNextConnect,
  listNextConnectsByPerson,
  updateNextConnect,
} from '../src/data/nextConnects.repo'
import {
  createConnectionLog,
  deleteConnectionLog,
  getConnectionLog,
  getLastConnectedAt,
  listConnectionLogByPerson,
  updateConnectionLog,
} from '../src/data/connectionLog.repo'

// Every table gets a create -> read -> update -> delete round trip through
// its repo module (never through Dexie directly), against the shared `db`
// singleton from src/data/db.ts.
describe('CRUD round trips (via repos)', () => {
  beforeAll(async () => {
    // Known-empty starting state, regardless of whether the dev seed ran.
    await Promise.all([
      db.people.clear(),
      db.circles.clear(),
      db.circleMembers.clear(),
      db.memories.clear(),
      db.nextConnects.clear(),
      db.connectionLog.clear(),
    ])
  })

  it('people: create, read, update, delete', async () => {
    const id = await createPerson({ name: 'Ada Lovelace', metDateIsExplicit: false })
    expect(id).toBeTypeOf('number')

    const created = await getPerson(id)
    expect(created?.name).toBe('Ada Lovelace')
    expect(created?.createdAt).toBeInstanceOf(Date)

    const listed = await listPeople()
    expect(listed.some((p) => p.id === id)).toBe(true)

    await updatePerson(id, { name: 'Ada, Countess of Lovelace', organization: 'Analytical Engine Society' })
    const updated = await getPerson(id)
    expect(updated?.name).toBe('Ada, Countess of Lovelace')
    expect(updated?.organization).toBe('Analytical Engine Society')
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created!.updatedAt.getTime())

    await deletePerson(id)
    expect(await getPerson(id)).toBeUndefined()
  })

  it('circles: create, read, update, delete', async () => {
    const id = await createCircle({ name: 'Book Club' })
    expect(await getCircle(id)).toMatchObject({ name: 'Book Club' })

    const listed = await listCircles()
    expect(listed.some((c) => c.id === id)).toBe(true)

    await updateCircle(id, { name: 'Sunday Book Club' })
    expect((await getCircle(id))?.name).toBe('Sunday Book Club')

    await deleteCircle(id)
    expect(await getCircle(id)).toBeUndefined()
  })

  it('circleMembers: create, read, update, delete + person/circle lookups', async () => {
    const personId = await createPerson({ name: 'Member Test Person', metDateIsExplicit: false })
    const circleId = await createCircle({ name: 'Membership Test Circle' })

    const membershipId = await addCircleMember({ personId, circleId })
    expect(await getCircleMember(membershipId)).toMatchObject({ personId, circleId })

    expect((await listMembersForCircle(circleId)).map((m) => m.id)).toContain(membershipId)
    expect((await listCirclesForPerson(personId)).map((m) => m.id)).toContain(membershipId)

    const otherCircleId = await createCircle({ name: 'Second Circle' })
    await updateCircleMember(membershipId, { circleId: otherCircleId })
    expect((await getCircleMember(membershipId))?.circleId).toBe(otherCircleId)

    await removeCircleMember(membershipId)
    expect(await getCircleMember(membershipId)).toBeUndefined()

    // removeMembership() convenience path
    const secondMembershipId = await addCircleMember({ personId, circleId: otherCircleId })
    await removeMembership(personId, otherCircleId)
    expect(await getCircleMember(secondMembershipId)).toBeUndefined()
  })

  it('memories: create, read, update, delete + list by person, newest first', async () => {
    const personId = await createPerson({ name: 'Memory Test Person', metDateIsExplicit: false })

    const firstId = await createMemory({ personId, text: 'First memory' })
    await new Promise((resolve) => setTimeout(resolve, 2))
    const secondId = await createMemory({ personId, text: 'Second memory' })

    const created = await getMemory(secondId)
    expect(created?.text).toBe('Second memory')
    expect(created?.pinned).toBe(false)

    const byPerson = await listMemoriesByPerson(personId)
    expect(byPerson.map((m) => m.id)).toEqual([secondId, firstId])

    await updateMemory(firstId, { pinned: true, text: 'First memory, edited' })
    expect(await getMemory(firstId)).toMatchObject({ pinned: true, text: 'First memory, edited' })

    await deleteMemory(secondId)
    expect(await getMemory(secondId)).toBeUndefined()
  })

  it('nextConnects: create, read, update, delete + list by person', async () => {
    const personId = await createPerson({ name: 'NextConnect Test Person', metDateIsExplicit: false })

    const id = await createNextConnect({ personId, type: 'coffee' })
    const created = await getNextConnect(id)
    expect(created?.status).toBe('planned')
    expect(created?.type).toBe('coffee')

    const byPerson = await listNextConnectsByPerson(personId)
    expect(byPerson.map((n) => n.id)).toContain(id)

    await updateNextConnect(id, { status: 'done' })
    expect((await getNextConnect(id))?.status).toBe('done')

    await deleteNextConnect(id)
    expect(await getNextConnect(id)).toBeUndefined()
  })

  it('connectionLog: create, read, update, delete + list by person + last connected', async () => {
    const personId = await createPerson({ name: 'Log Test Person', metDateIsExplicit: false })

    const earlier = new Date('2026-01-01T00:00:00Z')
    const later = new Date('2026-02-01T00:00:00Z')
    const earlierId = await createConnectionLog({ personId, kind: 'call', at: earlier })
    const laterId = await createConnectionLog({ personId, kind: 'blast', at: later })

    expect((await getConnectionLog(laterId))?.kind).toBe('blast')

    const byPerson = await listConnectionLogByPerson(personId)
    expect(byPerson.map((l) => l.id)).toEqual([laterId, earlierId])

    expect((await getLastConnectedAt(personId))?.getTime()).toBe(later.getTime())

    await updateConnectionLog(earlierId, { note: 'caught up briefly' })
    expect((await getConnectionLog(earlierId))?.note).toBe('caught up briefly')

    await deleteConnectionLog(laterId)
    expect(await getConnectionLog(laterId)).toBeUndefined()
  })
})

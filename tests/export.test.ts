import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/data/db'
import { exportAllData, importData } from '../src/utils/export'
import { createPerson } from '../src/data/people.repo'
import { createCircle } from '../src/data/circles.repo'
import { addCircleMember } from '../src/data/circleMembers.repo'
import { createMemory } from '../src/data/memories.repo'
import { createNextConnect } from '../src/data/nextConnects.repo'
import { createConnectionLog } from '../src/data/connectionLog.repo'

const ALL_TABLE_NAMES = ['people', 'circles', 'circleMembers', 'memories', 'nextConnects', 'connectionLog']

describe('export / backup / restore', () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
  })

  it('exportAllData produces a JSON-serializable object containing all tables', async () => {
    const personId = await createPerson({ name: 'Export Test Person', metDateIsExplicit: false })
    const circleId = await createCircle({ name: 'Export Test Circle' })
    await addCircleMember({ personId, circleId })
    await createMemory({ personId, text: 'A memory worth keeping' })
    await createNextConnect({ personId, type: 'coffee' })
    await createConnectionLog({ personId, kind: 'call', at: new Date() })

    const exported = await exportAllData()

    // Every known table shows up as a key, and only known tables show up.
    for (const name of ALL_TABLE_NAMES) {
      expect(exported).toHaveProperty(name)
      expect(Array.isArray(exported[name])).toBe(true)
    }
    expect(Object.keys(exported).sort()).toEqual(ALL_TABLE_NAMES.slice().sort())

    // Non-empty for every table we just seeded one row into.
    expect(exported.people.length).toBe(1)
    expect(exported.circles.length).toBe(1)
    expect(exported.circleMembers.length).toBe(1)
    expect(exported.memories.length).toBe(1)
    expect(exported.nextConnects.length).toBe(1)
    expect(exported.connectionLog.length).toBe(1)

    // Must survive a real JSON.stringify/parse round trip (valid JSON).
    const roundTripped = JSON.parse(JSON.stringify(exported))
    expect(roundTripped.people[0].name).toBe('Export Test Person')
    expect(roundTripped.circles[0].name).toBe('Export Test Circle')
  })

  it('importData restores all tables so row counts match the originals after a wipe', async () => {
    const personId = await createPerson({ name: 'Restore Test Person', metDateIsExplicit: false })
    const circleId = await createCircle({ name: 'Restore Test Circle' })
    await addCircleMember({ personId, circleId })
    await createMemory({ personId, text: 'First memory' })
    await createMemory({ personId, text: 'Second memory' })
    await createNextConnect({ personId, type: 'lunch' })
    await createConnectionLog({ personId, kind: 'message', at: new Date() })
    await createConnectionLog({ personId, kind: 'meet', at: new Date() })

    const originalCounts = {
      people: await db.people.count(),
      circles: await db.circles.count(),
      circleMembers: await db.circleMembers.count(),
      memories: await db.memories.count(),
      nextConnects: await db.nextConnects.count(),
      connectionLog: await db.connectionLog.count(),
    }
    expect(originalCounts.memories).toBe(2)
    expect(originalCounts.connectionLog).toBe(2)

    const exported = await exportAllData()

    // Wipe the entire database.
    await Promise.all(db.tables.map((table) => table.clear()))
    for (const table of db.tables) {
      expect(await table.count()).toBe(0)
    }

    // Restore from the export.
    await importData(exported)

    expect(await db.people.count()).toBe(originalCounts.people)
    expect(await db.circles.count()).toBe(originalCounts.circles)
    expect(await db.circleMembers.count()).toBe(originalCounts.circleMembers)
    expect(await db.memories.count()).toBe(originalCounts.memories)
    expect(await db.nextConnects.count()).toBe(originalCounts.nextConnects)
    expect(await db.connectionLog.count()).toBe(originalCounts.connectionLog)

    // Spot-check restored content, not just counts.
    const restoredPerson = await db.people.get(personId)
    expect(restoredPerson?.name).toBe('Restore Test Person')
    const restoredCircle = await db.circles.get(circleId)
    expect(restoredCircle?.name).toBe('Restore Test Circle')
  })

  it('round-trips through a real JSON string (as downloadExport would produce)', async () => {
    await createPerson({ name: 'JSON Round Trip Person', metDateIsExplicit: false })
    await createCircle({ name: 'JSON Round Trip Circle' })

    const exported = await exportAllData()
    const jsonString = JSON.stringify(exported)
    const parsedBack = JSON.parse(jsonString)

    await Promise.all(db.tables.map((table) => table.clear()))
    await importData(parsedBack)

    expect(await db.people.count()).toBe(1)
    expect(await db.circles.count()).toBe(1)
  })
})

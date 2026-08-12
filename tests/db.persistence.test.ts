import { describe, expect, it } from 'vitest'
import { CircleNurtureDB } from '../src/data/db'

// ---------------------------------------------------------------------
// Proves requirement (b): data survives a full reload.
//
// A page reload doesn't erase IndexedDB — it destroys the JS heap
// (including any open IDBDatabase/Dexie connection object) while the
// browser's IndexedDB storage for that origin lives on independently.
// fake-indexeddb models that same split: `globalThis.indexedDB` (installed
// once in tests/setup.ts) is the persistent store for the whole test
// process, while each `new CircleNurtureDB(name)` is just a connection
// object pointed at it.
//
// So the proof here is: write through connection #1, `.close()` it
// (discarding that connection object entirely, the same way a reload
// discards the page's JS state), then open a brand-new, never-before-used
// connection #2 against the *same database name* and confirm the rows are
// still there. If persistence were only in-memory-per-instance, this would
// come back empty.
// ---------------------------------------------------------------------
describe('reload persistence (real IndexedDB, not in-memory)', () => {
  it('data written before a reload is still readable after reopening the same DB name', async () => {
    const dbName = 'CircleNurtureDB-persistence-test'

    const before = new CircleNurtureDB(dbName)
    const personId = await before.people.add({
      name: 'Reload Test Person',
      howMet: 'Met before the reload',
      whenMet: new Date('2026-03-01T00:00:00Z'),
      createdAt: new Date('2026-03-01T00:00:00Z'),
      updatedAt: new Date('2026-03-01T00:00:00Z'),
      metDateIsExplicit: true,
    })
    const circleId = await before.circles.add({ name: 'Reload Test Circle', createdAt: new Date() })
    await before.circleMembers.add({ personId, circleId, addedAt: new Date() })
    await before.memories.add({ personId, text: 'Remembered across reload', createdAt: new Date() })
    await before.nextConnects.add({
      personId,
      type: 'coffee',
      status: 'planned',
      createdAt: new Date(),
    })
    await before.connectionLog.add({ personId, kind: 'manual', at: new Date() })

    // Simulate the app being torn down (reload/restart): drop this
    // connection object entirely. The underlying IndexedDB database is
    // untouched by this — that's the whole point.
    before.close()

    // Simulate the app coming back up: a fresh connection, same name, no
    // reference at all to `before` or anything it held in memory.
    const after = new CircleNurtureDB(dbName)

    const person = await after.people.get(personId)
    expect(person?.name).toBe('Reload Test Person')
    expect(person?.howMet).toBe('Met before the reload')

    const circle = await after.circles.get(circleId)
    expect(circle?.name).toBe('Reload Test Circle')

    const members = await after.circleMembers.where('personId').equals(personId).toArray()
    expect(members).toHaveLength(1)
    expect(members[0].circleId).toBe(circleId)

    const memories = await after.memories.where('personId').equals(personId).toArray()
    expect(memories.map((m) => m.text)).toEqual(['Remembered across reload'])

    const nextConnects = await after.nextConnects.where('personId').equals(personId).toArray()
    expect(nextConnects).toHaveLength(1)
    expect(nextConnects[0].type).toBe('coffee')

    const log = await after.connectionLog.where('personId').equals(personId).toArray()
    expect(log).toHaveLength(1)
    expect(log[0].kind).toBe('manual')

    after.close()
  })
})

// ---------------------------------------------------------------------
// Proves requirement (c): migrations run idempotently from an empty DB.
// ---------------------------------------------------------------------
describe('idempotent schema application', () => {
  it('opening the same never-before-used DB name twice does not error or duplicate data', async () => {
    const dbName = 'CircleNurtureDB-idempotency-test'

    const first = new CircleNurtureDB(dbName)
    const second = new CircleNurtureDB(dbName)

    // Both connections apply the identical v1 `.stores()` chain against a
    // database that doesn't exist yet. Neither should throw, and Dexie's
    // internal version-change coordination between the two connections
    // should converge on one consistent schema, not two competing ones.
    await expect(Promise.all([first.open(), second.open()])).resolves.toBeDefined()

    const id = await first.people.add({
      name: 'Idempotency Test Person',
      createdAt: new Date(),
      updatedAt: new Date(),
      metDateIsExplicit: false,
    })

    // The second connection sees the same underlying database — one row,
    // not a duplicate, and no schema conflict.
    const viaSecond = await second.people.get(id)
    expect(viaSecond?.name).toBe('Idempotency Test Person')
    expect(await second.people.count()).toBe(1)
    expect(await first.people.count()).toBe(1)

    first.close()
    second.close()

    // Re-opening from scratch a third time against the same name — the
    // "opening the DB twice from scratch" case read literally — must also
    // be a clean no-op: no error, and the one row from before is intact
    // (nothing got re-created or duplicated by re-running the version
    // chain against an already-versioned database).
    const third = new CircleNurtureDB(dbName)
    await expect(third.open()).resolves.toBeDefined()
    expect(await third.people.count()).toBe(1)
    third.close()
  })
})

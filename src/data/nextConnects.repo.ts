import { db } from './db'
import type { NextConnect, NextConnectStatus, NextConnectType } from './db'

export type { NextConnect, NextConnectStatus, NextConnectType }

export type NewNextConnect = Omit<NextConnect, 'id' | 'createdAt' | 'status'> & {
  createdAt?: Date
  status?: NextConnectStatus
}

export async function createNextConnect(input: NewNextConnect): Promise<number> {
  return db.nextConnects.add({
    status: 'planned',
    ...input,
    createdAt: input.createdAt ?? new Date(),
  })
}

export async function getNextConnect(id: number): Promise<NextConnect | undefined> {
  return db.nextConnects.get(id)
}

export async function listNextConnects(): Promise<NextConnect[]> {
  return db.nextConnects.toArray()
}

export async function updateNextConnect(
  id: number,
  changes: Partial<Omit<NextConnect, 'id'>>,
): Promise<number> {
  return db.nextConnects.update(id, changes)
}

export async function deleteNextConnect(id: number): Promise<void> {
  await db.nextConnects.delete(id)
}

/** A person's next-connect rows, soonest target date first (undated rows last). */
export async function listNextConnectsByPerson(personId: number): Promise<NextConnect[]> {
  const rows = await db.nextConnects.where('personId').equals(personId).toArray()
  return rows.sort((a, b) => {
    if (!a.targetDate && !b.targetDate) return 0
    if (!a.targetDate) return 1
    if (!b.targetDate) return -1
    return a.targetDate.getTime() - b.targetDate.getTime()
  })
}

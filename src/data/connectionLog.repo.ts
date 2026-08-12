import { db } from './db'
import type { ConnectionLog, ConnectionLogKind } from './db'

export type { ConnectionLog, ConnectionLogKind }

export type NewConnectionLog = Omit<ConnectionLog, 'id' | 'at'> & { at?: Date }

export async function createConnectionLog(input: NewConnectionLog): Promise<number> {
  return db.connectionLog.add({ ...input, at: input.at ?? new Date() })
}

export async function getConnectionLog(id: number): Promise<ConnectionLog | undefined> {
  return db.connectionLog.get(id)
}

export async function listConnectionLog(): Promise<ConnectionLog[]> {
  return db.connectionLog.toArray()
}

export async function updateConnectionLog(
  id: number,
  changes: Partial<Omit<ConnectionLog, 'id'>>,
): Promise<number> {
  return db.connectionLog.update(id, changes)
}

export async function deleteConnectionLog(id: number): Promise<void> {
  await db.connectionLog.delete(id)
}

/** A person's connection history, most recent first. */
export async function listConnectionLogByPerson(personId: number): Promise<ConnectionLog[]> {
  const rows = await db.connectionLog.where('personId').equals(personId).toArray()
  return rows.sort((a, b) => b.at.getTime() - a.at.getTime())
}

/** The most recent time we connected with this person, or undefined if nothing's logged yet. */
export async function getLastConnectedAt(personId: number): Promise<Date | undefined> {
  const [mostRecent] = await listConnectionLogByPerson(personId)
  return mostRecent?.at
}

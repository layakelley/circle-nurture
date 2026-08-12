import { db } from './db'
import type { Memory } from './db'

export type { Memory }

export type NewMemory = Omit<Memory, 'id' | 'createdAt' | 'pinned'> & {
  createdAt?: Date
  pinned?: boolean
}

export async function createMemory(input: NewMemory): Promise<number> {
  return db.memories.add({
    pinned: false,
    ...input,
    createdAt: input.createdAt ?? new Date(),
  })
}

export async function getMemory(id: number): Promise<Memory | undefined> {
  return db.memories.get(id)
}

export async function listMemories(): Promise<Memory[]> {
  return db.memories.toArray()
}

export async function updateMemory(id: number, changes: Partial<Omit<Memory, 'id'>>): Promise<number> {
  return db.memories.update(id, changes)
}

export async function deleteMemory(id: number): Promise<void> {
  await db.memories.delete(id)
}

/** A person's memories, newest first (pinned or not — pinning is display-only ordering left to the UI). */
export async function listMemoriesByPerson(personId: number): Promise<Memory[]> {
  const rows = await db.memories.where('personId').equals(personId).toArray()
  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

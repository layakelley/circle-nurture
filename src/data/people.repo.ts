import { db } from './db'
import type { Person } from './db'

export type { Person }

export type NewPerson = Omit<Person, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Date
  updatedAt?: Date
}

export type PersonUpdate = Partial<Omit<Person, 'id' | 'createdAt'>>

export async function createPerson(input: NewPerson): Promise<number> {
  const now = new Date()
  return db.people.add({
    ...input,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  })
}

export async function getPerson(id: number): Promise<Person | undefined> {
  return db.people.get(id)
}

export async function listPeople(): Promise<Person[]> {
  return db.people.orderBy('name').toArray()
}

export async function updatePerson(id: number, changes: PersonUpdate): Promise<number> {
  return db.people.update(id, { ...changes, updatedAt: new Date() })
}

export async function deletePerson(id: number): Promise<void> {
  await db.people.delete(id)
}

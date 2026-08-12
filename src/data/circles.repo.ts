import { db } from './db'
import type { Circle } from './db'

export type { Circle }

export type NewCircle = Omit<Circle, 'id' | 'createdAt'> & { createdAt?: Date }

export async function createCircle(input: NewCircle): Promise<number> {
  return db.circles.add({ ...input, createdAt: input.createdAt ?? new Date() })
}

export async function getCircle(id: number): Promise<Circle | undefined> {
  return db.circles.get(id)
}

export async function listCircles(): Promise<Circle[]> {
  return db.circles.orderBy('name').toArray()
}

export async function updateCircle(id: number, changes: Partial<Omit<Circle, 'id'>>): Promise<number> {
  return db.circles.update(id, changes)
}

export async function deleteCircle(id: number): Promise<void> {
  await db.circles.delete(id)
}

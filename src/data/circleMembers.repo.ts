import { db } from './db'
import type { CircleMember } from './db'

export type { CircleMember }

export type NewCircleMember = Omit<CircleMember, 'id' | 'addedAt'> & { addedAt?: Date }

export async function addCircleMember(input: NewCircleMember): Promise<number> {
  return db.circleMembers.add({ ...input, addedAt: input.addedAt ?? new Date() })
}

export async function getCircleMember(id: number): Promise<CircleMember | undefined> {
  return db.circleMembers.get(id)
}

export async function listCircleMembers(): Promise<CircleMember[]> {
  return db.circleMembers.toArray()
}

export async function updateCircleMember(
  id: number,
  changes: Partial<Omit<CircleMember, 'id'>>,
): Promise<number> {
  return db.circleMembers.update(id, changes)
}

export async function removeCircleMember(id: number): Promise<void> {
  await db.circleMembers.delete(id)
}

/** Membership rows for a given circle — "who's in this circle." */
export async function listMembersForCircle(circleId: number): Promise<CircleMember[]> {
  return db.circleMembers.where('circleId').equals(circleId).toArray()
}

/** Membership rows for a given person — "which circles is this person in." */
export async function listCirclesForPerson(personId: number): Promise<CircleMember[]> {
  return db.circleMembers.where('personId').equals(personId).toArray()
}

/** Remove a specific person from a specific circle without knowing the membership row id. */
export async function removeMembership(personId: number, circleId: number): Promise<void> {
  await db.circleMembers.where({ personId, circleId }).delete()
}

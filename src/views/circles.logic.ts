import {
  addCircleMember,
  listCirclesForPerson,
  listMembersForCircle,
  removeCircleMember,
} from '../data/circleMembers.repo'
import { deleteCircle } from '../data/circles.repo'

// ---------------------------------------------------------------------
// Circle logic, composed entirely from the repo layer (never touches
// Dexie directly). Kept in a plain .ts module — separate from
// CircleView.tsx — so it's trivially unit-testable without rendering
// any UI, and so CircleView.tsx stays focused on presentation.
// ---------------------------------------------------------------------

/**
 * Add a person to a circle, skipping the write if they're already a
 * member. Makes both the single "add existing person" action and
 * bulk-assign safe to re-run without creating duplicate membership rows.
 * A person may belong to any number of circles at once — this never
 * checks or limits how many circles a person is already in.
 */
export async function addPersonToCircle(personId: number, circleId: number): Promise<void> {
  const existingMemberships = await listCirclesForPerson(personId)
  const alreadyMember = existingMemberships.some((m) => m.circleId === circleId)
  if (alreadyMember) return
  await addCircleMember({ personId, circleId })
}

/** Add many people to a circle in one action (the bulk-assign flow). */
export async function bulkAddPeopleToCircle(personIds: number[], circleId: number): Promise<void> {
  for (const personId of personIds) {
    await addPersonToCircle(personId, circleId)
  }
}

/**
 * Delete a circle and every circleMembers row that points at it, so
 * deleting a circle never leaves orphaned membership rows behind.
 */
export async function deleteCircleCascade(circleId: number): Promise<void> {
  const members = await listMembersForCircle(circleId)
  for (const member of members) {
    if (member.id != null) {
      await removeCircleMember(member.id)
    }
  }
  await deleteCircle(circleId)
}

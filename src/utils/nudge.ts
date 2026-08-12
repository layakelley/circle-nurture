import { db } from '../data/db'
import { getLastConnected } from '../data/connectionLog.repo'
import { listPeople } from '../data/people.repo'

// ---------------------------------------------------------------------
// WI-11 — Gentle Nudge, never homework.
//
// A nudge is a soft, factual observation ("it's been a while"), never a
// score, streak, or guilt trip. It only ever applies to people we've
// actually connected with before — someone with NO connectionLog entry
// yet is brand new and must never be nudged; that would punish the act
// of adding them.
// ---------------------------------------------------------------------

/**
 * Days since last connection past which a gentle nudge may appear.
 * Deliberately calm/non-urgent — tune here, nowhere else.
 */
export const NUDGE_THRESHOLD_DAYS = 45

const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface PersonNeedingNudge {
  personId: number
  name: string
  lastConnected: Date | null
}

function daysSince(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / MS_PER_DAY
}

/**
 * The most recent (if any) dismissal recorded for this person.
 * Exported for tests; not expected to be needed outside this module.
 */
export async function getLatestDismissal(personId: number) {
  const rows = await db.nudgeDismissals.where('personId').equals(personId).toArray()
  if (rows.length === 0) return undefined
  return rows.reduce((latest, row) =>
    row.dismissedAt.getTime() > latest.dismissedAt.getTime() ? row : latest,
  )
}

/**
 * Records that the user dismissed the nudge for this person, tagged with
 * the `lastConnected` value in effect at dismissal time. A later, NEW gap
 * (i.e. `lastConnected` moves forward past this dismissal's tag — from a
 * fresh connectionLog entry, then more time passing) is unaffected by this
 * dismissal and can nudge again.
 */
export async function dismissNudge(personId: number, lastConnected: Date | null): Promise<number> {
  return db.nudgeDismissals.add({
    personId,
    dismissedAt: new Date(),
    dismissedForLastConnected: lastConnected ? lastConnected.getTime() : null,
  })
}

/**
 * True when a nudge for this personId/lastConnected pair was already
 * dismissed and no new gap has opened since (i.e. `lastConnected` hasn't
 * moved forward past what was dismissed).
 */
function isDismissed(
  dismissal: { dismissedForLastConnected: number | null } | undefined,
  lastConnected: Date | null,
): boolean {
  if (!dismissal) return false
  const currentValue = lastConnected ? lastConnected.getTime() : null
  return dismissal.dismissedForLastConnected === currentValue
}

/**
 * Computes, for every person with at least one logged connection, the
 * people whose gap since last connecting exceeds `NUDGE_THRESHOLD_DAYS` —
 * excluding anyone with no connectionLog entry at all, and excluding
 * anyone whose nudge for the current gap has already been dismissed.
 */
export async function getPeopleNeedingNudge(now: Date = new Date()): Promise<PersonNeedingNudge[]> {
  const people = await listPeople()
  const results: PersonNeedingNudge[] = []

  for (const person of people) {
    if (person.id === undefined) continue

    const lastConnected = await getLastConnected(person.id)
    // Never nudge someone with no connection log yet — brand new additions
    // should never be punished for not having connected.
    if (!lastConnected) continue

    if (daysSince(lastConnected, now) < NUDGE_THRESHOLD_DAYS) continue

    const dismissal = await getLatestDismissal(person.id)
    if (isDismissed(dismissal, lastConnected)) continue

    results.push({ personId: person.id, name: person.name, lastConnected })
  }

  return results
}

import { createPerson, listPeople } from './people.repo'
import type { Person } from './people.repo'
import { addCircleMember, listCirclesForPerson } from './circleMembers.repo'

// ---------------------------------------------------------------------
// WI-06 — Bring My People (contact import).
//
// This module is deliberately import-only, never auto-import: nothing
// here reads a whole address book and writes it to the database on its
// own. Every entry point takes an explicit, already-user-selected list
// of contacts (from the native Contact Picker's own selection UI, or
// parsed out of a .vcf the user chose to upload) and every write still
// goes through the existing people.repo.ts / circleMembers.repo.ts
// functions — this file never touches Dexie directly.
// ---------------------------------------------------------------------

/** A contact as picked from the OS contact picker or parsed from a vCard — not yet a Person row. */
export interface ImportedContact {
  name: string
  phone?: string
  email?: string
}

// ---------------------------------------------------------------------
// Contact Picker API (https://wicg.github.io/contact-picker/).
//
// Supported on Android Chrome; unsupported on iOS Safari and desktop
// browsers. There's no official TS lib.dom typing for it yet, so it's
// typed narrowly right here rather than widening the global Navigator
// type for the whole app.
// ---------------------------------------------------------------------

interface ContactsManagerContact {
  name?: string[]
  tel?: string[]
  email?: string[]
}

interface ContactsManager {
  select(
    properties: Array<'name' | 'tel' | 'email'>,
    options?: { multiple?: boolean },
  ): Promise<ContactsManagerContact[]>
}

type NavigatorWithContacts = Navigator & { contacts?: ContactsManager }

/**
 * Feature-detects the Contact Picker API. Checked twice (the `navigator`
 * property AND the `window.ContactsManager` constructor) per the pattern
 * MDN recommends, and wrapped so it can never throw — this must degrade
 * silently to `false` on iOS Safari and every other unsupported browser,
 * never throw into the calling view.
 */
export function isContactPickerAvailable(): boolean {
  try {
    return (
      typeof navigator !== 'undefined' &&
      'contacts' in navigator &&
      typeof window !== 'undefined' &&
      'ContactsManager' in window
    )
  } catch {
    return false
  }
}

/**
 * Opens the native contact picker for one batch of user-selected
 * contacts. The browser itself owns the selection UI (checkboxes, one
 * contact/batch at a time) — this function never receives or requests
 * "everything," only what the user checked off before confirming.
 *
 * Resolves to `[]` (never throws) when the API is unavailable, the user
 * cancels the picker, or the browser rejects the call for any reason —
 * callers can treat an empty array as "nothing new to add" without a
 * try/catch of their own.
 */
export async function pickContactsBatch(multiple = true): Promise<ImportedContact[]> {
  if (!isContactPickerAvailable()) return []
  try {
    const contactsManager = (navigator as NavigatorWithContacts).contacts
    if (!contactsManager) return []
    const picked = await contactsManager.select(['name', 'tel', 'email'], { multiple })
    return picked
      .map((c) => ({
        name: (c.name?.[0] ?? '').trim(),
        phone: c.tel?.[0]?.trim() || undefined,
        email: c.email?.[0]?.trim() || undefined,
      }))
      .filter((c) => c.name || c.phone || c.email)
      .map((c) => ({ ...c, name: c.name || 'Unnamed contact' }))
  } catch {
    // Picker cancelled, permission denied, or a transient browser error —
    // all treated the same as "nothing picked this time."
    return []
  }
}

// ---------------------------------------------------------------------
// vCard (.vcf) parsing — a pragmatic subset of vCard 3.0/4.0: FN/N for
// name, first TEL, first EMAIL. Good enough for contact-export files,
// not a full RFC 6350 implementation.
// ---------------------------------------------------------------------

/** Reconstructs a display name from a vCard N field: `Family;Given;Additional;Prefix;Suffix`. */
function nameFromNField(nField: string | undefined): string | undefined {
  if (!nField) return undefined
  const [family, given] = nField.split(';')
  const parts = [given, family].map((p) => p?.trim()).filter(Boolean)
  return parts.length ? parts.join(' ') : undefined
}

/**
 * Parses one or more `BEGIN:VCARD…END:VCARD` blocks out of raw vCard
 * text and returns the contacts found. Unknown/unsupported vCard lines
 * are ignored rather than causing a parse failure.
 */
export function parseVCards(text: string): ImportedContact[] {
  if (!text || !text.trim()) return []

  // Unfold RFC 6350 folded lines: a line that starts with a single space
  // or tab is a continuation of the previous line.
  const unfolded = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '')

  const cardBodies = unfolded.split(/BEGIN:VCARD/i).slice(1)
  const contacts: ImportedContact[] = []

  for (const rawCard of cardBodies) {
    const body = rawCard.split(/END:VCARD/i)[0] ?? ''
    const lines = body
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    let fn: string | undefined
    let nField: string | undefined
    let phone: string | undefined
    let email: string | undefined

    for (const line of lines) {
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) continue
      const key = line.slice(0, colonIndex).split(';')[0]?.toUpperCase()
      const value = line.slice(colonIndex + 1).trim()
      if (!value) continue

      if (key === 'FN' && !fn) fn = value
      else if (key === 'N' && !nField) nField = value
      else if (key === 'TEL' && !phone) phone = value
      else if (key === 'EMAIL' && !email) email = value
    }

    const name = fn ?? nameFromNField(nField)
    if (!name && !phone && !email) continue

    contacts.push({
      name: name || 'Unnamed contact',
      phone,
      email,
    })
  }

  return contacts
}

// ---------------------------------------------------------------------
// Dedupe + import.
// ---------------------------------------------------------------------

/** Digits-only phone key, trimmed to the last 10 digits so a stored `+1-555-…`
 * and an imported `(555) …` with/without a country code still match. */
function phoneKey(phone: string | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  return digits.length > 10 ? digits.slice(-10) : digits
}

function nameKey(name: string | undefined): string | null {
  const trimmed = name?.trim().toLowerCase().replace(/\s+/g, ' ')
  return trimmed || null
}

/**
 * Finds an existing person matching an imported contact: phone number
 * match first, falling back to an exact (case/whitespace-insensitive)
 * name match when there's no phone to compare. Used to keep re-imports
 * (e.g. re-uploading the same .vcf, or re-picking an already-imported
 * contact) from creating duplicate people.
 */
export function findExistingMatch(existing: Person[], contact: ImportedContact): Person | undefined {
  const contactPhoneKey = phoneKey(contact.phone)
  if (contactPhoneKey) {
    const byPhone = existing.find((p) => phoneKey(p.phone) === contactPhoneKey)
    if (byPhone) return byPhone
  }

  const contactNameKey = nameKey(contact.name)
  if (contactNameKey) {
    return existing.find((p) => nameKey(p.name) === contactNameKey)
  }

  return undefined
}

export interface ImportResult {
  /** Newly created Person rows. */
  created: Person[]
  /** Contacts that matched an existing person and were skipped rather than duplicated. */
  skipped: Array<{ contact: ImportedContact; existing: Person }>
}

/**
 * Creates a Person row (via people.repo.createPerson) for each imported
 * contact that doesn't already match an existing person, skipping the
 * rest. Dedupe checks both the people already in the database *and*
 * anyone created earlier in this same call, so importing a list that
 * contains the same contact twice only ever creates one row.
 */
export async function importContactsDeduped(contacts: ImportedContact[]): Promise<ImportResult> {
  const existingPeople = await listPeople()
  const knownPeople = [...existingPeople]

  const created: Person[] = []
  const skipped: ImportResult['skipped'] = []

  for (const contact of contacts) {
    const name = contact.name?.trim()
    if (!name) continue

    const match = findExistingMatch(knownPeople, contact)
    if (match) {
      skipped.push({ contact, existing: match })
      continue
    }

    const now = new Date()
    const id = await createPerson({
      name,
      phone: contact.phone || undefined,
      email: contact.email || undefined,
      metDateIsExplicit: false,
    })
    const newPerson: Person = {
      id,
      name,
      phone: contact.phone || undefined,
      email: contact.email || undefined,
      createdAt: now,
      updatedAt: now,
      metDateIsExplicit: false,
    }
    created.push(newPerson)
    knownPeople.push(newPerson)
  }

  return { created, skipped }
}

// ---------------------------------------------------------------------
// Bulk circle assignment for imported people. Implemented directly
// against circleMembers.repo.ts (rather than importing CircleView.tsx's
// logic module) so this file has no dependency on the other in-flight
// Circles work item — mirrors its already-a-member guard so re-running
// an assignment is always safe.
// ---------------------------------------------------------------------

export async function assignPeopleToCircle(personIds: number[], circleId: number): Promise<void> {
  for (const personId of personIds) {
    const existingMemberships = await listCirclesForPerson(personId)
    const alreadyMember = existingMemberships.some((m) => m.circleId === circleId)
    if (alreadyMember) continue
    await addCircleMember({ personId, circleId })
  }
}

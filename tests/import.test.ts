import { beforeAll, describe, expect, it } from 'vitest'
import { db } from '../src/data/db'
import { listPeople } from '../src/data/people.repo'
import { createCircle } from '../src/data/circles.repo'
import { listMembersForCircle } from '../src/data/circleMembers.repo'
import {
  assignPeopleToCircle,
  importContactsDeduped,
  parseVCards,
} from '../src/data/import'

// WI-06 — Bring My People (contact import). Exercises the logic in
// src/data/import.ts against the real repo layer, backed by
// fake-indexeddb (see tests/setup.ts). No DOM rendering needed — this
// proves the data behavior the binary acceptance criteria care about:
// vCard parsing, dedupe-on-reimport, and bulk circle assignment.
describe('contact import', () => {
  beforeAll(async () => {
    await Promise.all([db.people.clear(), db.circles.clear(), db.circleMembers.clear()])
  })

  it('parses name/phone/email out of a sample vCard', () => {
    const sample = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Rivera;Sam;;;',
      'FN:Sam Rivera',
      'TEL;TYPE=CELL:+1-555-123-4567',
      'EMAIL:sam.rivera@example.com',
      'END:VCARD',
    ].join('\r\n')

    const contacts = parseVCards(sample)

    expect(contacts).toHaveLength(1)
    expect(contacts[0]).toMatchObject({
      name: 'Sam Rivera',
      phone: '+1-555-123-4567',
      email: 'sam.rivera@example.com',
    })
  })

  it('parses multiple vCards from one file, falling back to N when FN is missing', () => {
    const sample = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Jordan Lee',
      'TEL:555-000-1111',
      'END:VCARD',
      'BEGIN:VCARD',
      'VERSION:4.0',
      'N:Chen;Ana;;;',
      'EMAIL:ana@example.com',
      'END:VCARD',
    ].join('\n')

    const contacts = parseVCards(sample)

    expect(contacts).toHaveLength(2)
    expect(contacts[0]).toMatchObject({ name: 'Jordan Lee', phone: '555-000-1111' })
    expect(contacts[1]).toMatchObject({ name: 'Ana Chen', email: 'ana@example.com' })
  })

  it('dedupes by phone number: importing the same person twice does not create a duplicate row', async () => {
    const contact = { name: 'Taylor Nguyen', phone: '(555) 234-5678', email: 'taylor@example.com' }

    const first = await importContactsDeduped([contact])
    expect(first.created).toHaveLength(1)
    expect(first.skipped).toHaveLength(0)

    // Re-import the exact same contact (as if re-picking it or re-uploading
    // the same .vcf) — must dedupe by phone, not create a second row.
    const second = await importContactsDeduped([contact])
    expect(second.created).toHaveLength(0)
    expect(second.skipped).toHaveLength(1)
    expect(second.skipped[0]?.existing.name).toBe('Taylor Nguyen')

    const allPeople = await listPeople()
    const matches = allPeople.filter((p) => p.name === 'Taylor Nguyen')
    expect(matches).toHaveLength(1)
  })

  it('dedupes a slightly different phone formatting for the same number', async () => {
    // Same 10-digit number, different punctuation/country-code prefix.
    const first = await importContactsDeduped([{ name: 'Priya Shah', phone: '555-987-6543' }])
    expect(first.created).toHaveLength(1)

    const second = await importContactsDeduped([{ name: 'Priya Shah', phone: '+1 (555) 987-6543' }])
    expect(second.created).toHaveLength(0)
    expect(second.skipped).toHaveLength(1)
  })

  it('falls back to exact name match when there is no phone to compare', async () => {
    const first = await importContactsDeduped([{ name: 'Morgan Blake' }])
    expect(first.created).toHaveLength(1)

    const second = await importContactsDeduped([{ name: 'Morgan Blake' }])
    expect(second.created).toHaveLength(0)
    expect(second.skipped).toHaveLength(1)
  })

  it('bulk-assigns multiple freshly imported people to a circle', async () => {
    const contacts = [
      { name: 'Imported One', phone: '555-111-2222' },
      { name: 'Imported Two', phone: '555-333-4444' },
      { name: 'Imported Three', phone: '555-555-6666' },
    ]
    const { created } = await importContactsDeduped(contacts)
    expect(created).toHaveLength(3)

    const circleId = await createCircle({ name: 'Newly Imported' })
    const personIds = created.map((p) => p.id).filter((id): id is number => id != null)

    await assignPeopleToCircle(personIds, circleId)

    const members = await listMembersForCircle(circleId)
    expect(members.map((m) => m.personId).sort()).toEqual([...personIds].sort())

    // Re-running the assignment must not create duplicate membership rows.
    await assignPeopleToCircle(personIds, circleId)
    expect((await listMembersForCircle(circleId)).length).toBe(personIds.length)
  })
})

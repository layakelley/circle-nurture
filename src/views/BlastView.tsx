import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { buildSmsUrl, smsNavigation } from '../components/Composer'
import { createConnectionLog } from '../data/connectionLog.repo'
import { listPeople } from '../data/people.repo'
import { listCircles } from '../data/circles.repo'
import { listCircleMembers } from '../data/circleMembers.repo'
import type { Person } from '../data/db'
import CircleChip from '../components/CircleChip'
import './BlastView.css'

// ---------------------------------------------------------------------
// WI-10 — Private Blast: the centerpiece behavior of the app.
//
// HARD PRIVACY INVARIANT — read before touching this file:
//
//   A multi-recipient SMS array is FORBIDDEN. Every recipient gets their
//   own separate, private, individually-launched `sms:` composer. Never
//   a group text, never a comma-joined recipient list, never anything
//   that could create a group MMS thread where recipients see each
//   other.
//
// That means: one message is composed ONCE (a single text field), but
// at send time this view calls `buildSmsUrl`/`smsNavigation.navigate`
// (reused as-is from Composer.tsx — see that file for why the URL
// builder takes a single `phone: string`, never an array) once PER
// RECIPIENT, sequentially, each call addressed to exactly one phone
// number. There is no code path anywhere below that joins multiple
// phone numbers into one string or array before handing it to
// `buildSmsUrl`/`smsNavigation.navigate` — grep this file for `join(`
// or `,` near either of those two identifiers and you should find
// nothing.
//
// Standalone: not mounted anywhere yet, matching the other in-flight
// cards. A later integration step wires this into routing/navigation.
// ---------------------------------------------------------------------

/** How long to pause between each individual sms: launch. Sequential,
 *  one at a time — most mobile OSes can only reasonably foreground one
 *  `sms:` composer at a time anyway, so this gives the user a beat to
 *  return to the app between launches rather than firing them as fast
 *  as the loop can go. */
const SEND_DELAY_MS = 60

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface SendResult {
  sent: string[]
  skipped: string[]
}

export default function BlastView() {
  // Live queries: re-render automatically as people/circles/memberships
  // change elsewhere in the app — same pattern as PersonView.tsx.
  const people = useLiveQuery(() => listPeople(), []) ?? []
  const circles = useLiveQuery(() => listCircles(), []) ?? []
  const memberships = useLiveQuery(() => listCircleMembers(), []) ?? []

  const [message, setMessage] = useState('')
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<number>>(new Set())
  const [selectedCircleIds, setSelectedCircleIds] = useState<Set<number>>(new Set())
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<{ index: number; total: number } | null>(null)
  const [result, setResult] = useState<SendResult | null>(null)

  const peopleById = useMemo(() => {
    const map = new Map<number, Person>()
    for (const person of people) {
      if (person.id !== undefined) map.set(person.id, person)
    }
    return map
  }, [people])

  // The dedupe: a Set of person ids, built from individually-selected
  // people PLUS everyone in any selected circle. Whether someone landed
  // here via direct selection, one circle, or several overlapping
  // circles, they occupy exactly one slot in this Set — so exactly one
  // message gets sent to them, never more.
  const recipientIds = useMemo(() => {
    const ids = new Set<number>(selectedPersonIds)
    for (const membership of memberships) {
      if (selectedCircleIds.has(membership.circleId)) {
        ids.add(membership.personId)
      }
    }
    return ids
  }, [selectedPersonIds, selectedCircleIds, memberships])

  const recipients = useMemo(
    () =>
      Array.from(recipientIds)
        .map((id) => peopleById.get(id))
        .filter((person): person is Person => Boolean(person)),
    [recipientIds, peopleById],
  )

  function togglePerson(id: number) {
    setSelectedPersonIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleCircle(id: number) {
    setSelectedCircleIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const trimmedMessage = message.trim()
  const canSend = !sending && trimmedMessage !== '' && recipients.length > 0

  async function handleSend() {
    if (!canSend) return

    setSending(true)
    setResult(null)

    const withPhone = recipients.filter((person) => Boolean(person.phone && person.phone.trim()))
    const withoutPhone = recipients.filter((person) => !(person.phone && person.phone.trim()))

    const sentNames: string[] = []
    const skippedNames = withoutPhone.map((person) => person.name)

    setProgress({ index: 0, total: withPhone.length })

    for (let i = 0; i < withPhone.length; i++) {
      const person = withPhone[i]
      const phone = person.phone!.trim()

      // --- The one line that matters most in this whole card ---
      // `phone` is a single string for exactly one person. `buildSmsUrl`
      // and `smsNavigation.navigate` are the exact same helpers
      // Composer.tsx uses for its single-recipient launch — nothing here
      // joins, concatenates, or arrays multiple recipients together.
      const url = buildSmsUrl(phone, trimmedMessage)
      smsNavigation.navigate(url)

      await createConnectionLog({ personId: person.id!, kind: 'blast' })
      sentNames.push(person.name)
      setProgress({ index: i + 1, total: withPhone.length })

      // Sequential: wait between launches rather than firing them all at
      // once, so this is one-at-a-time by construction, not just "not
      // literally parallel."
      if (i < withPhone.length - 1) {
        await delay(SEND_DELAY_MS)
      }
    }

    setResult({ sent: sentNames, skipped: skippedNames })
    setProgress(null)
    setSending(false)
  }

  return (
    <div className="blast-view">
      <h1 className="blast-view__title">Private Blast</h1>
      <p className="blast-view__tagline">
        Each person gets their own private message — no group text.
      </p>

      <div className="blast-view__field">
        <label htmlFor="blast-view-message" className="blast-view__label">
          Message
        </label>
        <textarea
          id="blast-view-message"
          className="blast-view__textarea"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write it once — everyone you pick below gets their own private copy."
        />
      </div>

      <section className="blast-view__section" aria-label="Select people">
        <h2 className="blast-view__section-title">People</h2>
        {people.length === 0 ? (
          <p className="blast-view__empty">No people yet.</p>
        ) : (
          <ul className="blast-view__people-list">
            {people
              .filter((person): person is Person & { id: number } => person.id !== undefined)
              .map((person) => (
                <li key={person.id}>
                  <label className="blast-view__checkbox-row">
                    <input
                      type="checkbox"
                      checked={selectedPersonIds.has(person.id)}
                      onChange={() => togglePerson(person.id)}
                    />
                    {person.name}
                  </label>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="blast-view__section" aria-label="Select circles">
        <h2 className="blast-view__section-title">Circles</h2>
        {circles.length === 0 ? (
          <p className="blast-view__empty">No circles yet.</p>
        ) : (
          <div className="blast-view__circle-list">
            {circles
              .filter((circle): circle is typeof circle & { id: number } => circle.id !== undefined)
              .map((circle) => {
                const selected = selectedCircleIds.has(circle.id)
                return (
                  <CircleChip
                    key={circle.id}
                    name={selected ? `✓ ${circle.name}` : circle.name}
                    onClick={() => toggleCircle(circle.id)}
                  />
                )
              })}
          </div>
        )}
      </section>

      <p className="blast-view__count" aria-live="polite">
        {recipients.length} {recipients.length === 1 ? 'person' : 'people'} selected
      </p>

      <button
        type="button"
        className="blast-view__send-button"
        onClick={() => void handleSend()}
        disabled={!canSend}
      >
        {sending
          ? progress
            ? `Sending ${progress.index} of ${progress.total}…`
            : 'Sending…'
          : `Send private blast to ${recipients.length}`}
      </button>

      {result ? (
        <div className="blast-view__result" role="status">
          {result.sent.length > 0 ? (
            <p className="blast-view__sent">Sent to {result.sent.join(', ')}.</p>
          ) : null}
          {result.skipped.length > 0 ? (
            <p className="blast-view__skipped">
              Skipped (no phone number on file): {result.skipped.join(', ')}.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

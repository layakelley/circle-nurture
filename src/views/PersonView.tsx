import { useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getPerson, updatePerson } from '../data/people.repo'
import { listCirclesForPerson } from '../data/circleMembers.repo'
import { listCircles } from '../data/circles.repo'
import { createConnectionLog } from '../data/connectionLog.repo'
import CircleChip from '../components/CircleChip'
import ContextStrip from '../components/ContextStrip'
import MemoryList from '../components/MemoryList'
import MemoryComposer from '../components/MemoryComposer'
import Composer, { buildSmsUrl, smsNavigation } from '../components/Composer'
import TrueTonePanel from '../components/TrueTonePanel'
import NextConnectSheet from '../components/NextConnectSheet'
import NextConnectSummary from '../components/NextConnectSummary'
import './PersonView.css'

// ---------------------------------------------------------------------
// WI-08 — Person profile + Our Connection.
//
// Standalone: takes a personId prop directly (not read from the URL —
// a later integration card wires `/person/:id` in src/router.tsx and
// passes the parsed id in here). Composes the pieces already built by
// earlier cards (LastConnectedLabel via ContextStrip, MemoryList,
// MemoryComposer, CircleChip) plus two new pieces this card owns:
//
//   - "Our Connection": the how/when/where/what/organization/remember
//     context, editable in place, persisted via people.repo.updatePerson.
//   - "Memories": deliberately a SEPARATE section, both structurally
//     (its own <section aria-label>) and visually (its own heading) —
//     context is who they are; memories are moments captured over time.
//     They must never blend into one list or one heading.
// ---------------------------------------------------------------------

export interface PersonViewProps {
  personId: number
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromDateInputValue(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

/**
 * "Met August 2026" — soft chronology, month + year only, never a
 * precise day. Exported so the exact copy can be unit-tested directly.
 */
export function formatMetWhen(date: Date): string {
  return `Met ${date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
}

interface ConnectionFormState {
  howMet: string
  whereMet: string
  whatConnectedUs: string
  organization: string
  remember: string
  dateValue: string
  dateUnknown: boolean
}

export default function PersonView({ personId }: PersonViewProps) {
  // Live queries: re-render automatically on any change to the person,
  // their circle memberships, or the circles table itself (e.g. a
  // rename made elsewhere) — same pattern as HomeView.tsx.
  const person = useLiveQuery(() => getPerson(personId), [personId])
  const memberships = useLiveQuery(() => listCirclesForPerson(personId), [personId]) ?? []
  const circles = useLiveQuery(() => listCircles(), []) ?? []

  const personCircles = useMemo(() => {
    const nameById = new Map<number, string>()
    for (const circle of circles) {
      if (circle.id !== undefined) nameById.set(circle.id, circle.name)
    }
    return memberships
      .map((membership) => ({ id: membership.circleId, name: nameById.get(membership.circleId) }))
      .filter((c): c is { id: number; name: string } => Boolean(c.name))
  }, [memberships, circles])

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ConnectionFormState | null>(null)
  const [trueToneOpen, setTrueToneOpen] = useState(false)
  const [nextConnectOpen, setNextConnectOpen] = useState(false)

  // Ref on the composer's wrapper so the "Add memory" action can bring
  // it into view / focus it, rather than duplicating a second composer.
  const composerRef = useRef<HTMLDivElement | null>(null)

  // WI-18 integration: TrueTone hands back a drafted, user-edited body of
  // text via onUseDraft — it never sends anything itself (see
  // TrueTonePanel.tsx). Launching the sms: composer here reuses the exact
  // same single-recipient helpers Composer.tsx uses internally, so this
  // path carries the identical privacy guarantee (one phone, one URL,
  // never an array).
  async function handleUseTrueToneDraft(text: string) {
    setTrueToneOpen(false)
    if (!person?.phone || !person.phone.trim()) return
    const url = buildSmsUrl(person.phone.trim(), text)
    smsNavigation.navigate(url)
    await createConnectionLog({ personId, kind: 'message' })
  }

  function startEdit() {
    if (!person) return
    setForm({
      howMet: person.howMet ?? '',
      whereMet: person.whereMet ?? '',
      whatConnectedUs: person.whatConnectedUs ?? '',
      organization: person.organization ?? '',
      remember: person.remember ?? '',
      dateValue: person.whenMet ? toDateInputValue(person.whenMet) : '',
      // Mirrors the display gate below: a date only counts as "known"
      // once metDateIsExplicit is true.
      dateUnknown: !person.metDateIsExplicit,
    })
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setForm(null)
  }

  function updateForm(changes: Partial<ConnectionFormState>) {
    setForm((prev) => (prev ? { ...prev, ...changes } : prev))
  }

  async function saveEdit() {
    if (!form) return
    const whenMet = form.dateUnknown || form.dateValue === '' ? null : fromDateInputValue(form.dateValue)
    await updatePerson(personId, {
      howMet: form.howMet.trim() || undefined,
      whereMet: form.whereMet.trim() || undefined,
      whatConnectedUs: form.whatConnectedUs.trim() || undefined,
      organization: form.organization.trim() || undefined,
      remember: form.remember.trim() || undefined,
      whenMet,
      metDateIsExplicit: whenMet !== null,
    })
    setEditing(false)
    setForm(null)
  }

  function handleAddMemory() {
    const node = composerRef.current
    if (!node) return
    node.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    node.querySelector('textarea')?.focus()
  }

  if (!person) {
    return (
      <div className="person-view person-view--loading">
        <p>Loading…</p>
      </div>
    )
  }

  // A date only renders once it's been explicitly confirmed — a bare
  // whenMet with metDateIsExplicit:false is still just the soft "today"
  // default from AddPersonView, not something worth stating as fact.
  const showDate = Boolean(person.whenMet) && person.metDateIsExplicit
  const hasAnyContext =
    showDate ||
    Boolean(person.howMet) ||
    Boolean(person.whereMet) ||
    Boolean(person.whatConnectedUs) ||
    Boolean(person.organization) ||
    Boolean(person.remember)

  return (
    <div className="person-view">
      <h1 className="person-view__name">{person.name}</h1>

      {/* WI-17 fills in the rest of the context strip; see the comment
          inside ContextStrip.tsx itself for exactly what lands there. */}
      <ContextStrip personId={personId} />

      <NextConnectSummary personId={personId} />

      {personCircles.length > 0 ? (
        <div className="person-view__circles" aria-label="Circles">
          {personCircles.map((circle) => (
            <CircleChip key={circle.id} name={circle.name} />
          ))}
        </div>
      ) : null}

      <section className="person-view__section" aria-label="Our Connection">
        <div className="person-view__section-header">
          <h2 className="person-view__section-title">Our Connection</h2>
          {!editing ? (
            <button type="button" className="person-view__ghost-button" onClick={startEdit}>
              Edit
            </button>
          ) : null}
        </div>

        {editing && form ? (
          <div className="person-view__edit-form">
            <div className="person-view__edit-field">
              <span className="person-view__edit-label" id="person-view-date-label">
                When we met
              </span>
              <div className="person-view__date-row">
                <input
                  className="person-view__input"
                  type="date"
                  aria-label="When we met"
                  value={form.dateValue}
                  disabled={form.dateUnknown}
                  onChange={(event) => updateForm({ dateValue: event.target.value, dateUnknown: false })}
                />
                <button
                  type="button"
                  className="person-view__ghost-button"
                  aria-pressed={form.dateUnknown}
                  onClick={() =>
                    updateForm({
                      dateUnknown: !form.dateUnknown,
                      dateValue: !form.dateUnknown ? '' : form.dateValue,
                    })
                  }
                >
                  {form.dateUnknown ? "Unknown ✓" : "I don't know"}
                </button>
              </div>
            </div>

            <div className="person-view__edit-field">
              <label className="person-view__edit-label" htmlFor="person-view-how-met">
                How we met
              </label>
              <input
                id="person-view-how-met"
                className="person-view__input"
                type="text"
                value={form.howMet}
                onChange={(event) => updateForm({ howMet: event.target.value })}
              />
            </div>

            <div className="person-view__edit-field">
              <label className="person-view__edit-label" htmlFor="person-view-where-met">
                Where we met
              </label>
              <input
                id="person-view-where-met"
                className="person-view__input"
                type="text"
                value={form.whereMet}
                onChange={(event) => updateForm({ whereMet: event.target.value })}
              />
            </div>

            <div className="person-view__edit-field">
              <label className="person-view__edit-label" htmlFor="person-view-connected">
                What connected us
              </label>
              <input
                id="person-view-connected"
                className="person-view__input"
                type="text"
                value={form.whatConnectedUs}
                onChange={(event) => updateForm({ whatConnectedUs: event.target.value })}
              />
            </div>

            <div className="person-view__edit-field">
              <label className="person-view__edit-label" htmlFor="person-view-org">
                Organization
              </label>
              <input
                id="person-view-org"
                className="person-view__input"
                type="text"
                value={form.organization}
                onChange={(event) => updateForm({ organization: event.target.value })}
              />
            </div>

            <div className="person-view__edit-field">
              <label className="person-view__edit-label" htmlFor="person-view-remember">
                Something to remember
              </label>
              <textarea
                id="person-view-remember"
                className="person-view__input person-view__textarea"
                value={form.remember}
                onChange={(event) => updateForm({ remember: event.target.value })}
                rows={2}
              />
            </div>

            <div className="person-view__edit-actions">
              <button type="button" className="person-view__save-button" onClick={() => void saveEdit()}>
                Save
              </button>
              <button type="button" className="person-view__ghost-button" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="person-view__facts">
            {showDate ? (
              <p className="person-view__when-met">{formatMetWhen(person.whenMet as Date)}</p>
            ) : null}
            {person.howMet ? (
              <p>
                <strong>How we met:</strong> {person.howMet}
              </p>
            ) : null}
            {person.whereMet ? (
              <p>
                <strong>Where:</strong> {person.whereMet}
              </p>
            ) : null}
            {person.whatConnectedUs ? (
              <p>
                <strong>What connected us:</strong> {person.whatConnectedUs}
              </p>
            ) : null}
            {person.organization ? (
              <p>
                <strong>Organization:</strong> {person.organization}
              </p>
            ) : null}
            {person.remember ? (
              <p>
                <strong>Remember:</strong> {person.remember}
              </p>
            ) : null}
            {!hasAnyContext ? <p className="person-view__empty">Nothing added yet.</p> : null}
          </div>
        )}
      </section>

      <section className="person-view__section" aria-label="Memories">
        <h2 className="person-view__section-title">Memories</h2>
        <div ref={composerRef}>
          <MemoryComposer personId={personId} />
        </div>
        <MemoryList personId={personId} />
      </section>

      <div className="person-view__actions" role="group" aria-label="Actions">
        <button type="button" className="person-view__action-button" onClick={handleAddMemory}>
          Add memory
        </button>
        <Composer person={{ id: personId, name: person.name, phone: person.phone }} />
        {person.phone && person.phone.trim() ? (
          <button
            type="button"
            className="person-view__action-button person-view__action-button--ghost"
            onClick={() => setTrueToneOpen(true)}
          >
            Need the right words?
          </button>
        ) : null}
        <button
          type="button"
          className="person-view__action-button person-view__action-button--ghost"
          onClick={() => setNextConnectOpen(true)}
        >
          Plan a next connect
        </button>
      </div>

      {trueToneOpen ? (
        <TrueTonePanel
          personName={person.name}
          personContext={person.remember || person.whatConnectedUs || person.howMet}
          onUseDraft={(text) => void handleUseTrueToneDraft(text)}
        />
      ) : null}

      <NextConnectSheet
        personId={personId}
        open={nextConnectOpen}
        onClose={() => setNextConnectOpen(false)}
      />
    </div>
  )
}

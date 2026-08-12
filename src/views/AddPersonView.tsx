import { useState } from 'react'
import type { FormEvent } from 'react'
import { createPerson } from '../data/people.repo'
import './AddPersonView.css'

// ---------------------------------------------------------------------
// WI-04 — Add a person (capture-first) + Date We Met.
//
// Design intent: adding someone should never feel like filling out a
// form. A name is the only thing this screen ever requires — every other
// field (phone, email, how/where you met, organization, what you'll
// remember) lives inside a collapsed "add more details" disclosure that
// the person never has to open. Saving with just a name takes exactly
// three interactions: focus the name field, type, tap Save.
//
// "Date we met" gets special treatment per spec: it defaults to today
// (a soft default, not something the user chose), can be edited to a
// real date, cleared back out, or explicitly marked "I don't know".
// `metDateIsExplicit` on the Person record distinguishes "user confirmed
// this date" (true) from "still just today's soft default, or genuinely
// unknown" (false) — see the doc comment on Person.metDateIsExplicit in
// src/data/db.ts.
// ---------------------------------------------------------------------

export interface AddPersonViewProps {
  /** Called with the new person's id after a successful save. */
  onDone?: (personId: number) => void
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

export default function AddPersonView({ onDone }: AddPersonViewProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [howMet, setHowMet] = useState('')
  const [whereMet, setWhereMet] = useState('')
  const [whatConnectedUs, setWhatConnectedUs] = useState('')
  const [organization, setOrganization] = useState('')
  const [remember, setRemember] = useState('')

  // Date we met state. `dateValue` is the raw <input type="date"> string
  // (yyyy-mm-dd). It starts pre-filled with today — a soft default the
  // user never had to choose, which is why `dateTouched` starts false.
  const [dateValue, setDateValue] = useState(() => toDateInputValue(new Date()))
  const [dateTouched, setDateTouched] = useState(false)
  const [dateUnknown, setDateUnknown] = useState(false)

  const [nameError, setNameError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleDateChange(value: string) {
    setDateValue(value)
    setDateTouched(true)
    setDateUnknown(false)
  }

  function handleClearDate() {
    setDateValue('')
    setDateTouched(true)
    setDateUnknown(false)
  }

  function handleToggleUnknown() {
    setDateUnknown((wasUnknown) => {
      const nowUnknown = !wasUnknown
      if (nowUnknown) {
        // Explicitly "I don't know" — no date, and not a confirmed one.
        setDateValue('')
        setDateTouched(false)
      } else {
        // Toggling back off returns to the soft today-default, not a
        // confirmed date.
        setDateValue(toDateInputValue(new Date()))
        setDateTouched(false)
      }
      return nowUnknown
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('Add a name to save')
      return
    }
    setNameError(null)

    const whenMet = dateUnknown || dateValue === '' ? null : fromDateInputValue(dateValue)
    const metDateIsExplicit = whenMet !== null && dateTouched

    setSaving(true)
    try {
      const id = await createPerson({
        name: trimmedName,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        howMet: howMet.trim() || undefined,
        whenMet,
        whereMet: whereMet.trim() || undefined,
        whatConnectedUs: whatConnectedUs.trim() || undefined,
        organization: organization.trim() || undefined,
        remember: remember.trim() || undefined,
        metDateIsExplicit,
      })
      onDone?.(id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="add-person" onSubmit={handleSubmit} noValidate>
      <h1 className="add-person__title">Add someone</h1>
      <p className="add-person__subtitle">Just a name is enough for now.</p>

      <div className="add-person__field">
        <label className="add-person__label" htmlFor="add-person-name">
          Name
        </label>
        <input
          id="add-person-name"
          className="add-person__input"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (nameError) setNameError(null)
          }}
          placeholder="Their name"
          autoFocus
          aria-required="true"
          aria-invalid={nameError ? 'true' : undefined}
          aria-describedby={nameError ? 'add-person-name-error' : undefined}
        />
        {nameError && (
          <p className="add-person__error" id="add-person-name-error" role="alert">
            {nameError}
          </p>
        )}
      </div>

      <div className="add-person__field">
        <span className="add-person__label" id="add-person-date-label">
          Date we met
        </span>
        <div className="add-person__date-row">
          <input
            className="add-person__input add-person__date-input"
            type="date"
            aria-label="Date we met"
            value={dateValue}
            disabled={dateUnknown}
            onChange={(event) => handleDateChange(event.target.value)}
          />
          <button
            type="button"
            className="add-person__ghost-button"
            onClick={handleClearDate}
            disabled={dateUnknown || dateValue === ''}
          >
            Clear
          </button>
          <button
            type="button"
            className="add-person__ghost-button"
            aria-pressed={dateUnknown}
            onClick={handleToggleUnknown}
          >
            {dateUnknown ? "Unknown ✓" : "I don't know"}
          </button>
        </div>
        <p className="add-person__hint">
          {dateUnknown
            ? "We won't track a met-date for this person."
            : dateTouched
              ? 'Confirmed.'
              : 'Defaults to today — change it any time.'}
        </p>
      </div>

      <details className="add-person__details">
        <summary className="add-person__summary">Add more details (optional)</summary>

        <div className="add-person__details-grid">
          <div className="add-person__field">
            <label className="add-person__label" htmlFor="add-person-phone">
              Phone
            </label>
            <input
              id="add-person-phone"
              className="add-person__input"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>

          <div className="add-person__field">
            <label className="add-person__label" htmlFor="add-person-email">
              Email
            </label>
            <input
              id="add-person-email"
              className="add-person__input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="add-person__field">
            <label className="add-person__label" htmlFor="add-person-how-met">
              How you met
            </label>
            <input
              id="add-person-how-met"
              className="add-person__input"
              type="text"
              value={howMet}
              onChange={(event) => setHowMet(event.target.value)}
            />
          </div>

          <div className="add-person__field">
            <label className="add-person__label" htmlFor="add-person-where-met">
              Where you met
            </label>
            <input
              id="add-person-where-met"
              className="add-person__input"
              type="text"
              value={whereMet}
              onChange={(event) => setWhereMet(event.target.value)}
            />
          </div>

          <div className="add-person__field">
            <label className="add-person__label" htmlFor="add-person-connected">
              What connected you
            </label>
            <input
              id="add-person-connected"
              className="add-person__input"
              type="text"
              value={whatConnectedUs}
              onChange={(event) => setWhatConnectedUs(event.target.value)}
            />
          </div>

          <div className="add-person__field">
            <label className="add-person__label" htmlFor="add-person-org">
              Organization
            </label>
            <input
              id="add-person-org"
              className="add-person__input"
              type="text"
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
            />
          </div>

          <div className="add-person__field add-person__field--wide">
            <label className="add-person__label" htmlFor="add-person-remember">
              Something to remember
            </label>
            <textarea
              id="add-person-remember"
              className="add-person__input add-person__textarea"
              value={remember}
              onChange={(event) => setRemember(event.target.value)}
              rows={2}
            />
          </div>
        </div>
      </details>

      {/*
        WI-13 ("What's Next?") entry point lands here — a prompt/sheet
        offering to schedule a next-connect right after save. Not built
        by this card; this comment marks where it hooks in once the new
        person's id is available (see `onDone` above).
      */}

      <button type="submit" className="add-person__save-button" disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

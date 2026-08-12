import { useEffect, useState } from 'react'
import { createNextConnect } from '../data/nextConnects.repo'
import type { NextConnectType } from '../data/nextConnects.repo'
import './NextConnectSheet.css'

// ---------------------------------------------------------------------
// WI-14 — Next Connect: a quiet way to jot down what's next with someone,
// never a task to check off.
//
// Design intent: nine calm options — eight concrete ways to next spend
// time with this person, plus "Not Yet" as a fully legitimate answer
// that saves nothing. Picking one of the eight optionally lets the user
// add a loose target date and/or a note, then saves a single planned
// `nextConnects` row. There's no urgency framing anywhere in here — no
// due dates, no overdue language, just "here's what we're thinking."
//
// Standalone: not mounted anywhere yet. A later integration pass mounts
// this from PersonView and wires WhatNextSheet's "Next Connect" option
// to open it.
// ---------------------------------------------------------------------

export interface NextConnectSheetProps {
  /** The person this plan is about. */
  personId: number
  /** Whether the sheet is currently visible. */
  open: boolean
  /** Called whenever the sheet closes, for any reason. */
  onClose: () => void
  /** Called after a plan is successfully saved (not called for "Not Yet"). */
  onSaved?: () => void
}

interface NextConnectOption {
  type: NextConnectType
  label: string
}

// Exact order and labels the acceptance test checks against.
export const NEXT_CONNECT_OPTIONS: NextConnectOption[] = [
  { type: 'coffee', label: 'Coffee' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'call', label: 'Call' },
  { type: 'meeting', label: 'Meeting' },
  { type: 'dinner', label: 'Dinner' },
  { type: 'activity', label: 'Activity' },
  { type: 'visit', label: 'Visit' },
  { type: 'other', label: 'Other' },
]

export const NOT_YET_LABEL = 'Not Yet'

function fromDateInputValue(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export default function NextConnectSheet({ personId, open, onClose, onSaved }: NextConnectSheetProps) {
  const [selected, setSelected] = useState<NextConnectOption | null>(null)
  const [dateValue, setDateValue] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset internal state whenever the sheet closes, so reopening it
  // always starts back at the picker rather than showing stale detail
  // from a previous pass.
  useEffect(() => {
    if (!open) {
      setSelected(null)
      setDateValue('')
      setNote('')
      setSaving(false)
    }
  }, [open])

  if (!open) return null

  function chooseOption(option: NextConnectOption) {
    setSelected(option)
  }

  function chooseNotYet() {
    onClose()
  }

  function goBack() {
    setSelected(null)
    setDateValue('')
    setNote('')
  }

  async function handleSave() {
    if (!selected || saving) return
    setSaving(true)
    try {
      await createNextConnect({
        personId,
        type: selected.type,
        targetDate: dateValue ? fromDateInputValue(dateValue) : undefined,
        note: note.trim() || undefined,
      })
      onSaved?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="next-connect-sheet__backdrop" onClick={onClose}>
      <div
        className="next-connect-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="next-connect-sheet-title"
        data-person-id={personId}
        onClick={(event) => event.stopPropagation()}
      >
        {!selected ? (
          <>
            <p className="next-connect-sheet__title" id="next-connect-sheet-title">
              What's next together?
            </p>
            <div className="next-connect-sheet__options">
              {NEXT_CONNECT_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  className="next-connect-sheet__option"
                  onClick={() => chooseOption(option)}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                className="next-connect-sheet__option next-connect-sheet__option--quiet"
                onClick={chooseNotYet}
              >
                {NOT_YET_LABEL}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="next-connect-sheet__title" id="next-connect-sheet-title">
              {selected.label}
            </p>
            <div className="next-connect-sheet__detail">
              <label className="next-connect-sheet__field-label" htmlFor="next-connect-sheet-date">
                Date (optional)
              </label>
              <input
                id="next-connect-sheet-date"
                className="next-connect-sheet__input"
                type="date"
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
              />

              <label className="next-connect-sheet__field-label" htmlFor="next-connect-sheet-note">
                Note (optional)
              </label>
              <textarea
                id="next-connect-sheet-note"
                className="next-connect-sheet__input next-connect-sheet__textarea"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
              />
            </div>
            <div className="next-connect-sheet__actions">
              <button
                type="button"
                className="next-connect-sheet__save-button"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                Save
              </button>
              <button type="button" className="next-connect-sheet__ghost-button" onClick={goBack}>
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

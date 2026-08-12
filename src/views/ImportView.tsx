import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  assignPeopleToCircle,
  findExistingMatch,
  importContactsDeduped,
  isContactPickerAvailable,
  parseVCards,
  pickContactsBatch,
} from '../data/import'
import type { ImportedContact } from '../data/import'
import { listPeople } from '../data/people.repo'
import type { Person } from '../data/people.repo'
import { createCircle, listCircles } from '../data/circles.repo'
import type { Circle } from '../data/circles.repo'
import './ImportView.css'

// ---------------------------------------------------------------------
// WI-06 — Bring My People (contact import).
//
// Deliberately selective, never a wholesale dump: contacts only ever
// enter the staged checklist below through an explicit user action —
// either the browser's own native contact-picker selection UI (one
// batch at a time) or a .vcf file the user chose to upload. Nothing in
// this view reads and imports an entire address book on its own, and
// every staged contact can be unchecked before it's ever written to the
// database.
//
// Standalone view: no navigation/route wiring here (that's a later
// integration pass) and no dependency on CircleView.tsx — circle
// assignment goes straight through circles.repo.ts / the
// assignPeopleToCircle helper in data/import.ts.
// ---------------------------------------------------------------------

interface StagedContact {
  key: string
  contact: ImportedContact
  selected: boolean
}

let stagedKeySeq = 0
function toStaged(contact: ImportedContact): StagedContact {
  stagedKeySeq += 1
  return { key: `staged-${stagedKeySeq}`, contact, selected: true }
}

function ImportView() {
  const pickerAvailable = useMemo(() => isContactPickerAvailable(), [])

  const [staged, setStaged] = useState<StagedContact[]>([])
  const [existingPeople, setExistingPeople] = useState<Person[]>([])
  const [picking, setPicking] = useState(false)
  const [pickerNotice, setPickerNotice] = useState<string | null>(null)

  const [importedPeople, setImportedPeople] = useState<Person[]>([])
  const [importStatus, setImportStatus] = useState<string | null>(null)

  const [circles, setCircles] = useState<Circle[]>([])
  const [selectedForCircle, setSelectedForCircle] = useState<Set<number>>(new Set())
  const [targetCircleId, setTargetCircleId] = useState('')
  const [quickCircleName, setQuickCircleName] = useState('')
  const [assignStatus, setAssignStatus] = useState<string | null>(null)

  async function refreshPeopleAndCircles() {
    const [people, circleList] = await Promise.all([listPeople(), listCircles()])
    setExistingPeople(people)
    setCircles(circleList)
  }

  useEffect(() => {
    void refreshPeopleAndCircles()
  }, [])

  const selectedStagedCount = staged.filter((s) => s.selected).length

  function toggleStaged(key: string) {
    setStaged((prev) => prev.map((s) => (s.key === key ? { ...s, selected: !s.selected } : s)))
  }

  function removeStaged(key: string) {
    setStaged((prev) => prev.filter((s) => s.key !== key))
  }

  function appendStaged(contacts: ImportedContact[]) {
    if (contacts.length === 0) return
    setStaged((prev) => [...prev, ...contacts.map(toStaged)])
  }

  async function handlePickBatch() {
    setPickerNotice(null)
    setPicking(true)
    try {
      const picked = await pickContactsBatch(true)
      if (picked.length === 0) {
        setPickerNotice('No contacts were picked from that batch.')
      } else {
        appendStaged(picked)
      }
    } finally {
      setPicking(false)
    }
  }

  async function handleVcfUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const text = await file.text()
    const parsed = parseVCards(text)
    if (parsed.length === 0) {
      setPickerNotice("That file didn't contain any contacts we could read.")
    } else {
      setPickerNotice(null)
      appendStaged(parsed)
    }
  }

  async function handleImportSelected() {
    const toImport = staged.filter((s) => s.selected).map((s) => s.contact)
    if (toImport.length === 0) return

    const result = await importContactsDeduped(toImport)

    if (result.created.length > 0) {
      setImportedPeople((prev) => [...prev, ...result.created])
    }

    const parts: string[] = []
    if (result.created.length > 0) {
      parts.push(`Added ${result.created.length} ${result.created.length === 1 ? 'person' : 'people'}.`)
    }
    if (result.skipped.length > 0) {
      parts.push(
        `${result.skipped.length} ${result.skipped.length === 1 ? 'was' : 'were'} already in your people, so ${
          result.skipped.length === 1 ? "it wasn't" : "they weren't"
        } added again.`,
      )
    }
    setImportStatus(parts.join(' '))

    // Clear only the contacts that were just imported (kept ones stay staged).
    setStaged((prev) => prev.filter((s) => !s.selected))
    await refreshPeopleAndCircles()
  }

  function toggleForCircle(id: number) {
    setSelectedForCircle((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleQuickCreateCircle() {
    const name = quickCircleName.trim()
    if (!name) return
    const id = await createCircle({ name })
    setQuickCircleName('')
    await refreshPeopleAndCircles()
    setTargetCircleId(String(id))
  }

  async function handleAssignToCircle() {
    if (targetCircleId === '' || selectedForCircle.size === 0) return
    const personIds = Array.from(selectedForCircle)
    const circleId = Number(targetCircleId)
    await assignPeopleToCircle(personIds, circleId)

    const circleName = circles.find((c) => c.id === circleId)?.name ?? 'the circle'
    setAssignStatus(
      `Added ${personIds.length} ${personIds.length === 1 ? 'person' : 'people'} to ${circleName}.`,
    )
    setSelectedForCircle(new Set())
    await refreshPeopleAndCircles()
  }

  return (
    <div className="import-view">
      <section className="import-view__section">
        <h1 className="import-view__title">Bring My People</h1>
        <p className="import-view__subtitle">Who belongs in your Circle Nurture?</p>
        <p className="import-view__hint">
          This is meant to be selective, not a wholesale dump of your address book — pick the people
          you actually want to stay close to, a few at a time.
        </p>

        {pickerAvailable ? (
          <div className="import-view__picker">
            <button
              type="button"
              onClick={handlePickBatch}
              disabled={picking}
              className="import-view__btn import-view__btn--primary"
            >
              {picking ? 'Choosing…' : 'Choose contacts'}
            </button>
            <p className="import-view__note">
              Opens your phone's contact picker. Choose one batch, then tap "Choose contacts" again
              for more.
            </p>
          </div>
        ) : (
          <div className="import-view__picker">
            <p className="import-view__note">
              This browser can't open your contacts directly (that's normal on iPhone/Safari). You
              can upload a .vcf contact file instead, or skip this entirely.
            </p>
            <label className="import-view__file-label" htmlFor="import-vcf-input">
              Upload a .vcf file
            </label>
            <input
              id="import-vcf-input"
              type="file"
              accept=".vcf,text/vcard,text/x-vcard"
              onChange={(e) => void handleVcfUpload(e)}
              className="import-view__file-input"
            />
            <p className="import-view__note">
              Or don't import anything —{' '}
              <a className="import-view__link" href="#/add-person">
                add people one at a time
              </a>{' '}
              whenever it's easiest.
            </p>
          </div>
        )}

        {pickerNotice && <p className="import-view__notice">{pickerNotice}</p>}
      </section>

      {staged.length > 0 && (
        <section className="import-view__section">
          <h2 className="import-view__subtitle-2">
            Ready to add ({selectedStagedCount} of {staged.length} selected)
          </h2>

          <ul className="import-view__checklist">
            {staged.map((s) => {
              const dupe = findExistingMatch(existingPeople, s.contact)
              return (
                <li key={s.key} className="import-view__checklist-row">
                  <label className="import-view__checkbox-label">
                    <input
                      type="checkbox"
                      checked={s.selected}
                      onChange={() => toggleStaged(s.key)}
                    />
                    <span className="import-view__contact-name">{s.contact.name}</span>
                    {s.contact.phone && (
                      <span className="import-view__contact-detail">{s.contact.phone}</span>
                    )}
                    {s.contact.email && (
                      <span className="import-view__contact-detail">{s.contact.email}</span>
                    )}
                    {dupe && <span className="import-view__dupe-tag">already have this person</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeStaged(s.key)}
                    className="import-view__btn import-view__btn--ghost"
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={handleImportSelected}
            disabled={selectedStagedCount === 0}
            className="import-view__btn import-view__btn--primary"
          >
            Add {selectedStagedCount > 0 ? selectedStagedCount : ''} to Circle Nurture
          </button>

          {importStatus && <p className="import-view__status">{importStatus}</p>}
        </section>
      )}

      {importedPeople.length > 0 && (
        <section className="import-view__section">
          <h2 className="import-view__subtitle-2">Add them to a circle</h2>

          {circles.length === 0 && (
            <p className="import-view__hint">
              Start with one circle — something like "Close Friends" — you can always make more
              later.
            </p>
          )}

          <ul className="import-view__checklist">
            {importedPeople.map((person) => (
              <li key={person.id} className="import-view__checklist-row">
                <label className="import-view__checkbox-label">
                  <input
                    type="checkbox"
                    checked={person.id != null && selectedForCircle.has(person.id)}
                    onChange={() => person.id != null && toggleForCircle(person.id)}
                  />
                  <span className="import-view__contact-name">{person.name}</span>
                </label>
              </li>
            ))}
          </ul>

          <div className="import-view__circle-controls">
            {circles.length === 0 ? (
              <>
                <input
                  type="text"
                  value={quickCircleName}
                  onChange={(e) => setQuickCircleName(e.target.value)}
                  placeholder="New circle name"
                  aria-label="New circle name"
                  className="import-view__input"
                />
                <button type="button" onClick={handleQuickCreateCircle} className="import-view__btn">
                  Create circle
                </button>
              </>
            ) : (
              <>
                <select
                  value={targetCircleId}
                  onChange={(e) => setTargetCircleId(e.target.value)}
                  aria-label="Circle to add selected people to"
                  className="import-view__select"
                >
                  <option value="">Add to circle…</option>
                  {circles.map((circle) => (
                    <option key={circle.id} value={circle.id}>
                      {circle.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignToCircle}
                  disabled={selectedForCircle.size === 0 || targetCircleId === ''}
                  className="import-view__btn import-view__btn--primary"
                >
                  Add {selectedForCircle.size > 0 ? selectedForCircle.size : ''} to circle
                </button>
              </>
            )}
          </div>

          {assignStatus && <p className="import-view__status">{assignStatus}</p>}
        </section>
      )}
    </div>
  )
}

export default ImportView

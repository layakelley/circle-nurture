import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createCircle, listCircles, updateCircle } from '../data/circles.repo'
import type { Circle } from '../data/circles.repo'
import { listCircleMembers, removeMembership } from '../data/circleMembers.repo'
import type { CircleMember } from '../data/circleMembers.repo'
import { listPeople } from '../data/people.repo'
import type { Person } from '../data/people.repo'
import { addPersonToCircle, bulkAddPeopleToCircle, deleteCircleCascade } from './circles.logic'
import './CircleView.css'

// ---------------------------------------------------------------------
// WI-05 — Circles.
//
// Circles are purely organizational: create/rename/delete circles, view
// and edit membership, and bulk-assign several people to a circle at
// once. A person can belong to any number of circles simultaneously.
//
// This view intentionally contains no messaging: no SMS deep links, no
// "send" / "blast" language. That's WI-10's job entirely.
// ---------------------------------------------------------------------

function CircleView() {
  const [circles, setCircles] = useState<Circle[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [memberships, setMemberships] = useState<CircleMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null)

  const [newCircleName, setNewCircleName] = useState('')
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [addExistingPersonId, setAddExistingPersonId] = useState('')

  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<number>>(new Set())
  const [bulkTargetCircleId, setBulkTargetCircleId] = useState('')
  const [bulkSecondaryCircleId, setBulkSecondaryCircleId] = useState('')
  const [bulkStatus, setBulkStatus] = useState<string | null>(null)

  async function refresh() {
    const [c, p, m] = await Promise.all([listCircles(), listPeople(), listCircleMembers()])
    setCircles(c)
    setPeople(p)
    setMemberships(m)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const selectedCircle = useMemo(
    () => circles.find((c) => c.id === selectedCircleId) ?? null,
    [circles, selectedCircleId],
  )

  const membersOfSelected = useMemo(() => {
    if (selectedCircleId == null) return []
    const memberPersonIds = new Set(
      memberships.filter((m) => m.circleId === selectedCircleId).map((m) => m.personId),
    )
    return people.filter((p) => p.id != null && memberPersonIds.has(p.id))
  }, [memberships, people, selectedCircleId])

  const nonMembersOfSelected = useMemo(() => {
    const memberIds = new Set(membersOfSelected.map((p) => p.id))
    return people.filter((p) => !memberIds.has(p.id))
  }, [people, membersOfSelected])

  async function handleCreateCircle(event: FormEvent) {
    event.preventDefault()
    const name = newCircleName.trim()
    if (!name) return
    const id = await createCircle({ name })
    setNewCircleName('')
    await refresh()
    setSelectedCircleId(id)
  }

  function startRename(circle: Circle) {
    setRenamingId(circle.id ?? null)
    setRenameValue(circle.name)
  }

  function cancelRename() {
    setRenamingId(null)
    setRenameValue('')
  }

  async function commitRename(id: number) {
    const name = renameValue.trim()
    if (name) {
      await updateCircle(id, { name })
    }
    setRenamingId(null)
    setRenameValue('')
    await refresh()
  }

  async function handleConfirmDelete(id: number) {
    await deleteCircleCascade(id)
    setConfirmDeleteId(null)
    if (selectedCircleId === id) setSelectedCircleId(null)
    await refresh()
  }

  async function handleRemoveFromCircle(personId: number) {
    if (selectedCircleId == null) return
    await removeMembership(personId, selectedCircleId)
    await refresh()
  }

  async function handleAddExistingPerson() {
    if (selectedCircleId == null || addExistingPersonId === '') return
    await addPersonToCircle(Number(addExistingPersonId), selectedCircleId)
    setAddExistingPersonId('')
    await refresh()
  }

  function togglePersonSelected(id: number) {
    setSelectedPersonIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkAssign() {
    if (bulkTargetCircleId === '' || selectedPersonIds.size === 0) return
    const personIds = Array.from(selectedPersonIds)
    const targetId = Number(bulkTargetCircleId)
    await bulkAddPeopleToCircle(personIds, targetId)

    const secondaryId = bulkSecondaryCircleId === '' ? null : Number(bulkSecondaryCircleId)
    const addedSecondary = secondaryId != null && secondaryId !== targetId
    if (addedSecondary) {
      await bulkAddPeopleToCircle(personIds, secondaryId)
    }

    const targetName = circles.find((c) => c.id === targetId)?.name ?? 'the circle'
    setBulkStatus(
      `Added ${personIds.length} ${personIds.length === 1 ? 'person' : 'people'} to ${targetName}` +
        (addedSecondary ? ' and one more circle.' : '.'),
    )
    setSelectedPersonIds(new Set())
    setBulkTargetCircleId('')
    setBulkSecondaryCircleId('')
    await refresh()
  }

  if (loading) {
    return (
      <div className="circle-view">
        <p className="circle-view__loading">Loading circles…</p>
      </div>
    )
  }

  return (
    <div className="circle-view">
      <section className="circle-view__section">
        <h1 className="circle-view__title">Circles</h1>

        <form className="circle-view__create-form" onSubmit={handleCreateCircle}>
          <input
            type="text"
            value={newCircleName}
            onChange={(e) => setNewCircleName(e.target.value)}
            placeholder="New circle name"
            aria-label="New circle name"
            className="circle-view__input"
          />
          <button type="submit" className="circle-view__btn circle-view__btn--primary">
            Create circle
          </button>
        </form>

        {circles.length === 0 ? (
          <p className="circle-view__empty">No circles yet — create your first one above.</p>
        ) : (
          <ul className="circle-view__circle-list">
            {circles.map((circle) => {
              const memberCount = memberships.filter((m) => m.circleId === circle.id).length
              const isRenaming = renamingId === circle.id
              const isConfirmingDelete = confirmDeleteId === circle.id
              return (
                <li key={circle.id} className="circle-view__circle-row">
                  {isRenaming ? (
                    <span className="circle-view__rename-group">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        aria-label={`Rename ${circle.name}`}
                        className="circle-view__input"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => circle.id != null && commitRename(circle.id)}
                        className="circle-view__btn"
                      >
                        Save
                      </button>
                      <button type="button" onClick={cancelRename} className="circle-view__btn circle-view__btn--ghost">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={
                          selectedCircleId === circle.id
                            ? 'circle-view__circle-name circle-view__circle-name--selected'
                            : 'circle-view__circle-name'
                        }
                        onClick={() => setSelectedCircleId(circle.id ?? null)}
                      >
                        {circle.name}
                        <span className="circle-view__member-count"> · {memberCount}</span>
                      </button>
                      <span className="circle-view__circle-actions">
                        <button
                          type="button"
                          onClick={() => startRename(circle)}
                          className="circle-view__btn circle-view__btn--ghost"
                        >
                          Rename
                        </button>
                        {isConfirmingDelete ? (
                          <span className="circle-view__confirm-group">
                            <span className="circle-view__confirm-text">Delete &ldquo;{circle.name}&rdquo;?</span>
                            <button
                              type="button"
                              onClick={() => circle.id != null && handleConfirmDelete(circle.id)}
                              className="circle-view__btn circle-view__btn--danger"
                            >
                              Yes, delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="circle-view__btn circle-view__btn--ghost"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(circle.id ?? null)}
                            className="circle-view__btn circle-view__btn--ghost"
                          >
                            Delete
                          </button>
                        )}
                      </span>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {selectedCircle && (
        <section className="circle-view__section">
          <h2 className="circle-view__subtitle">{selectedCircle.name}</h2>

          {membersOfSelected.length === 0 ? (
            <p className="circle-view__empty">No one in this circle yet.</p>
          ) : (
            <ul className="circle-view__person-list">
              {membersOfSelected.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  onRemove={() => person.id != null && handleRemoveFromCircle(person.id)}
                />
              ))}
            </ul>
          )}

          {nonMembersOfSelected.length > 0 && (
            <div className="circle-view__add-existing">
              <select
                value={addExistingPersonId}
                onChange={(e) => setAddExistingPersonId(e.target.value)}
                aria-label="Add a person to this circle"
                className="circle-view__select"
              >
                <option value="">Add a person…</option>
                {nonMembersOfSelected.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAddExistingPerson} className="circle-view__btn">
                Add
              </button>
            </div>
          )}
        </section>
      )}

      {people.length > 0 && circles.length > 0 && (
        <section className="circle-view__section">
          <h2 className="circle-view__subtitle">Bulk-assign people to a circle</h2>

          <ul className="circle-view__bulk-list">
            {people.map((person) => (
              <li key={person.id} className="circle-view__bulk-row">
                <label className="circle-view__checkbox-label">
                  <input
                    type="checkbox"
                    checked={person.id != null && selectedPersonIds.has(person.id)}
                    onChange={() => person.id != null && togglePersonSelected(person.id)}
                  />
                  {person.name}
                </label>
              </li>
            ))}
          </ul>

          <div className="circle-view__bulk-controls">
            <select
              value={bulkTargetCircleId}
              onChange={(e) => setBulkTargetCircleId(e.target.value)}
              aria-label="Circle to add selected people to"
              className="circle-view__select"
            >
              <option value="">Add to circle…</option>
              {circles.map((circle) => (
                <option key={circle.id} value={circle.id}>
                  {circle.name}
                </option>
              ))}
            </select>

            <select
              value={bulkSecondaryCircleId}
              onChange={(e) => setBulkSecondaryCircleId(e.target.value)}
              aria-label="Optionally also add to another circle"
              className="circle-view__select"
            >
              <option value="">Also add to another circle (optional)…</option>
              {circles
                .filter((c) => String(c.id) !== bulkTargetCircleId)
                .map((circle) => (
                  <option key={circle.id} value={circle.id}>
                    {circle.name}
                  </option>
                ))}
            </select>

            <button
              type="button"
              onClick={handleBulkAssign}
              disabled={selectedPersonIds.size === 0 || bulkTargetCircleId === ''}
              className="circle-view__btn circle-view__btn--primary"
            >
              Add {selectedPersonIds.size > 0 ? selectedPersonIds.size : ''} to circle
            </button>
          </div>

          {bulkStatus && <p className="circle-view__status">{bulkStatus}</p>}
        </section>
      )}
    </div>
  )
}

function PersonRow({ person, onRemove }: { person: Person; onRemove: () => void }) {
  return (
    <li className="circle-view__person-row">
      <span className="circle-view__person-name">{person.name}</span>
      <button type="button" onClick={onRemove} className="circle-view__btn circle-view__btn--ghost">
        Remove from circle
      </button>
    </li>
  )
}

export default CircleView

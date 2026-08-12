import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { listMemoriesByPerson, updateMemory, deleteMemory } from '../data/memories.repo'
import type { Memory } from '../data/memories.repo'
import './MemoryList.css'

// ---------------------------------------------------------------------
// WI-07 — Memories, jotted down: the list.
//
// Live, newest-first, with inline edit/delete/pin. Pure capture — there
// is deliberately no due/overdue/reminder concept anywhere near memories;
// a pin is just "keep this one near the top of my attention," never an
// obligation.
//
// `useLiveQuery` (same pattern as HomeView.tsx) re-runs `listMemoriesByPerson`
// whenever the memories table changes, so edits/deletes/pins from
// anywhere (including this component's own actions) reflect immediately
// without any manual refetch/state-sync.
//
// Standalone: not mounted anywhere yet. A future card (WI-08's profile
// view) mounts this against a real personId.
// ---------------------------------------------------------------------

export interface MemoryListProps {
  personId: number
}

const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const WEEK = DAY * 7

/**
 * Soft, human timestamp copy — "3 days ago" rather than a raw ISO
 * timestamp. Exported so the exact copy can be unit-tested directly.
 * Falls back to a plain "Month Day, Year" date once something is more
 * than a week old, where relative phrasing stops being useful.
 */
export function formatMemoryTime(date: Date, now: Date = new Date()): string {
  const diffSeconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000))

  if (diffSeconds < MINUTE) return 'just now'

  if (diffSeconds < HOUR) {
    const minutes = Math.round(diffSeconds / MINUTE)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  if (diffSeconds < DAY) {
    const hours = Math.round(diffSeconds / HOUR)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  if (diffSeconds < WEEK) {
    const days = Math.round(diffSeconds / DAY)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function MemoryList({ personId }: MemoryListProps) {
  // `listMemoriesByPerson` already returns newest-first; that ordering is
  // preserved as-is here rather than re-sorted by pinned state, so pinning
  // is purely a visual marker, never a reordering/priority mechanic.
  const memories = useLiveQuery(() => listMemoriesByPerson(personId), [personId]) ?? []

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  function startEdit(memory: Memory) {
    if (memory.id === undefined) return
    setEditingId(memory.id)
    setEditText(memory.text)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
  }

  async function saveEdit(id: number) {
    const trimmed = editText.trim()
    if (!trimmed) return
    await updateMemory(id, { text: trimmed })
    setEditingId(null)
    setEditText('')
  }

  async function handleDelete(id: number) {
    await deleteMemory(id)
    if (editingId === id) cancelEdit()
  }

  async function togglePin(memory: Memory) {
    if (memory.id === undefined) return
    await updateMemory(memory.id, { pinned: !memory.pinned })
  }

  if (memories.length === 0) {
    return <p className="memory-list__empty">No memories jotted down yet.</p>
  }

  return (
    <ul className="memory-list">
      {memories.map((memory) => {
        if (memory.id === undefined) return null
        const id = memory.id
        const isEditing = editingId === id

        return (
          <li key={id} className="memory-list__item">
            {isEditing ? (
              <div className="memory-list__edit">
                <textarea
                  className="memory-list__edit-input"
                  value={editText}
                  onChange={(event) => setEditText(event.target.value)}
                  rows={2}
                  autoFocus
                  aria-label="Edit memory"
                />
                <div className="memory-list__actions">
                  <button
                    type="button"
                    className="memory-list__button"
                    onClick={() => void saveEdit(id)}
                    disabled={!editText.trim()}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="memory-list__button memory-list__button--ghost"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="memory-list__text">{memory.text}</p>
                <div className="memory-list__meta">
                  <span className="memory-list__time">{formatMemoryTime(memory.createdAt)}</span>
                  {memory.pinned ? <span className="memory-list__pinned-badge">Pinned</span> : null}
                </div>
                <div className="memory-list__actions">
                  <button
                    type="button"
                    className="memory-list__button"
                    aria-pressed={memory.pinned ? 'true' : 'false'}
                    onClick={() => void togglePin(memory)}
                  >
                    {memory.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button type="button" className="memory-list__button" onClick={() => startEdit(memory)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="memory-list__button memory-list__button--ghost"
                    onClick={() => void handleDelete(id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}

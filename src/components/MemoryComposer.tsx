import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { createMemory } from '../data/memories.repo'
import './MemoryComposer.css'

// ---------------------------------------------------------------------
// WI-07 — Memories, jotted down: the quick-capture composer.
//
// Design intent: jotting a memory should never feel like a form. One
// text field, one save action — reachable in <=2 interactions (the field
// autofocuses, so "type, tap Save" is the whole flow; a mouse user's
// "click field, type" collapses into a single interaction the same way
// WI-04's name field does).
//
// Standalone: not mounted anywhere yet. A future card (WI-08's profile
// view) mounts this against a real personId.
// ---------------------------------------------------------------------

export interface MemoryComposerProps {
  /** The person this memory belongs to. */
  personId: number
  /** Called after a memory is successfully saved. */
  onSaved?: () => void
}

export default function MemoryComposer({ personId, onSaved }: MemoryComposerProps) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    const trimmed = text.trim()
    if (!trimmed || saving) return

    setSaving(true)
    try {
      await createMemory({ personId, text: trimmed })
      setText('')
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void save()
  }

  // Enter-to-save (without Shift, which stays a plain newline) keeps the
  // whole flow to a single tap-free path for anyone who prefers it —
  // never required, just available.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void save()
    }
  }

  return (
    <form className="memory-composer" onSubmit={handleSubmit}>
      <label className="memory-composer__label" htmlFor="memory-composer-text">
        Jot a memory
      </label>
      <textarea
        id="memory-composer-text"
        className="memory-composer__input"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Something worth remembering…"
        rows={2}
        autoFocus
      />
      <button
        type="submit"
        className="memory-composer__save-button"
        disabled={saving || !text.trim()}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

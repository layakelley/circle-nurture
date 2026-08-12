import { useState } from 'react'
import { draftMessages, getStoredApiKey } from '../utils/llm'
import './TrueTonePanel.css'

// ---------------------------------------------------------------------
// WI-18 — TrueTone: optional AI drafting assist for the message composer.
//
// Design intent: the user says what they mean, TrueTone drafts a few
// SHORT versions preserving their own meaning/tone/voice, the user
// reviews and edits before anything is sent. This panel NEVER sends a
// message and NEVER navigates anywhere — it only ever hands finished
// text back to the caller via `onUseDraft`. The caller (e.g. Composer)
// decides what happens next; tapping Send in the phone's own messenger
// is always a separate, later, explicit user action elsewhere.
//
// Must work completely without a key too: a plain, calm explanation of
// how to add one in Settings (a later card) — never a raw error, never
// a blank/broken state. Likewise, a failed draft call must never block
// normal messaging — the user can always just type their own message.
//
// Standalone: not mounted anywhere yet. A later integration step (the
// conductor) adds a key field to Settings and mounts this next to
// Composer.
// ---------------------------------------------------------------------

export interface TrueTonePanelProps {
  /** The one person this message is going to. */
  personName: string
  /** Optional light context (e.g. how they met, what to remember) to help TrueTone stay relevant. */
  personContext?: string
  /**
   * Called with the final (possibly user-edited) draft text when the user
   * taps "Use this". This is the ONLY way this component ever hands text
   * back out — it never sends, never navigates, never auto-submits.
   */
  onUseDraft: (text: string) => void
}

export default function TrueTonePanel({ personName, personContext, onUseDraft }: TrueTonePanelProps) {
  const [hasKey, setHasKey] = useState<boolean>(() => Boolean(getStoredApiKey()))
  const [intent, setIntent] = useState('')
  const [drafts, setDrafts] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleDraftIt() {
    const apiKey = getStoredApiKey()
    if (!apiKey) {
      setHasKey(false)
      return
    }
    if (!intent.trim() || loading) return

    setLoading(true)
    setErrorMessage(null)
    try {
      const results = await draftMessages({
        intent: intent.trim(),
        personName,
        personContext,
        apiKey,
      })
      setDrafts(results)
    } catch {
      // Plain-language, non-technical: TrueTone failing must never block
      // normal messaging, so we never surface a raw error here.
      setErrorMessage(
        "TrueTone couldn't draft anything just now. You can try again, or just type your own message — that always works.",
      )
      setDrafts(null)
    } finally {
      setLoading(false)
    }
  }

  function handleDraftChange(index: number, value: string) {
    setDrafts((previous) => {
      if (!previous) return previous
      const next = [...previous]
      next[index] = value
      return next
    })
  }

  function handleUseDraft(index: number) {
    const text = drafts?.[index] ?? ''
    onUseDraft(text)
  }

  if (!hasKey) {
    return (
      <div className="truetone-panel truetone-panel--no-key">
        <p className="truetone-panel__title">Need the right words?</p>
        <p className="truetone-panel__explainer">
          TrueTone can draft a few short message options in your own voice — you just say what
          you mean, and it does the wording. It needs your own API key first, though. Add one in
          Settings, then come back here. Until then, you can always just type your own message.
        </p>
      </div>
    )
  }

  return (
    <div className="truetone-panel">
      <p className="truetone-panel__title">Need the right words?</p>

      <label className="truetone-panel__label" htmlFor="truetone-intent">
        What do you want to say to {personName}?
      </label>
      <textarea
        id="truetone-intent"
        className="truetone-panel__intent"
        value={intent}
        onChange={(event) => setIntent(event.target.value)}
        placeholder="Say it in your own words — e.g. checking in, glad we caught up last week"
        rows={2}
      />

      <button
        type="button"
        className="truetone-panel__draft-button"
        onClick={() => void handleDraftIt()}
        disabled={loading || !intent.trim()}
      >
        {loading ? 'Drafting…' : 'Draft it'}
      </button>

      {errorMessage && <p className="truetone-panel__error">{errorMessage}</p>}

      {drafts && drafts.length > 0 && (
        <div className="truetone-panel__drafts">
          {drafts.map((draft, index) => (
            <div className="truetone-panel__draft" key={index}>
              <textarea
                className="truetone-panel__draft-text"
                value={draft}
                onChange={(event) => handleDraftChange(index, event.target.value)}
                aria-label={`Draft ${index + 1}`}
                rows={2}
              />
              <button
                type="button"
                className="truetone-panel__use-button"
                onClick={() => handleUseDraft(index)}
              >
                Use this
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

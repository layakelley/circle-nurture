import { useState } from 'react'
import { downloadExport } from '../utils/export'
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey } from '../utils/llm'

// ---------------------------------------------------------------------
// Settings — export/backup + the privacy statement.
//
// Standalone view. Not yet wired into App.tsx/navigation — that's a
// separate integration step. This file only needs to render correctly
// on its own and expose a default export.
// ---------------------------------------------------------------------

type ExportStatus = 'idle' | 'exporting' | 'done' | 'error'

export default function SettingsView() {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredApiKey() ?? '')
  const [keySaved, setKeySaved] = useState(false)

  function handleSaveKey() {
    if (apiKeyInput.trim()) {
      setStoredApiKey(apiKeyInput)
      setKeySaved(true)
    } else {
      clearStoredApiKey()
      setKeySaved(false)
    }
  }

  function handleClearKey() {
    clearStoredApiKey()
    setApiKeyInput('')
    setKeySaved(false)
  }

  async function handleExport() {
    setStatus('exporting')
    try {
      await downloadExport()
      setStatus('done')
    } catch (err) {
      console.error('Export failed:', err)
      setStatus('error')
    }
  }

  return (
    <div className="settings-view">
      <h1>Settings</h1>

      <section className="settings-section" aria-labelledby="export-heading">
        <h2 id="export-heading">Export my data</h2>
        <p>
          Get a copy of everything you've saved in Circle Nurture — every person, circle,
          memory, and note — as a single file you can keep for yourself.
        </p>
        <button type="button" onClick={handleExport} disabled={status === 'exporting'}>
          {status === 'exporting' ? 'Preparing your export…' : 'Export my data'}
        </button>
        {status === 'done' && <p role="status">Your export downloaded. It's just a file — keep it somewhere safe.</p>}
        {status === 'error' && (
          <p role="alert">Something went wrong preparing that export. Please try again.</p>
        )}
      </section>

      <section className="settings-section" aria-labelledby="truetone-heading">
        <h2 id="truetone-heading">TrueTone (optional)</h2>
        <p>
          TrueTone can help draft the right words when you're not sure what to say. It's
          entirely optional — messaging works fine without it. To use it, add your own
          OpenAI-compatible API key here; it's stored only on this device and used only when
          you ask TrueTone to draft something.
        </p>
        <label htmlFor="truetone-api-key" className="settings-label">
          API key
        </label>
        <input
          id="truetone-api-key"
          type="password"
          value={apiKeyInput}
          onChange={(event) => {
            setApiKeyInput(event.target.value)
            setKeySaved(false)
          }}
          placeholder="sk-…"
          autoComplete="off"
        />
        <div className="settings-truetone-actions">
          <button type="button" onClick={handleSaveKey}>
            Save key
          </button>
          <button type="button" onClick={handleClearKey}>
            Remove key
          </button>
        </div>
        {keySaved && <p role="status">Key saved on this device.</p>}
      </section>

      <section className="settings-section" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading">Your privacy</h2>
        <p>
          Everything you type into Circle Nurture — every person, every memory, every note —
          stays on this device. There's no account to create and no cloud it's synced to,
          because it isn't synced anywhere at all.
        </p>
        <p>
          Nothing you enter is ever uploaded, sold, or watched. We don't run analytics or
          trackers, so we genuinely don't know how you use this app — that's by design, not
          an oversight.
        </p>
        <p>
          The one exception: if you ever choose to turn on an optional AI-assisted drafting
          feature in the future, the specific text you ask it to help with would be sent to
          that AI service just for that one request — and only when you've opted in. Nothing
          else leaves your device, ever.
        </p>
        <p>
          In short: no account, no cloud, no analytics. This is your circle, kept where you
          keep it.
        </p>
      </section>
    </div>
  )
}

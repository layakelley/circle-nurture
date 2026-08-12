// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import TrueTonePanel from '../src/components/TrueTonePanel'
import { TRUETONE_API_KEY_STORAGE_KEY } from '../src/utils/llm'

// ---------------------------------------------------------------------
// WI-18 acceptance tests.
//
// TrueTone is an OPTIONAL AI drafting assist: it only ever hands
// editable draft text back via `onUseDraft`. It must NEVER send a
// message or navigate anywhere itself, must work gracefully with no key
// stored, and a failed draft call must never block normal messaging.
// ---------------------------------------------------------------------

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function openAiResponse(content: string) {
  return { choices: [{ message: { content } }] }
}

// Node's own experimental global `localStorage` (present in the Node
// version running these tests) shadows jsdom's real, spec-correct
// localStorage — vitest's jsdom environment deliberately leaves any
// global that already exists in the Node process alone. So instead of
// relying on ambient `localStorage`, each test gets its own small
// in-memory Storage stand-in via `vi.stubGlobal`, which fully replaces
// whatever `localStorage` currently resolves to (for both bare
// `localStorage` and `window.localStorage`, since `window` is `globalThis`
// in this environment) — exercising the exact same `getStoredApiKey` /
// `localStorage.getItem` code path the real browser build uses.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('TrueTonePanel — no API key stored', () => {
  it('shows a plain, calm explanation instead of an error or blank screen', () => {
    render(
      <TrueTonePanel personName="Jamie Chen" onUseDraft={vi.fn()} />,
    )

    // A calm explanation, mentioning Settings — never a raw error string.
    expect(screen.getByText('Need the right words?')).toBeInTheDocument()
    expect(screen.getByText(/api key/i)).toBeInTheDocument()
    expect(screen.getByText(/settings/i)).toBeInTheDocument()
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument()
    // No drafting UI should be offered without a key.
    expect(screen.queryByRole('button', { name: /draft it/i })).not.toBeInTheDocument()
  })
})

describe('TrueTonePanel — drafting with a stored key', () => {
  it('produces 2-3 draft versions from a mocked successful response, rendered as editable text', async () => {
    window.localStorage.setItem(TRUETONE_API_KEY_STORAGE_KEY, 'sk-test-key')
    const fetchMock = mockFetchOnce(
      openAiResponse(JSON.stringify(['Hey! Thinking of you.', "It's been a while — how are you?"])),
    )

    const user = userEvent.setup()
    render(<TrueTonePanel personName="Jamie Chen" onUseDraft={vi.fn()} />)

    await user.type(screen.getByLabelText(/what do you want to say/i), 'check in on them')
    await user.click(screen.getByRole('button', { name: /draft it/i }))

    await waitFor(() => {
      expect(screen.getByLabelText('Draft 1')).toBeInTheDocument()
    })

    const draft1 = screen.getByLabelText('Draft 1') as HTMLTextAreaElement
    const draft2 = screen.getByLabelText('Draft 2') as HTMLTextAreaElement

    expect(draft1.value).toBe('Hey! Thinking of you.')
    expect(draft2.value).toBe("It's been a while — how are you?")
    expect(screen.queryByLabelText('Draft 3')).not.toBeInTheDocument()

    // Drafts render as editable text, not read-only labels.
    expect(draft1).not.toHaveAttribute('readonly')
    expect(draft1).not.toBeDisabled()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/chat/completions')
    expect((options as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer sk-test-key',
    })
  })

  it('lets the user edit a draft and "Use this" hands the edited text to onUseDraft, with no send/navigation from this component', async () => {
    window.localStorage.setItem(TRUETONE_API_KEY_STORAGE_KEY, 'sk-test-key')
    mockFetchOnce(openAiResponse(JSON.stringify(['Original draft one.', 'Original draft two.'])))

    const onUseDraft = vi.fn()
    const originalHref = window.location.href
    const user = userEvent.setup()

    render(<TrueTonePanel personName="Jamie Chen" onUseDraft={onUseDraft} />)

    await user.type(screen.getByLabelText(/what do you want to say/i), 'check in on them')
    await user.click(screen.getByRole('button', { name: /draft it/i }))

    await waitFor(() => {
      expect(screen.getByLabelText('Draft 1')).toBeInTheDocument()
    })

    const draft1 = screen.getByLabelText('Draft 1') as HTMLTextAreaElement
    await user.clear(draft1)
    await user.type(draft1, 'My own edited version.')

    const useButtons = screen.getAllByRole('button', { name: 'Use this' })
    await user.click(useButtons[0])

    expect(onUseDraft).toHaveBeenCalledTimes(1)
    expect(onUseDraft).toHaveBeenCalledWith('My own edited version.')

    // The whole point of this component: it hands text back via the
    // callback and does nothing else. No navigation, no sms: URL, no
    // change to the page location.
    expect(window.location.href).toBe(originalHref)
  })

  it('only the single draft-generation call ever leaves the device — no other network/tracking calls fire', async () => {
    window.localStorage.setItem(TRUETONE_API_KEY_STORAGE_KEY, 'sk-test-key')
    const fetchMock = mockFetchOnce(openAiResponse(JSON.stringify(['Draft A.', 'Draft B.'])))

    const onUseDraft = vi.fn()
    const user = userEvent.setup()

    render(<TrueTonePanel personName="Jamie Chen" onUseDraft={onUseDraft} />)

    await user.type(screen.getByLabelText(/what do you want to say/i), 'check in on them')
    await user.click(screen.getByRole('button', { name: /draft it/i }))

    await waitFor(() => {
      expect(screen.getByLabelText('Draft 1')).toBeInTheDocument()
    })

    await user.click(screen.getAllByRole('button', { name: 'Use this' })[0])

    expect(onUseDraft).toHaveBeenCalledTimes(1)
    // Exactly one network call total, for the whole interaction — the one
    // draft-generation request. Nothing else (no telemetry, no separate
    // "send" request) ever fires from this component.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('TrueTonePanel — network/API failure', () => {
  it('shows a plain-language failure message (not a crash) and lets the user keep typing their own message', async () => {
    window.localStorage.setItem(TRUETONE_API_KEY_STORAGE_KEY, 'sk-test-key')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    const user = userEvent.setup()
    render(<TrueTonePanel personName="Jamie Chen" onUseDraft={vi.fn()} />)

    const intentBox = screen.getByLabelText(/what do you want to say/i)
    await user.type(intentBox, 'check in on them')
    await user.click(screen.getByRole('button', { name: /draft it/i }))

    await waitFor(() => {
      expect(screen.getByText(/couldn't draft anything|type your own message/i)).toBeInTheDocument()
    })

    // No raw error/stack text, no crash — the panel is still usable: the
    // intent box is still there and still editable.
    expect(screen.queryByText(/TypeError/i)).not.toBeInTheDocument()
    expect(intentBox).toBeInTheDocument()
    await user.type(intentBox, ' still typing fine')
    expect((intentBox as HTMLTextAreaElement).value).toContain('still typing fine')
  })

  it('a non-ok HTTP response also shows a plain failure message, not a raw status dump', async () => {
    window.localStorage.setItem(TRUETONE_API_KEY_STORAGE_KEY, 'sk-test-key')
    mockFetchOnce({}, false, 401)

    const user = userEvent.setup()
    render(<TrueTonePanel personName="Jamie Chen" onUseDraft={vi.fn()} />)

    await user.type(screen.getByLabelText(/what do you want to say/i), 'check in on them')
    await user.click(screen.getByRole('button', { name: /draft it/i }))

    await waitFor(() => {
      expect(screen.getByText(/couldn't draft anything|type your own message/i)).toBeInTheDocument()
    })
    expect(screen.queryByLabelText('Draft 1')).not.toBeInTheDocument()
  })
})

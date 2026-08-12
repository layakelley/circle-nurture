// ---------------------------------------------------------------------
// WI-18 — TrueTone: optional AI drafting assist.
//
// This module talks to an OpenAI-compatible chat completions endpoint
// using a key the user supplies and stores themselves (on-device only,
// in localStorage — never IndexedDB/Dexie, never sent anywhere but the
// single endpoint below). It ONLY ever returns draft text; nothing in
// this file sends a message, navigates, or triggers any side effect
// beyond the one network call it's explicitly asked to make. Sending a
// message is always a separate, later, explicit user action elsewhere.
// ---------------------------------------------------------------------

const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

// A small, inexpensive default model. Some OpenAI-compatible providers
// accept this name directly; others map/ignore it. Since the input shape
// here intentionally has no `model` field (keeping the on-device surface
// minimal), this is the one place that choice lives.
const DEFAULT_MODEL = 'gpt-4o-mini'

export const TRUETONE_API_KEY_STORAGE_KEY = 'circleNurture.trueTone.apiKey'

export interface DraftMessagesInput {
  /** What the user wants to say, in their own words. */
  intent: string
  /** The one person this message is going to. */
  personName: string
  /** Optional light context (e.g. how they met, what to remember) to help TrueTone stay relevant — never invented, only what's already known. */
  personContext?: string
  /** The user's own OpenAI-compatible API key, read from localStorage by the caller. */
  apiKey: string
  /** Override for OpenAI-compatible providers other than OpenAI itself. Defaults to OpenAI's chat completions endpoint. */
  endpoint?: string
}

/**
 * Calls an OpenAI-compatible chat completions endpoint and returns 2-3
 * short draft message variations expressing the user's stated intent to
 * the named person, in the user's own voice — never inventing feelings,
 * plans, or details the user didn't state.
 *
 * Always resolves to at least one draft, or throws a plain-language Error
 * the caller can show directly to the user.
 */
export async function draftMessages(input: DraftMessagesInput): Promise<string[]> {
  const { intent, personName, personContext, apiKey, endpoint } = input

  if (!apiKey || !apiKey.trim()) {
    throw new Error('TrueTone needs an API key before it can draft anything.')
  }
  if (!intent || !intent.trim()) {
    throw new Error('TrueTone needs to know what you want to say before it can draft anything.')
  }

  const resolvedEndpoint = endpoint && endpoint.trim() ? endpoint.trim() : DEFAULT_ENDPOINT

  const systemPrompt = [
    "You help someone draft a short personal text message.",
    "You are given the sender's own stated intent — what they want to say, in their own words — and the name (and optional light context) of the one person they are messaging.",
    'Write 2 to 3 SHORT alternative drafts of the message, each just a sentence or two.',
    "Preserve the sender's own voice and stated meaning exactly — do not invent feelings, plans, apologies, or details the sender did not state.",
    'Do not add greetings, sign-offs, or explanations unless the intent implies them.',
    'Respond with ONLY a JSON array of 2 to 3 plain strings, one per draft, and nothing else — no markdown, no numbering, no extra keys, no commentary.',
  ].join(' ')

  const contextLine =
    personContext && personContext.trim() ? ` Some light context about them: ${personContext.trim()}.` : ''

  const userPrompt = `I want to message ${personName}. Here is what I want to say, in my own words: "${intent.trim()}".${contextLine} Draft 2-3 short versions of a message that says this, in my voice.`

  let response: Response
  try {
    response = await fetch(resolvedEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
  } catch {
    throw new Error('TrueTone could not reach the drafting service — check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error(`TrueTone's drafting service returned an error (status ${response.status}).`)
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error('TrueTone received an unreadable response from the drafting service.')
  }

  const content = extractContent(data)
  if (!content || !content.trim()) {
    throw new Error('TrueTone did not receive any draft text back.')
  }

  const drafts = parseDrafts(content)
  if (drafts.length === 0) {
    throw new Error('TrueTone could not make sense of the drafts it received.')
  }

  return drafts.slice(0, 3)
}

/** Pulls `choices[0].message.content` out of an OpenAI-shaped response body, defensively. */
function extractContent(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const choices = (data as { choices?: unknown }).choices
  if (!Array.isArray(choices) || choices.length === 0) return undefined
  const first = choices[0]
  if (!first || typeof first !== 'object') return undefined
  const message = (first as { message?: unknown }).message
  if (!message || typeof message !== 'object') return undefined
  const content = (message as { content?: unknown }).content
  return typeof content === 'string' ? content : undefined
}

/**
 * Parses the model's raw text into 2-3 plain-text drafts, defensively:
 * a clean JSON array is tried first, then numbered-line lists, then
 * blank-line-separated paragraphs, then finally the whole response as a
 * single draft. Always returns at least one item when `content` is
 * non-empty, and never throws — callers check `.length === 0` instead.
 */
function parseDrafts(content: string): string[] {
  const trimmed = content.trim()
  if (!trimmed) return []

  const jsonCandidate = stripCodeFence(trimmed)
  const fromJson = tryParseJsonArray(jsonCandidate)
  if (fromJson && fromJson.length > 0) return fromJson

  const looksNumbered = /^\s*\d+[.)]/m.test(trimmed)
  if (looksNumbered) {
    const numberedLines = trimmed
      .split(/\n+/)
      .map((line) => line.replace(/^\s*[-*]?\s*\d+[.)]\s*/, '').trim())
      .filter(Boolean)
    if (numberedLines.length > 0) return dedupe(numberedLines)
  }

  const byBlankLine = trimmed
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
  if (byBlankLine.length > 1) return dedupe(byBlankLine)

  return [trimmed]
}

function stripCodeFence(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return match ? match[1].trim() : text
}

function tryParseJsonArray(text: string): string[] | undefined {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return undefined
  }

  if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
    const cleaned = (parsed as string[]).map((item) => item.trim()).filter(Boolean)
    return cleaned.length > 0 ? cleaned : undefined
  }

  if (parsed && typeof parsed === 'object') {
    for (const key of ['drafts', 'messages', 'options', 'variations']) {
      const value = (parsed as Record<string, unknown>)[key]
      if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
        const cleaned = (value as string[]).map((item) => item.trim()).filter(Boolean)
        if (cleaned.length > 0) return cleaned
      }
    }
  }

  return undefined
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item)
      result.push(item)
    }
  }
  return result
}

// ---------------------------------------------------------------------
// On-device API key storage. Deliberately localStorage, not IndexedDB —
// this is a single small string, not app data, and localStorage keeps it
// simple. A later card (Settings) is responsible for the UI that reads
// and writes this.
// ---------------------------------------------------------------------

/** Reads the user's stored TrueTone API key, or null if none is set. Never throws. */
export function getStoredApiKey(): string | null {
  try {
    const value = window.localStorage.getItem(TRUETONE_API_KEY_STORAGE_KEY)
    return value && value.trim() ? value.trim() : null
  } catch {
    return null
  }
}

/** Stores (or clears, when given an empty string) the user's TrueTone API key. Never throws. */
export function setStoredApiKey(key: string): void {
  try {
    const trimmed = key.trim()
    if (trimmed) {
      window.localStorage.setItem(TRUETONE_API_KEY_STORAGE_KEY, trimmed)
    } else {
      window.localStorage.removeItem(TRUETONE_API_KEY_STORAGE_KEY)
    }
  } catch {
    // localStorage may be unavailable (e.g. private browsing); fail quietly —
    // TrueTone simply falls back to its no-key explanation.
  }
}

/** Removes the stored TrueTone API key entirely. Never throws. */
export function clearStoredApiKey(): void {
  try {
    window.localStorage.removeItem(TRUETONE_API_KEY_STORAGE_KEY)
  } catch {
    // ignore
  }
}

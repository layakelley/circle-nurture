import { useState } from 'react'
import { createConnectionLog } from '../data/connectionLog.repo'
import './Composer.css'

// ---------------------------------------------------------------------
// WI-09 — Message one person: the single-recipient message launcher.
//
// Design intent: one tap opens the phone's native SMS composer,
// pre-addressed to exactly ONE person — never a group thread, never a
// comma-joined list of numbers. That "exactly one recipient" property is
// the whole point of this card, so `buildSmsUrl` below builds the
// `sms:` URL from a single `phone: string` parameter (not an array), and
// nothing in this file ever joins multiple numbers into one URL.
//
// The `body` prefill here is intentionally minimal (empty/optional) —
// AI-drafted message text is WI-18, a later card. This card just needs
// to get the user into their composer, addressed correctly, in one tap.
//
// Standalone: not mounted anywhere yet. A future integration step mounts
// this against a real person in PersonView.
// ---------------------------------------------------------------------

export interface ComposerPerson {
  id: number
  name: string
  phone?: string
}

export interface ComposerProps {
  person: ComposerPerson
  /** Called after a successful launch (phone existed, sms: URL was triggered). */
  onSent?: () => void
}

/**
 * Builds an `sms:` URL (RFC 5724) addressed to exactly one recipient.
 *
 * `phone` is a single string, not an array — there is no code path in
 * this file that joins multiple phone numbers into one URL, which is
 * what would produce a group thread instead of a 1:1 message.
 *
 * iOS and Android/most browsers disagree about whether the body param
 * should be introduced with `?` or `&` when a number is present; both
 * accept `?` when nothing precedes it, so we always start with `?` here
 * (there's never anything else in the URL before it) and rely on the
 * platform's SMS handler to interpret it — the separator logic exists
 * only to insert `&` instead of a second `?` if this function is ever
 * extended to add more query params.
 */
export function buildSmsUrl(phone: string, body?: string): string {
  const url = `sms:${phone}`
  if (body === undefined || body === '') return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}body=${encodeURIComponent(body)}`
}

/**
 * Triggers navigation to an `sms:` URL. A plain exported function's
 * internal call sites don't reliably route through `vi.spyOn` on the
 * module namespace (depends on the ESM transform in play), so this is
 * instead a method on a shared object — the component calls
 * `smsNavigation.navigate(...)`, and tests spy on that same object
 * reference, guaranteeing the spy actually intercepts the call without
 * a real navigation occurring in jsdom.
 */
export const smsNavigation = {
  navigate(url: string): void {
    window.location.href = url
  },
}

export default function Composer({ person, onSent }: ComposerProps) {
  const [sending, setSending] = useState(false)

  const hasPhone = Boolean(person.phone && person.phone.trim())

  async function handleMessage() {
    if (!hasPhone || sending) return
    const phone = person.phone!.trim()

    setSending(true)
    try {
      const url = buildSmsUrl(phone)
      smsNavigation.navigate(url)
      await createConnectionLog({ personId: person.id, kind: 'message' })
      onSent?.()
    } finally {
      setSending(false)
    }
  }

  if (!hasPhone) {
    return (
      <p className="composer__guard">
        Add a phone number to message {person.name}
      </p>
    )
  }

  return (
    <button
      type="button"
      className="composer__message-button"
      onClick={() => void handleMessage()}
      disabled={sending}
    >
      Message {person.name}
    </button>
  )
}

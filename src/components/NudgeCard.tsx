import './NudgeCard.css'

export interface NudgeCardProps {
  /** The person's name, dropped into the gentle message. */
  name: string
  /** Called when the person quietly dismisses this nudge. */
  onDismiss?: () => void
  /** Optional quiet call-to-action, e.g. "log a connection" / "say hi". */
  onConnect?: () => void
  /** Label for the optional connect action. Defaults to "Say hi". */
  connectLabel?: string
}

/**
 * A soft, warm, non-urgent reminder that it's been a while since we
 * connected with someone — the opposite of a CRM "overdue" alert.
 *
 * Deliberately excludes anything that could read as judgment: no counts,
 * no streaks, no percentages, no "you failed to..." language. Purely a
 * gentle, factual observation with a quiet way to act on it or dismiss it.
 *
 * Standalone: not mounted anywhere yet. A future integration pass wires
 * this into Home against real `getPeopleNeedingNudge()` results.
 */
export default function NudgeCard({ name, onDismiss, onConnect, connectLabel = 'Say hi' }: NudgeCardProps) {
  return (
    <article className="nudge-card">
      <div className="nudge-card__body">
        <p className="nudge-card__message">
          It&apos;s been a little while since you and {name} connected.
        </p>
        {onConnect ? (
          <div className="nudge-card__actions">
            <button type="button" className="nudge-card__action" onClick={onConnect}>
              {connectLabel}
            </button>
          </div>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          className="nudge-card__dismiss"
          onClick={onDismiss}
          aria-label={`Dismiss reminder about ${name}`}
        >
          ✕
        </button>
      ) : null}
    </article>
  )
}

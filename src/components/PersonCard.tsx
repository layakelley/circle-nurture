import CircleChip from './CircleChip'
import './PersonCard.css'

export interface PersonCardCircle {
  id: number
  name: string
}

export interface PersonCardProps {
  /** Person's name. */
  name: string
  /** One-line human context, e.g. how you met or a memorable detail.
   *  Omitted entirely (no placeholder) when there isn't one yet. */
  context?: string
  /** Circles this person belongs to, rendered as chips. */
  circles?: PersonCardCircle[]
  /** Optional tap handler — when present, the whole card becomes a
   *  button (e.g. to open this person's profile). Omit to keep the
   *  card purely presentational, as in earlier callers. */
  onClick?: () => void
}

/**
 * A reusable, purely-presentational card for a single person. No Dexie
 * import — all data arrives via props, so this component has no idea
 * where it came from (repo, mock, test fixture, ...).
 */
export default function PersonCard({ name, context, circles = [], onClick }: PersonCardProps) {
  const content = (
    <>
      <p className="person-card__name">{name}</p>
      {context ? <p className="person-card__context">{context}</p> : null}
      {circles.length > 0 ? (
        <div className="person-card__circles">
          {circles.map((circle) => (
            <CircleChip key={circle.id} name={circle.name} />
          ))}
        </div>
      ) : null}
    </>
  )

  if (onClick) {
    return (
      <button type="button" className="person-card person-card--tappable" onClick={onClick}>
        {content}
      </button>
    )
  }

  return <article className="person-card">{content}</article>
}

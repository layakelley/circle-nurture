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
}

/**
 * A reusable, purely-presentational card for a single person. No Dexie
 * import — all data arrives via props, so this component has no idea
 * where it came from (repo, mock, test fixture, ...).
 */
export default function PersonCard({ name, context, circles = [] }: PersonCardProps) {
  return (
    <article className="person-card">
      <p className="person-card__name">{name}</p>
      {context ? <p className="person-card__context">{context}</p> : null}
      {circles.length > 0 ? (
        <div className="person-card__circles">
          {circles.map((circle) => (
            <CircleChip key={circle.id} name={circle.name} />
          ))}
        </div>
      ) : null}
    </article>
  )
}

import './CircleChip.css'

export interface CircleChipProps {
  /** Circle display name. */
  name: string
  /** Tap handler, provided by the caller. Optional so CircleChip can also be
   *  used as a passive display chip (e.g. nested inside PersonCard). */
  onClick?: () => void
}

/**
 * A small warm chip/tile representing one circle. Purely presentational —
 * no Dexie import, no data fetching. Callers pass in the name and, when the
 * chip should be tappable, an onClick handler.
 */
export default function CircleChip({ name, onClick }: CircleChipProps) {
  return (
    <button type="button" className="circle-chip" onClick={onClick}>
      {name}
    </button>
  )
}

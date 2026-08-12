import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { listNextConnectsByPerson, updateNextConnect } from '../data/nextConnects.repo'
import type { NextConnectType } from '../data/nextConnects.repo'
import { createConnectionLog } from '../data/connectionLog.repo'
import './NextConnectSummary.css'

// ---------------------------------------------------------------------
// WI-14 — Next Connect: the quiet display half.
//
// Shows the person's current planned Next Connect, if any, stated as a
// plain fact ("Coffee — Aug 20" / "Coffee — no date set") — never with
// overdue/urgent styling, even when the target date has already passed.
// A "Mark done" action logs the meet-up (a `connectionLog` row with
// `kind: 'meet'`) and flips the plan's status to 'done', at which point
// it stops being "current" and this component quietly renders nothing.
//
// Standalone: not mounted anywhere yet. A later integration pass mounts
// this from PersonView alongside NextConnectSheet.
// ---------------------------------------------------------------------

export interface NextConnectSummaryProps {
  personId: number
}

const TYPE_LABELS: Record<NextConnectType, string> = {
  coffee: 'Coffee',
  lunch: 'Lunch',
  call: 'Call',
  meeting: 'Meeting',
  dinner: 'Dinner',
  activity: 'Activity',
  visit: 'Visit',
  other: 'Other',
  none: 'Not Yet',
}

/**
 * "Coffee — Aug 20" / "Coffee — no date set" — a plain stated fact, no
 * day-count or "in N days" framing. Exported so the exact copy can be
 * unit-tested directly.
 */
export function formatNextConnect(type: NextConnectType, targetDate?: Date): string {
  const label = TYPE_LABELS[type]
  if (!targetDate) return `${label} — no date set`
  const formatted = targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${label} — ${formatted}`
}

export default function NextConnectSummary({ personId }: NextConnectSummaryProps) {
  const [marking, setMarking] = useState(false)

  const plans = useLiveQuery(() => listNextConnectsByPerson(personId), [personId])
  const plan = plans?.find((row) => row.status === 'planned')

  async function handleMarkDone() {
    if (!plan?.id || marking) return
    setMarking(true)
    try {
      await createConnectionLog({ personId, kind: 'meet' })
      await updateNextConnect(plan.id, { status: 'done' })
    } finally {
      setMarking(false)
    }
  }

  if (!plan) return null

  return (
    <div className="next-connect-summary">
      <p className="next-connect-summary__text">{formatNextConnect(plan.type, plan.targetDate)}</p>
      <button
        type="button"
        className="next-connect-summary__done-button"
        onClick={() => void handleMarkDone()}
        disabled={marking}
      >
        Mark done
      </button>
    </div>
  )
}

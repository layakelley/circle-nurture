import { useEffect, useState } from 'react'
import { getLastConnected } from '../data/connectionLog.repo'

export interface LastConnectedLabelProps {
  personId: number
}

/**
 * "August 2026" style formatting — month + year only, no day/time
 * precision. Exported (in addition to the default component export) so
 * the exact copy the component renders can be unit-tested directly.
 */
export function formatLastConnected(date: Date | null): string {
  if (!date) return 'No connection logged yet'
  const formatted = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  return `Last connected: ${formatted}`
}

/**
 * Displays when we last connected with a person, as a plain stated fact —
 * never a score, streak, percentage, or "overdue" judgment. Renders
 * "Last connected: <Month Year>" or "No connection logged yet" when the
 * person has no connectionLog rows.
 *
 * Standalone: not mounted anywhere yet. A future card (WI-08's profile
 * view) mounts this against a real personId.
 */
export default function LastConnectedLabel({ personId }: LastConnectedLabelProps) {
  const [lastConnected, setLastConnected] = useState<Date | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    void getLastConnected(personId).then((date) => {
      if (cancelled) return
      setLastConnected(date)
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [personId])

  if (!loaded) return null

  return <span className="last-connected-label">{formatLastConnected(lastConnected)}</span>
}

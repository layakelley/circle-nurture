import LastConnectedLabel from './LastConnectedLabel'
import './ContextStrip.css'

export interface ContextStripProps {
  personId: number
}

// ---------------------------------------------------------------------
// WI-08 (foundation) / WI-17 (full behavior) — the context strip.
//
// Per the master spec this is a small, quiet ≤3-line strip surfaced near
// the top of a person's profile: last-connected, a remembered detail,
// the most recent memory, and any upcoming next-connect — never a score
// or an "overdue" judgment, just plain stated facts.
//
// This card (WI-08) only wires up the ONE fact that already exists
// end-to-end: last-connected, via LastConnectedLabel (WI-12). It's kept
// as its own standalone component (rather than inlined into PersonView)
// specifically so WI-17 can fill in the remaining lines here later
// without touching PersonView at all.
// ---------------------------------------------------------------------

export default function ContextStrip({ personId }: ContextStripProps) {
  return (
    <div className="context-strip" aria-label="At a glance">
      <LastConnectedLabel personId={personId} />
      {/*
        WI-17 fills in the rest of this strip here, still capped at
        ≤3 lines total:
          - a remembered detail (Person.remember)
          - the most recent memory (memories.repo — newest row)
          - an upcoming next-connect (nextConnects.repo — next planned)
      */}
    </div>
  )
}

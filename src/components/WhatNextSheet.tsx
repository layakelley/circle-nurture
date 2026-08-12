import './WhatNextSheet.css'

// ---------------------------------------------------------------------
// WI-13 — What's Next?: a lightweight decision sheet.
//
// Design intent: after adding someone or logging an interaction, offer
// a quiet moment of "what would you like to do now" — never a task
// list, never anything that implies backlog, overdue counts, or
// obligation. Four calm options, one of which is explicitly "Nothing
// Yet" — doing nothing is always a fully legitimate answer here, with
// no guilt attached.
//
// Standalone: not mounted anywhere yet. A later integration pass wires
// this into AddPersonView (after a successful add) and PersonView
// (after a logged interaction).
// ---------------------------------------------------------------------

export interface WhatNextSheetProps {
  /** The person this sheet is about. */
  personId: number
  /** The person's name, used in the sheet's copy. */
  personName: string
  /** Whether the sheet is currently visible. */
  open: boolean
  /** Called whenever the sheet closes, for any reason (including picking an option). */
  onClose: () => void
  /** Called when "Send a Message" is chosen. */
  onSendMessage?: () => void
  /** Called when "Next Connect" is chosen. */
  onNextConnect?: () => void
  /** Called when "Add a Memory" is chosen. */
  onAddMemory?: () => void
}

export default function WhatNextSheet({
  personId,
  personName,
  open,
  onClose,
  onSendMessage,
  onNextConnect,
  onAddMemory,
}: WhatNextSheetProps) {
  if (!open) return null

  function choose(action?: () => void) {
    action?.()
    onClose()
  }

  return (
    <div className="what-next-sheet__backdrop" onClick={onClose}>
      <div
        className="what-next-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="what-next-sheet-title"
        data-person-id={personId}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="what-next-sheet__title" id="what-next-sheet-title">
          What would you like to do with {personName}?
        </p>
        <div className="what-next-sheet__options">
          <button
            type="button"
            className="what-next-sheet__option"
            onClick={() => choose(onSendMessage)}
          >
            Send a Message
          </button>
          <button
            type="button"
            className="what-next-sheet__option"
            onClick={() => choose(onNextConnect)}
          >
            Next Connect
          </button>
          <button
            type="button"
            className="what-next-sheet__option"
            onClick={() => choose(onAddMemory)}
          >
            Add a Memory
          </button>
          <button
            type="button"
            className="what-next-sheet__option what-next-sheet__option--quiet"
            onClick={() => choose()}
          >
            Nothing Yet
          </button>
        </div>
      </div>
    </div>
  )
}

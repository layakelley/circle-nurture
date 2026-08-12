// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import WhatNextSheet from '../src/components/WhatNextSheet'

// ---------------------------------------------------------------------
// WI-13 acceptance tests.
//
// WhatNextSheet is a lightweight decision sheet, not a task manager:
// it offers four calm options, one of which is "Nothing Yet" — a fully
// legitimate answer with no follow-on callback and no guilt language.
// ---------------------------------------------------------------------

afterEach(() => {
  cleanup()
})

// Phrases that would turn this into a task-manager / backlog surface.
// None of these — nor bare digits implying a count — may ever appear
// in the rendered sheet.
const FORBIDDEN_PATTERNS = [
  /overdue/i,
  /past due/i,
  /\btask(s)?\b/i,
  /\bto-?do(s)?\b/i,
  /\bchecklist\b/i,
  /\breminder(s)?\b/i,
  /\bbacklog\b/i,
  /\bpending\b/i,
  /\d/, // any digit — a count, a streak, a day tally
]

describe('WhatNextSheet — open state renders all four options', () => {
  it('shows all four options, with the person\'s name in the prompt, when open', () => {
    render(
      <WhatNextSheet
        personId={1}
        personName="Jamie Chen"
        open={true}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText(/Jamie Chen/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send a Message' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next Connect' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add a Memory' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nothing Yet' })).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(
      <WhatNextSheet
        personId={1}
        personName="Jamie Chen"
        open={false}
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Send a Message' })).not.toBeInTheDocument()
  })
})

describe('WhatNextSheet — each option routes to its callback and closes', () => {
  it('"Send a Message" calls onSendMessage and onClose, but not the other callbacks', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSendMessage = vi.fn()
    const onNextConnect = vi.fn()
    const onAddMemory = vi.fn()

    render(
      <WhatNextSheet
        personId={1}
        personName="Jamie Chen"
        open={true}
        onClose={onClose}
        onSendMessage={onSendMessage}
        onNextConnect={onNextConnect}
        onAddMemory={onAddMemory}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Send a Message' }))

    expect(onSendMessage).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onNextConnect).not.toHaveBeenCalled()
    expect(onAddMemory).not.toHaveBeenCalled()
  })

  it('"Next Connect" calls onNextConnect and onClose, but not the other callbacks', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSendMessage = vi.fn()
    const onNextConnect = vi.fn()
    const onAddMemory = vi.fn()

    render(
      <WhatNextSheet
        personId={1}
        personName="Jamie Chen"
        open={true}
        onClose={onClose}
        onSendMessage={onSendMessage}
        onNextConnect={onNextConnect}
        onAddMemory={onAddMemory}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Next Connect' }))

    expect(onNextConnect).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSendMessage).not.toHaveBeenCalled()
    expect(onAddMemory).not.toHaveBeenCalled()
  })

  it('"Add a Memory" calls onAddMemory and onClose, but not the other callbacks', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSendMessage = vi.fn()
    const onNextConnect = vi.fn()
    const onAddMemory = vi.fn()

    render(
      <WhatNextSheet
        personId={1}
        personName="Jamie Chen"
        open={true}
        onClose={onClose}
        onSendMessage={onSendMessage}
        onNextConnect={onNextConnect}
        onAddMemory={onAddMemory}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add a Memory' }))

    expect(onAddMemory).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSendMessage).not.toHaveBeenCalled()
    expect(onNextConnect).not.toHaveBeenCalled()
  })

  it('"Nothing Yet" calls only onClose — no other callback fires', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSendMessage = vi.fn()
    const onNextConnect = vi.fn()
    const onAddMemory = vi.fn()

    render(
      <WhatNextSheet
        personId={1}
        personName="Jamie Chen"
        open={true}
        onClose={onClose}
        onSendMessage={onSendMessage}
        onNextConnect={onNextConnect}
        onAddMemory={onAddMemory}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Nothing Yet' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSendMessage).not.toHaveBeenCalled()
    expect(onNextConnect).not.toHaveBeenCalled()
    expect(onAddMemory).not.toHaveBeenCalled()
  })

  it('works with no optional callbacks supplied at all — every option safely just closes', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <WhatNextSheet personId={1} personName="Jamie Chen" open={true} onClose={onClose} />,
    )

    await user.click(screen.getByRole('button', { name: 'Send a Message' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('WhatNextSheet — no task-manager framing anywhere', () => {
  it('never renders overdue/count/checklist/task-manager language', () => {
    const { container } = render(
      <WhatNextSheet
        personId={1}
        personName="Jamie Chen"
        open={true}
        onClose={vi.fn()}
        onSendMessage={vi.fn()}
        onNextConnect={vi.fn()}
        onAddMemory={vi.fn()}
      />,
    )

    const rendered = container.textContent ?? ''

    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(rendered).not.toMatch(pattern)
    }
  })
})

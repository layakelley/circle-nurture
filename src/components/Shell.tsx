import type { ReactNode } from 'react'

interface ShellProps {
  children: ReactNode
}

/**
 * App shell wrapper. Applies safe-area-inset padding (via the
 * `.app-shell` class in src/styles/base.css) so content never renders
 * under a device notch, the Dynamic Island, or the home-indicator strip.
 * Every screen in the app renders inside this wrapper.
 */
export function Shell({ children }: ShellProps) {
  return <div className="app-shell">{children}</div>
}

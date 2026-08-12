import { NavLink } from 'react-router-dom'
import './BottomNav.css'

/**
 * A quiet, minimal bottom tab bar — Home / Circles / Settings. Deliberately
 * plain: no badges, no counts, no red dots. Person-level actions (message,
 * blast, memories) live inside their own screens, not up here.
 */
export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="primary">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`}
      >
        Home
      </NavLink>
      <NavLink
        to="/circles"
        className={({ isActive }) => `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`}
      >
        Circles
      </NavLink>
      <NavLink
        to="/settings"
        className={({ isActive }) => `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`}
      >
        Settings
      </NavLink>
    </nav>
  )
}

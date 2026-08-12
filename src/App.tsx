import { HashRouter } from 'react-router-dom'
import { Shell } from './components/Shell'
import { BottomNav } from './components/BottomNav'
import { AppRoutes } from './router'
import './App.css'

// ---------------------------------------------------------------------
// Integration layer: mounts the router inside the safe-area-aware shell,
// with a quiet bottom nav for Home / Circles / Settings. HashRouter (not
// BrowserRouter): GitHub Pages (WI-21) is a static host with no server-
// side rewrite for deep links, so hash-based routes avoid 404s on
// refresh/direct-load without extra 404.html tricks.
//
// Individual screens (Home, Add Person, Circles, Settings) are each
// built and tested standalone by their own work items; this file's only
// job is wiring them together into one navigable app.
// ---------------------------------------------------------------------

function App() {
  return (
    <Shell>
      <HashRouter>
        <div className="app-frame">
          <div className="app-frame__content">
            <AppRoutes />
          </div>
          <BottomNav />
        </div>
      </HashRouter>
    </Shell>
  )
}

export default App

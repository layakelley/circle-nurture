import { Shell } from './components/Shell'
import './App.css'

// ---------------------------------------------------------------------
// Routing lands here in a later card (WI-08 and friends wire up views
// for Home / Person / Circle / Blast / Memories / Settings). For now
// this is a single calm placeholder home screen so the shell is real
// and installable from day one.
// ---------------------------------------------------------------------

function App() {
  return (
    <Shell>
      <main className="home-placeholder">
        <h1 className="home-placeholder__title">Circle Nurture</h1>
        <p className="home-placeholder__subtitle">
          your people and circles will appear here
        </p>
      </main>
    </Shell>
  )
}

export default App

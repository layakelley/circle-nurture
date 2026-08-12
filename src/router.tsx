import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import HomeView from './views/HomeView'
import AddPersonView from './views/AddPersonView'
import CircleView from './views/CircleView'
import SettingsView from './views/SettingsView'
import ImportView from './views/ImportView'
import PersonView from './views/PersonView'

// ---------------------------------------------------------------------
// Integration layer wiring the standalone views built by separate work
// items into one navigable app. The <HashRouter> itself lives in
// App.tsx (so BottomNav can share the same router context); this file
// just declares which view is on screen for which path, and passes the
// couple of navigation callbacks a view needs (e.g. AddPersonView's
// `onDone`).
// ---------------------------------------------------------------------

function AddPersonRoute() {
  const navigate = useNavigate()
  return <AddPersonView onDone={() => navigate('/')} />
}

function PersonRoute() {
  const { personId } = useParams<{ personId: string }>()
  const id = Number(personId)
  if (!personId || Number.isNaN(id)) {
    // Malformed/missing id in the URL — send back to Home rather than
    // rendering a view with a nonsense personId.
    return <HomeView />
  }
  return <PersonView personId={id} />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/add-person" element={<AddPersonRoute />} />
      <Route path="/circles" element={<CircleView />} />
      <Route path="/settings" element={<SettingsView />} />
      <Route path="/import" element={<ImportView />} />
      <Route path="/person/:personId" element={<PersonRoute />} />
    </Routes>
  )
}

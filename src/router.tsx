import { useRef, useState } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import HomeView from './views/HomeView'
import AddPersonView from './views/AddPersonView'
import CircleView from './views/CircleView'
import SettingsView from './views/SettingsView'
import ImportView from './views/ImportView'
import PersonView from './views/PersonView'
import BlastView from './views/BlastView'
import WhatNextSheet from './components/WhatNextSheet'
import { getPerson } from './data/people.repo'

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
  // After a successful add, the WhatNextSheet offers a gentle bridge
  // (message / next connect / add a memory / nothing yet) instead of
  // silently dropping the user back on Home — see WI-13.
  const [justAdded, setJustAdded] = useState<{ id: number; name: string } | null>(null)
  // WhatNextSheet calls BOTH its specific action callback (e.g.
  // onSendMessage) AND onClose on every option tap, not just "Nothing
  // Yet" — so onClose alone can't tell "a specific action was chosen"
  // apart from "dismissed with no choice". This ref lets a specific
  // handler mark itself as having already navigated, so onClose (which
  // may fire before or after it) only falls back to "go Home" when
  // nothing else already navigated.
  const routedElsewhere = useRef(false)

  async function handleDone(personId: number) {
    const person = await getPerson(personId)
    routedElsewhere.current = false
    setJustAdded({ id: personId, name: person?.name ?? '' })
  }

  function goToProfile(personId: number) {
    routedElsewhere.current = true
    navigate(`/person/${personId}`)
  }

  return (
    <>
      <AddPersonView onDone={(id) => void handleDone(id)} />
      {justAdded ? (
        <WhatNextSheet
          personId={justAdded.id}
          personName={justAdded.name}
          open
          onClose={() => {
            if (!routedElsewhere.current) navigate('/')
          }}
          onSendMessage={() => goToProfile(justAdded.id)}
          onNextConnect={() => goToProfile(justAdded.id)}
          onAddMemory={() => goToProfile(justAdded.id)}
        />
      ) : null}
    </>
  )
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
      <Route path="/blast" element={<BlastView />} />
    </Routes>
  )
}

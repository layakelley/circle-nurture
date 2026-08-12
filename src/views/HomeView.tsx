import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { listPeople, type Person } from '../data/people.repo'
import { listCircles } from '../data/circles.repo'
import { listCircleMembers } from '../data/circleMembers.repo'
import PersonCard, { type PersonCardCircle } from '../components/PersonCard'
import CircleChip from '../components/CircleChip'
import NudgeCard from '../components/NudgeCard'
import { getPeopleNeedingNudge, dismissNudge } from '../utils/nudge'
import './HomeView.css'

// ---------------------------------------------------------------------
// The calm home screen: "your people" and "your circles", live from the
// Dexie-backed repos, plus any gentle nudges. No charts, no counts-as-
// urgency, no overdue styling — a quiet, warm list of who's in your life.
//
// Mounted at "/" by src/router.tsx. Tapping a person opens their profile
// at /person/:id.
// ---------------------------------------------------------------------

/**
 * The single warmest, most human one-line detail to surface on a card —
 * preferring the most memorable/personal detail over the more
 * administrative ones.
 */
function personContext(person: Person): string | undefined {
  return person.remember || person.whatConnectedUs || person.howMet || person.organization
}

export default function HomeView() {
  const navigate = useNavigate()

  // useLiveQuery re-runs its querier (and re-renders) whenever the tables
  // it touches change, so this reflects live data rather than a one-time
  // snapshot. Each returns `undefined` until the first result resolves;
  // treated as "nothing yet" so the view never throws on load.
  const people = useLiveQuery(() => listPeople(), []) ?? []
  const circles = useLiveQuery(() => listCircles(), []) ?? []
  const circleMembers = useLiveQuery(() => listCircleMembers(), []) ?? []
  // Re-runs whenever people/connectionLog/nudgeDismissals change, since
  // getPeopleNeedingNudge reads all three.
  const nudges = useLiveQuery(() => getPeopleNeedingNudge(), []) ?? []

  const circleNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const circle of circles) {
      if (circle.id !== undefined) map.set(circle.id, circle.name)
    }
    return map
  }, [circles])

  const circlesByPersonId = useMemo(() => {
    const map = new Map<number, PersonCardCircle[]>()
    for (const member of circleMembers) {
      const circleName = circleNameById.get(member.circleId)
      if (!circleName) continue
      const existing = map.get(member.personId) ?? []
      existing.push({ id: member.circleId, name: circleName })
      map.set(member.personId, existing)
    }
    return map
  }, [circleMembers, circleNameById])

  const isEmpty = people.length === 0 && circles.length === 0

  function handleAddPerson() {
    navigate('/add-person')
  }

  function handleCircleTap(_circleId: number) {
    // Deep-linking to one specific circle lands in a later card; for now
    // the tap takes you to the circles view where every circle is listed.
    navigate('/circles')
  }

  function handleDismissNudge(personId: number, lastConnected: Date | null) {
    void dismissNudge(personId, lastConnected)
  }

  return (
    <div className="home-view">
      <header>
        <h1 className="home-view__title">Circle Nurture</h1>
      </header>

      {nudges.length > 0 ? (
        <section className="home-view__section" aria-label="gentle nudges">
          {nudges.map((nudge) => (
            <NudgeCard
              key={nudge.personId}
              name={nudge.name}
              onDismiss={() => handleDismissNudge(nudge.personId, nudge.lastConnected)}
            />
          ))}
        </section>
      ) : null}

      {isEmpty ? (
        <div className="home-view__empty">
          <p className="home-view__empty-copy">start with one circle / add your first person</p>
          <button
            type="button"
            className="home-view__import-hint"
            onClick={() => navigate('/import')}
          >
            or bring in people you already know
          </button>
        </div>
      ) : (
        <>
          <section className="home-view__section" aria-label="your circles">
            <h2 className="home-view__section-title">your circles</h2>
            <div className="home-view__circles">
              {circles.map((circle) =>
                circle.id === undefined ? null : (
                  <CircleChip
                    key={circle.id}
                    name={circle.name}
                    onClick={() => handleCircleTap(circle.id as number)}
                  />
                ),
              )}
            </div>
          </section>

          <section className="home-view__section" aria-label="your people">
            <h2 className="home-view__section-title">your people</h2>
            <div className="home-view__people">
              {people.map((person) =>
                person.id === undefined ? null : (
                  <PersonCard
                    key={person.id}
                    name={person.name}
                    context={personContext(person)}
                    circles={circlesByPersonId.get(person.id) ?? []}
                    onClick={() => navigate(`/person/${person.id}`)}
                  />
                ),
              )}
            </div>
          </section>
        </>
      )}

      <button
        type="button"
        className="home-view__fab"
        onClick={handleAddPerson}
        aria-label="add person"
      >
        +
      </button>
    </div>
  )
}

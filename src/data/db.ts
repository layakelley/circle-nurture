import Dexie, { type Table } from 'dexie'
import { applySchema } from './migrations'

// ---------------------------------------------------------------------
// The local-first data layer.
//
// This module (and migrations.ts) are the ONLY files in the app allowed
// to `import 'dexie'` directly. Every other module — including every
// future view/component — must go through the typed repository modules
// in this directory (`*.repo.ts`). That keeps IndexedDB-shaped code out
// of the UI and keeps persistence swappable later if it ever needs to be.
// ---------------------------------------------------------------------

export interface Person {
  id?: number
  name: string
  phone?: string
  email?: string
  howMet?: string
  whenMet?: Date | null
  whereMet?: string
  whatConnectedUs?: string
  organization?: string
  remember?: string
  createdAt: Date
  updatedAt: Date
  /** True when the user explicitly set/confirmed a met-date, vs. it being an unset/soft default. */
  metDateIsExplicit: boolean
}

export interface Circle {
  id?: number
  name: string
  createdAt: Date
}

export interface CircleMember {
  id?: number
  personId: number
  circleId: number
  addedAt: Date
}

export interface Memory {
  id?: number
  personId: number
  text: string
  createdAt: Date
  pinned?: boolean
}

export type NextConnectType =
  | 'coffee'
  | 'lunch'
  | 'call'
  | 'meeting'
  | 'dinner'
  | 'activity'
  | 'visit'
  | 'other'
  | 'none'

export type NextConnectStatus = 'planned' | 'done' | 'none'

export interface NextConnect {
  id?: number
  personId: number
  type: NextConnectType
  targetDate?: Date
  note?: string
  status: NextConnectStatus
  createdAt: Date
}

export type ConnectionLogKind =
  | 'blast'
  | 'message'
  | 'call'
  | 'meet'
  | 'interaction'
  | 'manual'

export interface ConnectionLog {
  id?: number
  personId: number
  kind: ConnectionLogKind
  at: Date
  note?: string
}

export const DB_NAME = 'CircleNurtureDB'

export class CircleNurtureDB extends Dexie {
  people!: Table<Person, number>
  circles!: Table<Circle, number>
  circleMembers!: Table<CircleMember, number>
  memories!: Table<Memory, number>
  nextConnects!: Table<NextConnect, number>
  connectionLog!: Table<ConnectionLog, number>

  constructor(name: string = DB_NAME) {
    super(name)
    applySchema(this)
  }
}

/** The single shared database instance every repository reads/writes through. */
export const db = new CircleNurtureDB()

// ---------------------------------------------------------------------
// Dev-only smoke seed.
//
// Seeds exactly one sample person the first time the app is opened in
// development, so there's something to look at before any "add person"
// UI exists. Guarded twice:
//   - `import.meta.env.DEV` is a compile-time constant Vite inlines and
//     dead-code-eliminates in production builds, so this can never run
//     against a shipped build.
//   - `import.meta.env.VITEST` (set by the test runner) keeps it from
//     firing during `npm test`, so it can't contaminate CRUD/persistence
//     assertions that expect a known starting state.
// ---------------------------------------------------------------------

export async function seedDevSampleIfEmpty(database: CircleNurtureDB = db): Promise<void> {
  const existing = await database.people.count()
  if (existing > 0) return

  const now = new Date()
  await database.people.add({
    name: 'Sam Rivera',
    howMet: "Met at a friend's birthday dinner",
    whenMet: now,
    whereMet: 'Backyard birthday dinner',
    whatConnectedUs: 'We both talked way too long about houseplants',
    remember: 'Loves a good used bookstore',
    createdAt: now,
    updatedAt: now,
    metDateIsExplicit: false,
  })
}

if (import.meta.env.DEV && !import.meta.env.VITEST) {
  void seedDevSampleIfEmpty(db)
}

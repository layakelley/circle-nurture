import type Dexie from 'dexie'

// ---------------------------------------------------------------------
// Versioned schema chain for the Circle Nurture database.
//
// Dexie composes every `.version(n).stores(...)` call in ascending order
// into the final schema. A brand-new (empty) database only ever needs the
// latest version's shape, so opening a fresh DB never "replays" old
// migrations — Dexie just creates the tables/indexes as declared here.
// An existing database gets walked forward version-by-version, running any
// `.upgrade()` callback attached to each step along the way.
//
// This file is intentionally the single place that owns the version
// chain (v1 today). Future cards add schema changes as additional
// `.version(n).stores(...)` calls appended below — never by editing this
// v1 definition — e.g.:
//
//   dexie.version(2).stores({
//     people: '++id, name, createdAt, updatedAt, organization',
//   }).upgrade(async (tx) => {
//     // transform existing rows for the new shape here
//   })
// ---------------------------------------------------------------------

export const SCHEMA_VERSION = 2

/**
 * Applies the full version chain to a Dexie instance. Called once from
 * `src/data/db.ts` when the shared database instance is constructed.
 */
export function applySchema(dexie: Dexie): void {
  dexie.version(1).stores({
    // '++id' = auto-incrementing primary key. Only fields that are
    // actually queried by (repos filter/sort on them) are indexed —
    // everything else lives in the row without an index.
    people: '++id, name, createdAt, updatedAt',
    circles: '++id, name, createdAt',
    circleMembers: '++id, personId, circleId, addedAt',
    memories: '++id, personId, createdAt, pinned',
    nextConnects: '++id, personId, type, status, targetDate, createdAt',
    connectionLog: '++id, personId, kind, at',
  })

  // WI-11: gentle nudges. Purely additive — a new table, no changes to any
  // v1 table shape, so existing data is untouched on upgrade.
  dexie.version(2).stores({
    nudgeDismissals: '++id, personId, dismissedAt',
  })
}

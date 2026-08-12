import { db } from '../data/db'

// ---------------------------------------------------------------------
// Export / backup / restore.
//
// Everything in Circle Nurture lives in this one Dexie database. These
// helpers dump and restore it as a single plain JSON object, keyed by
// table name, so a person can back up (and recover) their whole circle
// without an account or a server.
//
// Table enumeration is generic (`db.tables`) rather than a hardcoded list
// of repo imports, so a future card that adds a new table is backed up
// automatically without touching this file.
// ---------------------------------------------------------------------

/** A full export: one array of rows per Dexie table, keyed by table name. */
export type ExportedData = Record<string, unknown[]>

/**
 * Reads every row of every table in the database and returns a plain,
 * JSON-serializable object: `{ [tableName]: rows[] }`.
 */
export async function exportAllData(): Promise<ExportedData> {
  const result: ExportedData = {}
  for (const table of db.tables) {
    result[table.name] = await table.toArray()
  }
  return result
}

/**
 * Restores the database from a previously-exported object (see
 * `exportAllData`). For each table present in `json` that also exists in
 * the current database, the table is cleared and then repopulated with
 * the exported rows (preserving their original primary keys via
 * `bulkPut`).
 *
 * Unknown keys in `json` that don't match a current table are ignored,
 * so an export taken before a schema change can still be partially
 * restored rather than failing outright.
 */
export async function importData(json: object): Promise<void> {
  const data = json as ExportedData
  const tableNames = new Set(db.tables.map((t) => t.name))

  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      const rows = data[table.name]
      if (!rows) continue
      await table.clear()
      if (rows.length > 0) {
        await table.bulkPut(rows)
      }
    }
  })

  // Warn (without throwing) about any exported tables that no longer
  // exist in the current schema — nothing to restore them into.
  for (const key of Object.keys(data)) {
    if (!tableNames.has(key)) {
      console.warn(`importData: skipped unknown table "${key}" (not in current schema)`)
    }
  }
}

function todayStamp(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Exports the whole database and triggers a browser download of the
 * result as a `.json` file — the one-click "get a copy of everything"
 * path from Settings.
 */
export async function downloadExport(): Promise<void> {
  const data = await exportAllData()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `circle-nurture-export-${todayStamp()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

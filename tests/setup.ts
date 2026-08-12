// Polyfills `indexedDB` / `IDBKeyRange` as globals before any test module
// (including src/data/db.ts) is imported, so Dexie behaves exactly as it
// would in a browser — this is what lets tests/db.persistence.test.ts prove
// real IndexedDB persistence rather than an in-memory stand-in.
import 'fake-indexeddb/auto'

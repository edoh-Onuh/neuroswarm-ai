/**
 * IndexedDB Cache — persist swarm state across page reloads.
 *
 * Uses a simple key/value store with TTL.  Falls back to in-memory store
 * when IndexedDB is unavailable (SSR / private-browsing).
 *
 * Usage:
 *   await cacheSet('swarm:agents', agentsArray, 60_000)   // TTL 60s
 *   const data = await cacheGet<Agent[]>('swarm:agents')  // null if expired
 */

const DB_NAME    = 'neuroswarm-cache'
const STORE_NAME = 'entries'
const DB_VERSION = 1

interface CacheEntry<T> {
  value: T
  expiresAt: number  // epoch ms
}

// ─── In-memory fallback ──────────────────────────────────────────────────────

const memStore = new Map<string, CacheEntry<unknown>>()

// ─── IDB bootstrap ──────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null
let _initPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (_db) return Promise.resolve(_db)
  if (_initPromise) return _initPromise
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)

  _initPromise = new Promise<IDBDatabase | null>((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME))
        db.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => {
      _db = req.result
      resolve(_db)
    }
    req.onerror = () => resolve(null)
  })
  return _initPromise
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Write a value to the cache with an optional TTL (default: 5 minutes).
 */
export async function cacheSet<T>(key: string, value: T, ttlMs = 300_000): Promise<void> {
  const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs }
  const db = await openDb()
  if (db) {
    await idbPut(db, key, entry)
  } else {
    memStore.set(key, entry as CacheEntry<unknown>)
  }
}

/**
 * Read a value; returns null if the key is missing or expired.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const db = await openDb()
  const entry: CacheEntry<T> | null = db
    ? await idbGet<CacheEntry<T>>(db, key)
    : (memStore.get(key) as CacheEntry<T> | undefined) ?? null

  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    await cacheDel(key)
    return null
  }
  return entry.value
}

/** Remove a key from the store. */
export async function cacheDel(key: string): Promise<void> {
  const db = await openDb()
  if (db) {
    await idbDelete(db, key)
  } else {
    memStore.delete(key)
  }
}

/** Clear all cache entries. */
export async function cacheClear(): Promise<void> {
  const db = await openDb()
  if (db) {
    await idbClear(db)
  } else {
    memStore.clear()
  }
}

// ─── IDB helpers ────────────────────────────────────────────────────────────

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).put(value, key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => resolve((req.result as T) ?? null)
    req.onerror   = () => reject(req.error)
  })
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).delete(key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

function idbClear(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).clear()
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

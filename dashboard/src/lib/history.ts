/**
 * Portfolio history — stores time-series SOL balance + USD value snapshots.
 *
 * Snapshots are written to IndexedDB so they survive page reloads.
 * Each wallet address has its own time-series (keyed by address).
 *
 * Schema:
 *   DB: neuroswarm-history  v1
 *   Store: snapshots   (keyPath: 'id', autoIncrement)
 *   Index: byAddress   (on 'address', non-unique)
 */

export interface Snapshot {
  id?: number
  address: string
  ts: number       // epoch ms
  solBalance: number
  usdValue: number
  solPrice: number
}

export interface PortfolioStats {
  snapshots: Snapshot[]
  currentValue: number
  changeUsd: number
  changePct: number
  peakUsd: number
  troughUsd: number
  /** SOL-denominated Sharpe proxy (mean / std of daily returns) */
  sharpe: number | null
  /** Largest peak-to-trough USD loss */
  maxDrawdownPct: number
}

// ─── IDB bootstrap ──────────────────────────────────────────────────────────

const DB_NAME    = 'neuroswarm-history'
const STORE_NAME = 'snapshots'
const DB_VERSION = 1

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
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('byAddress', 'address')
        store.createIndex('byTs', 'ts')
      }
    }
    req.onsuccess = () => { _db = req.result; resolve(_db) }
    req.onerror   = () => resolve(null)
  })
  return _initPromise
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Append a new portfolio snapshot.
 * Deduplicates: does NOT write if the last snapshot for this address is
 * less than `minIntervalMs` old (default: 60 s).
 */
export async function addSnapshot(
  snap: Omit<Snapshot, 'id'>,
  minIntervalMs = 60_000,
): Promise<void> {
  const recent = await getSnapshots(snap.address, 1)
  if (recent.length > 0 && snap.ts - recent[recent.length - 1].ts < minIntervalMs) return

  const db = await openDb()
  if (!db) return  // IDB unavailable

  await new Promise<void>((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).add(snap)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })

  // Prune: keep at most 1 440 snapshots per address (~24 h at 1/min)
  await pruneOld(db, snap.address, 1_440)
}

/**
 * Fetch up to `limit` most-recent snapshots for a wallet address.
 * Pass limit=0 to get all.
 */
export async function getSnapshots(address: string, limit = 0): Promise<Snapshot[]> {
  const db = await openDb()
  if (!db) return []

  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly')
    const index = tx.objectStore(STORE_NAME).index('byAddress')
    const req   = index.getAll(IDBKeyRange.only(address))
    req.onsuccess = () => {
      const all = (req.result as Snapshot[]).sort((a, b) => a.ts - b.ts)
      resolve(limit > 0 ? all.slice(-limit) : all)
    }
    req.onerror = () => reject(req.error)
  })
}

/** Compute derived analytics over the snapshot series. */
export async function computeStats(address: string): Promise<PortfolioStats> {
  const snaps = await getSnapshots(address)

  const currentValue  = snaps.at(-1)?.usdValue ?? 0
  const firstValue    = snaps[0]?.usdValue ?? currentValue
  const changeUsd     = currentValue - firstValue
  const changePct     = firstValue > 0 ? (changeUsd / firstValue) * 100 : 0
  const peakUsd       = snaps.reduce((m, s) => Math.max(m, s.usdValue), 0)
  const troughUsd     = snaps.reduce((m, s) => Math.min(m, s.usdValue), Infinity)

  // Max drawdown (peak-to-trough)
  let maxDrawdownPct = 0
  let runningPeak = 0
  for (const s of snaps) {
    if (s.usdValue > runningPeak) runningPeak = s.usdValue
    if (runningPeak > 0) {
      const dd = (runningPeak - s.usdValue) / runningPeak * 100
      if (dd > maxDrawdownPct) maxDrawdownPct = dd
    }
  }

  // Sharpe proxy: mean daily return / std (annualised * sqrt(365))
  let sharpe: number | null = null
  if (snaps.length > 2) {
    const returns = snaps.slice(1).map((s, i) => {
      const prev = snaps[i].usdValue
      return prev > 0 ? (s.usdValue - prev) / prev : 0
    })
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const std  = Math.sqrt(returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length)
    sharpe = std > 0 ? (mean / std) * Math.sqrt(365) : null
  }

  return {
    snapshots: snaps,
    currentValue,
    changeUsd,
    changePct,
    peakUsd,
    troughUsd: troughUsd === Infinity ? 0 : troughUsd,
    sharpe,
    maxDrawdownPct,
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function pruneOld(db: IDBDatabase, address: string, keepCount: number): Promise<void> {
  const snaps = await new Promise<Snapshot[]>((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).index('byAddress').getAll(IDBKeyRange.only(address))
    req.onsuccess = () => resolve(req.result as Snapshot[])
    req.onerror   = () => reject(req.error)
  })

  if (snaps.length <= keepCount) return
  const toDelete = snaps
    .sort((a, b) => a.ts - b.ts)
    .slice(0, snaps.length - keepCount)

  await new Promise<void>((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    toDelete.forEach(s => { if (s.id !== undefined) store.delete(s.id) })
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

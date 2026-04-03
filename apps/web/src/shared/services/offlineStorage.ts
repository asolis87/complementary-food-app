/**
 * Offline storage service — IndexedDB via `idb`.
 * Caches the food catalog locally so the plate builder works without internet.
 * Design: AD7 — generateSW + IndexedDB for offline food catalog.
 */

import { openDB, type IDBPDatabase } from 'idb'
import type { Food } from '@pakulab/shared'

// ─── DB Schema ───────────────────────────────────────────────────────────────

const DB_NAME = 'pakulab-offline'
const DB_VERSION = 1

interface PakulabDB {
  foods: {
    key: string
    value: Food
  }
  meta: {
    key: string
    value: string | number
  }
}

// ─── Singleton DB handle ──────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<PakulabDB>> | null = null

function getDB(): Promise<IDBPDatabase<PakulabDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PakulabDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('foods')) {
          db.createObjectStore('foods', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta')
        }
      },
    })
  }
  return dbPromise
}

// ─── Food catalog ─────────────────────────────────────────────────────────────

const FOODS_CACHE_KEY = 'foods-cached-at'
const FOODS_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Store the full food catalog in IndexedDB.
 * Replaces any previously cached data and updates the timestamp.
 */
export async function cacheFoods(foods: Food[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['foods', 'meta'], 'readwrite')

  // Clear old foods
  await tx.objectStore('foods').clear()

  // Write all new foods
  const foodStore = tx.objectStore('foods')
  await Promise.all(foods.map((f) => foodStore.put(f)))

  // Save timestamp
  await tx.objectStore('meta').put(Date.now(), FOODS_CACHE_KEY)

  await tx.done
}

/**
 * Load all foods from IndexedDB.
 * Returns an empty array if the cache is empty.
 */
export async function getCachedFoods(): Promise<Food[]> {
  const db = await getDB()
  return db.getAll('foods')
}

/**
 * Check whether the cached food catalog is still fresh (< 24h old).
 * Returns true if cache is fresh, false if stale or empty.
 */
export async function isFoodCacheFresh(): Promise<boolean> {
  const db = await getDB()
  const cachedAt = await db.get('meta', FOODS_CACHE_KEY)
  if (typeof cachedAt !== 'number') return false
  return Date.now() - cachedAt < FOODS_MAX_AGE_MS
}

/**
 * Returns the timestamp (ms) of the last food cache update,
 * or null if foods have never been cached.
 */
export async function getFoodCacheAge(): Promise<number | null> {
  const db = await getDB()
  const cachedAt = await db.get('meta', FOODS_CACHE_KEY)
  if (typeof cachedAt !== 'number') return null
  return cachedAt
}

/**
 * True when the IndexedDB food store has any entries.
 */
export async function hasCachedFoods(): Promise<boolean> {
  const db = await getDB()
  const count = await db.count('foods')
  return count > 0
}

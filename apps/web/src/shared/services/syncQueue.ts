/**
 * Offline sync queue — stores unsaved plates in IndexedDB while offline.
 * When connectivity is restored the queue is flushed to the API.
 * Design: AD7 — simple append + flush, no retry storm.
 */

import { openDB, type IDBPDatabase } from 'idb'
import type { FoodGroup } from '@pakulab/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueuedPlate {
  /** Local UUID — used to deduplicate on flush */
  localId: string
  name: string
  groupCount: 4 | 5
  items: Array<{
    foodId: string
    groupAssignment: FoodGroup
  }>
  queuedAt: number
}

// ─── DB Schema ────────────────────────────────────────────────────────────────

const DB_NAME = 'pakulab-sync-queue'
const DB_VERSION = 1

interface SyncQueueDB {
  plates: {
    key: string
    value: QueuedPlate
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<SyncQueueDB>> | null = null

function getDB(): Promise<IDBPDatabase<SyncQueueDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SyncQueueDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('plates')) {
          db.createObjectStore('plates', { keyPath: 'localId' })
        }
      },
    })
  }
  return dbPromise
}

// ─── Queue operations ─────────────────────────────────────────────────────────

/**
 * Enqueue a plate to be synced when back online.
 * Idempotent — if localId already exists it overwrites (same plate).
 */
export async function enqueuePlate(plate: QueuedPlate): Promise<void> {
  const db = await getDB()
  await db.put('plates', plate)
}

/**
 * Return all plates waiting to be synced.
 */
export async function getPendingPlates(): Promise<QueuedPlate[]> {
  const db = await getDB()
  return db.getAll('plates')
}

/**
 * Remove a successfully synced plate from the queue.
 */
export async function removeFromQueue(localId: string): Promise<void> {
  const db = await getDB()
  await db.delete('plates', localId)
}

/**
 * How many plates are pending sync.
 */
export async function getPendingCount(): Promise<number> {
  const db = await getDB()
  return db.count('plates')
}

/**
 * Clear the entire queue (e.g. on sign-out).
 */
export async function clearQueue(): Promise<void> {
  const db = await getDB()
  await db.clear('plates')
}

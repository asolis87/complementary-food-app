/**
 * safeStorage — Safe localStorage/sessionStorage access wrapper.
 *
 * Wraps storage access in try/catch to prevent crashes in environments
 * where storage throws (e.g., Safari private mode, disabled storage, quota exceeded).
 *
 * Degrades silently: returns null on read failure, no-op on write failure.
 */

/**
 * Safely read from storage. Returns null if storage throws.
 */
export function safeGetItem(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    // Storage access threw (private mode, disabled, etc.) — degrade silently
    return null
  }
}

/**
 * Safely write to storage. No-op if storage throws.
 */
export function safeSetItem(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value)
  } catch {
    // Storage write threw (quota, disabled, etc.) — degrade silently (no-op)
  }
}

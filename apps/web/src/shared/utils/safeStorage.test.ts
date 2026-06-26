/**
 * safeStorage unit tests.
 * Proves that storage access does NOT throw when the underlying storage throws.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { safeGetItem, safeSetItem } from './safeStorage'

describe('safeStorage', () => {
  describe('safeGetItem', () => {
    it('should return value when storage.getItem succeeds', () => {
      const mockStorage: Storage = {
        getItem: () => 'test-value',
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      }

      const result = safeGetItem(mockStorage, 'test-key')
      expect(result).toBe('test-value')
    })

    it('should return null when storage.getItem throws', () => {
      const throwingStorage: Storage = {
        getItem: () => {
          throw new Error('Storage access denied')
        },
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      }

      // Should NOT throw — must degrade silently
      const result = safeGetItem(throwingStorage, 'test-key')
      expect(result).toBeNull()
    })

    it('should return null when storage.getItem throws (Safari private mode simulation)', () => {
      const privateModeMock: Storage = {
        getItem: () => {
          throw new DOMException('QuotaExceededError')
        },
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      }

      const result = safeGetItem(privateModeMock, 'any-key')
      expect(result).toBeNull()
    })
  })

  describe('safeSetItem', () => {
    it('should write value when storage.setItem succeeds', () => {
      const mockData: Record<string, string> = {}
      const mockStorage: Storage = {
        getItem: (key) => mockData[key] ?? null,
        setItem: (key, value) => {
          mockData[key] = value
        },
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      }

      safeSetItem(mockStorage, 'test-key', 'test-value')
      expect(mockData['test-key']).toBe('test-value')
    })

    it('should NOT throw when storage.setItem throws (no-op)', () => {
      const throwingStorage: Storage = {
        getItem: () => null,
        setItem: () => {
          throw new Error('Storage write denied')
        },
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      }

      // Should NOT throw — must degrade silently (no-op)
      expect(() => {
        safeSetItem(throwingStorage, 'test-key', 'test-value')
      }).not.toThrow()
    })

    it('should NOT throw when storage.setItem throws QuotaExceededError', () => {
      const quotaExceededMock: Storage = {
        getItem: () => null,
        setItem: () => {
          throw new DOMException('QuotaExceededError')
        },
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      }

      // No-op when quota exceeded
      expect(() => {
        safeSetItem(quotaExceededMock, 'any-key', 'any-value')
      }).not.toThrow()
    })
  })
})

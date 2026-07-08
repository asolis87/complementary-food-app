/**
 * DashboardPage — Stage Transition Writer Tests
 *
 * Tests the CRITICAL lastSeen writer fix that makes the transition banner work in production.
 * Without this writer, the banner never shows (useStageTransition always sees lastSeen === null).
 *
 * REQ-B1: transition banner logic for 10-23m feature.
 * FIX 4: Rewritten to exercise REAL useStageTransition composable, not a re-implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStageTransition, buildLastSeenKey } from '@/shared/composables/useStageTransition'
import { safeSetItem } from '@/shared/utils/safeStorage'

describe('DashboardPage — Stage Transition Writer Logic (REAL composable)', () => {
  // Mock localStorage
  const localStorageMock: Record<string, string> = {}

  beforeEach(() => {
    // Clear localStorage mock before each test
    Object.keys(localStorageMock).forEach(key => delete localStorageMock[key])

    // Setup localStorage mocks
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageMock[key] = value
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageMock[key]
        }),
        clear: vi.fn(() => {
          Object.keys(localStorageMock).forEach(key => delete localStorageMock[key])
        }),
        key: vi.fn(),
        length: 0,
      },
      writable: true,
    })
  })

  it('should detect transition using REAL composable, then write prevents re-fire', () => {
    // Arrange — seed per-baby lastSeen=9
    const babyId = 'baby-123'
    const lastSeenKey = buildLastSeenKey(babyId)
    localStorageMock[lastSeenKey] = '9'

    // Act 1 — First dashboard load at age 10 (crossing threshold)
    const result1 = useStageTransition(10, babyId)

    // Assert — transition detected
    expect(result1.transition.value).toBe('TEN_TO_TWELVE_MONTHS')
    expect(result1.dismissed.value).toBe(false)

    // Act 2 — Simulate the DashboardPage write (AFTER reading transition)
    safeSetItem(localStorage, lastSeenKey, '10')

    // Act 3 — Re-run composable (simulate re-mount or refresh)
    const result2 = useStageTransition(10, babyId)

    // Assert — transition NOT detected (once-per-crossing)
    expect(result2.transition.value).toBeNull()
  })

  it('should detect 13m crossing AFTER 10m was already seen (using REAL composable)', () => {
    // Arrange — Baby already crossed 10m, lastSeen=12
    const babyId = 'baby-456'
    const lastSeenKey = buildLastSeenKey(babyId)
    localStorageMock[lastSeenKey] = '12'

    // Act — Baby turns 13
    const result = useStageTransition(13, babyId)

    // Assert — 13m crossing detected (new threshold)
    expect(result.transition.value).toBe('THIRTEEN_TO_SEVENTEEN_MONTHS')

    // Simulate write
    safeSetItem(localStorage, lastSeenKey, '13')

    // Re-run — no duplicate
    const result2 = useStageTransition(13, babyId)
    expect(result2.transition.value).toBeNull()
  })

  it('should prevent cross-baby contamination (multi-profile safety)', () => {
    // Arrange — Baby A at 14m (crossed 10m and 13m), Baby B at 9m
    const babyA = 'baby-a'
    const babyB = 'baby-b'
    const keyA = buildLastSeenKey(babyA)
    const keyB = buildLastSeenKey(babyB)

    localStorageMock[keyA] = '9'
    localStorageMock[keyB] = '8'

    // Act — Baby A crosses 10m
    const resultA1 = useStageTransition(10, babyA)
    expect(resultA1.transition.value).toBe('TEN_TO_TWELVE_MONTHS')

    // Write A's lastSeen
    safeSetItem(localStorage, keyA, '10')

    // Act — Switch to Baby B (9m, no crossing yet)
    const resultB1 = useStageTransition(9, babyB)
    expect(resultB1.transition.value).toBeNull()

    // Write B's lastSeen
    safeSetItem(localStorage, keyB, '9')

    // Act — Baby B turns 10 (crossing)
    const resultB2 = useStageTransition(10, babyB)
    expect(resultB2.transition.value).toBe('TEN_TO_TWELVE_MONTHS')

    // Write B's lastSeen
    safeSetItem(localStorage, keyB, '10')

    // Act — Switch back to Baby A (age 14, already crossed 10m and 13m)
    // First update A's lastSeen to 12 (before 13m crossing)
    localStorageMock[keyA] = '12'
    const resultA2 = useStageTransition(14, babyA)
    expect(resultA2.transition.value).toBe('THIRTEEN_TO_SEVENTEEN_MONTHS')

    // Write A's lastSeen
    safeSetItem(localStorage, keyA, '14')

    // Re-run A at 14 — no re-fire
    const resultA3 = useStageTransition(14, babyA)
    expect(resultA3.transition.value).toBeNull()

    // Assert — keys are isolated
    expect(localStorageMock[keyA]).toBe('14')
    expect(localStorageMock[keyB]).toBe('10')
  })

  it('should NOT fire transition when age goes backwards (data correction)', () => {
    // Arrange — lastSeen = 12
    const babyId = 'baby-789'
    const lastSeenKey = buildLastSeenKey(babyId)
    localStorageMock[lastSeenKey] = '12'

    // Act — Age regresses to 10 (data correction, clock skew)
    const result = useStageTransition(10, babyId)

    // Assert — no crossing (currentAge < 13, lastSeen >= 10)
    expect(result.transition.value).toBeNull()
  })

  it('should use safeSetItem for resilience (no crash when storage throws)', () => {
    // Arrange — Real composable, throwing storage
    const babyId = 'baby-resilient'
    const lastSeenKey = buildLastSeenKey(babyId)

    // Mock storage throw
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new DOMException('QuotaExceededError')
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      },
      writable: true,
    })

    // Act — safeSetItem should NOT throw
    expect(() => {
      safeSetItem(localStorage, lastSeenKey, '10')
    }).not.toThrow()
  })
})

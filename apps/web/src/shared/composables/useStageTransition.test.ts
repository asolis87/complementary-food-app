/**
 * useStageTransition composable tests.
 * Tests transition detection logic based on localStorage age crossing thresholds.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStageTransition } from './useStageTransition'
import type { AgeStage } from '@pakulab/shared'

describe('useStageTransition', () => {
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

  it('should detect 10-12 months crossing when lastSeen < 10 and current >= 10', () => {
    // Arrange
    const babyId = 'baby-123'
    localStorageMock[`pakulab:lastSeenAgeMonths:${babyId}`] = '9'

    // Act
    const { transition, dismissed } = useStageTransition(10, babyId)

    // Assert
    expect(transition.value).toBe('TEN_TO_TWELVE_MONTHS')
    expect(dismissed.value).toBe(false)
  })

  it('should detect 13-17 months crossing when lastSeen < 13 and current >= 13', () => {
    // Arrange
    const babyId = 'baby-123'
    localStorageMock[`pakulab:lastSeenAgeMonths:${babyId}`] = '12'

    // Act
    const { transition, dismissed } = useStageTransition(13, babyId)

    // Assert
    expect(transition.value).toBe('THIRTEEN_TO_SEVENTEEN_MONTHS')
    expect(dismissed.value).toBe(false)
  })

  it('should return dismissed=true when transition was already dismissed', () => {
    // Arrange
    const babyId = 'baby-123'
    localStorageMock[`pakulab:lastSeenAgeMonths:${babyId}`] = '9'
    localStorageMock[`pakulab:stageTransition:10_12:${babyId}`] = 'dismissed'

    // Act
    const { transition, dismissed } = useStageTransition(10, babyId)

    // Assert
    expect(transition.value).toBe('TEN_TO_TWELVE_MONTHS')
    expect(dismissed.value).toBe(true)
  })

  it('should return null transition when no crossing detected', () => {
    // Arrange
    const babyId = 'baby-123'
    localStorageMock[`pakulab:lastSeenAgeMonths:${babyId}`] = '8'

    // Act
    const { transition, dismissed } = useStageTransition(9, babyId)

    // Assert
    expect(transition.value).toBeNull()
    expect(dismissed.value).toBe(false)
  })

  it('should handle missing lastSeenAgeMonths gracefully (returns null)', () => {
    // Arrange — no lastSeenAgeMonths in localStorage
    const babyId = 'baby-123'

    // Act
    const { transition, dismissed } = useStageTransition(10, babyId)

    // Assert
    expect(transition.value).toBeNull()
    expect(dismissed.value).toBe(false)
  })

  it('should write dismissed flag correctly when dismiss() is called', () => {
    // Arrange
    const babyId = 'baby-123'
    localStorageMock[`pakulab:lastSeenAgeMonths:${babyId}`] = '9'
    const { transition, dismissed, dismiss } = useStageTransition(10, babyId)

    // Act
    dismiss('TEN_TO_TWELVE_MONTHS')

    // Assert
    expect(localStorageMock[`pakulab:stageTransition:10_12:${babyId}`]).toBe('dismissed')
    expect(dismissed.value).toBe(true)
  })

  it('should handle garbage lastSeen (NaN) gracefully — treat as no prior value', () => {
    // Arrange — garbage in storage
    const babyId = 'baby-123'
    localStorageMock[`pakulab:lastSeenAgeMonths:${babyId}`] = 'abc'

    // Act
    const { transition, dismissed } = useStageTransition(10, babyId)

    // Assert — no crash, no false negative latch
    expect(transition.value).toBeNull()
    expect(dismissed.value).toBe(false)
  })

  it('should namespace keys per baby (multi-profile safety)', () => {
    // Arrange — Baby A at 14m, Baby B at 7m
    const babyA = 'baby-a'
    const babyB = 'baby-b'
    localStorageMock[`pakulab:lastSeenAgeMonths:${babyA}`] = '9'
    localStorageMock[`pakulab:lastSeenAgeMonths:${babyB}`] = '6'

    // Act — Baby A crosses 10m
    const resultA = useStageTransition(14, babyA)
    expect(resultA.transition.value).toBe('THIRTEEN_TO_SEVENTEEN_MONTHS')

    // Act — Baby B does NOT cross (still 7m)
    const resultB = useStageTransition(7, babyB)
    expect(resultB.transition.value).toBeNull()

    // Write lastSeen for both
    localStorageMock[`pakulab:lastSeenAgeMonths:${babyA}`] = '14'
    localStorageMock[`pakulab:lastSeenAgeMonths:${babyB}`] = '7'

    // Act — Switch back to Baby A (age 14) — should NOT re-fire
    const resultA2 = useStageTransition(14, babyA)
    expect(resultA2.transition.value).toBeNull()
  })

  it('should NOT fire transition when age goes backwards within same baby', () => {
    // Arrange — lastSeen = 12
    const babyId = 'baby-123'
    localStorageMock[`pakulab:lastSeenAgeMonths:${babyId}`] = '12'

    // Act — age regresses to 10 (data correction, clock skew, etc.)
    const { transition } = useStageTransition(10, babyId)

    // Assert — no crossing (currentAge < 13 and lastSeen >= 10)
    expect(transition.value).toBeNull()
  })
})

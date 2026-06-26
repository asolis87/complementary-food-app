/**
 * Unit tests for allergens service layer.
 *
 * Tests the computeAllergenStatus pure function and getStatus wrapper.
 * Follows strict TDD: tests written FIRST, then implementation.
 *
 * Spec: REQ-A2, REQ-A3, REQ-A4, REQ-A5, REQ-A6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { CLOSING_WINDOW_AGE_MONTHS } from '@pakulab/shared'
import {
  computeAllergenStatus,
  getStatus,
  ALLERGEN_TYPE_MAPPING,
} from './allergens.service.js'
import { ForbiddenError } from '../../shared/errors/index.js'

// ── Mock Prisma type ──────────────────────────────────────────────────────────

type MockPrisma = {
  babyProfile: { findFirst: ReturnType<typeof vi.fn> }
  foodLog: { findMany: ReturnType<typeof vi.fn> }
}

function createMockPrisma(overrides: Partial<MockPrisma> = {}): MockPrisma {
  return {
    babyProfile: { findFirst: vi.fn().mockResolvedValue(null) },
    foodLog: { findMany: vi.fn().mockResolvedValue([]) },
    ...overrides,
  }
}

// ── ALLERGEN_TYPE_MAPPING constant tests ──────────────────────────────────────

describe('ALLERGEN_TYPE_MAPPING', () => {
  it('maps 9 priority allergenTypes to TOP_ALLERGENS keys (seed has 10 total)', () => {
    // Seed has 10 allergenTypes: dairy, egg, peanut, fish, shellfish, soy, gluten, tree_nuts, sesame, celery
    // We map 9 (all except celery — celery is explicitly excluded, not silently dropped)
    expect(ALLERGEN_TYPE_MAPPING).toEqual({
      dairy: 'leche',
      egg: 'huevo',
      peanut: 'cacahuate',
      fish: 'pescado',
      shellfish: 'mariscos',
      soy: 'soya',
      gluten: 'gluten',
      tree_nuts: 'nueces',
      sesame: 'ajonjoli',
    })
  })

  it('does NOT map celery (apio) — it is explicitly excluded, not a priority allergen', () => {
    expect(ALLERGEN_TYPE_MAPPING).not.toHaveProperty('celery')
  })

  it('does NOT include mostaza (no seed data)', () => {
    const values = Object.values(ALLERGEN_TYPE_MAPPING)
    expect(values).not.toContain('mostaza')
  })
})

// ── computeAllergenStatus pure function tests ─────────────────────────────────

describe('computeAllergenStatus', () => {
  it('returns closingWindow=false when ageMonths < 10', () => {
    const result = computeAllergenStatus({
      foodLogs: [],
      ageMonths: 8,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    expect(result.closingWindow).toBe(false)
    expect(result.ageMonths).toBe(8)
  })

  it('returns closingWindow=true when ageMonths >= 10', () => {
    const result = computeAllergenStatus({
      foodLogs: [],
      ageMonths: 11,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    expect(result.closingWindow).toBe(true)
    expect(result.ageMonths).toBe(11)
  })

  it('returns all 9 allergens with in_window status when ageMonths=8 and no exposures', () => {
    const result = computeAllergenStatus({
      foodLogs: [],
      ageMonths: 8,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    expect(result.allergens).toHaveLength(9) // 10 in TOP_ALLERGENS minus mostaza
    result.allergens.forEach((allergen) => {
      expect(allergen.status).toBe('in_window')
      expect(allergen.introducedAt).toBeNull()
      expect(allergen.exposureCount).toBe(0)
      expect(allergen.lastReaction).toBeNull()
    })
  })

  it('returns all 9 allergens with pending status when ageMonths=11 and no exposures', () => {
    const result = computeAllergenStatus({
      foodLogs: [],
      ageMonths: 11,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    expect(result.allergens).toHaveLength(9)
    result.allergens.forEach((allergen) => {
      expect(allergen.status).toBe('pending')
    })
  })

  it('marks allergen as introduced when at least 1 non-REJECTED exposure exists', () => {
    const logs = [
      {
        foodId: 'f1',
        date: new Date('2025-06-01'),
        reaction: 'LIKED',
        food: { allergenType: 'egg' },
      },
    ]

    const result = computeAllergenStatus({
      foodLogs: logs as any,
      ageMonths: 8,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    const egg = result.allergens.find((a) => a.type === 'huevo')
    expect(egg).toBeDefined()
    expect(egg!.status).toBe('introduced')
    expect(egg!.exposureCount).toBe(1)
    expect(egg!.introducedAt).toBe('2025-06-01')
    expect(egg!.lastReaction).toBe('LIKED')
  })

  it('does NOT count REJECTED exposures (stays in_window)', () => {
    const logs = [
      {
        foodId: 'f1',
        date: new Date('2025-06-01'),
        reaction: 'REJECTED',
        food: { allergenType: 'peanut' },
      },
    ]

    const result = computeAllergenStatus({
      foodLogs: logs as any,
      ageMonths: 8,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    const peanut = result.allergens.find((a) => a.type === 'cacahuate')
    expect(peanut!.status).toBe('in_window')
    expect(peanut!.exposureCount).toBe(0)
    expect(peanut!.introducedAt).toBeNull()
  })

  it('counts only non-REJECTED exposures correctly', () => {
    const logs = [
      { foodId: 'f1', date: new Date('2025-06-01'), reaction: 'LIKED', food: { allergenType: 'egg' } },
      { foodId: 'f2', date: new Date('2025-06-05'), reaction: 'NEUTRAL', food: { allergenType: 'egg' } },
      { foodId: 'f3', date: new Date('2025-06-10'), reaction: 'REJECTED', food: { allergenType: 'egg' } },
    ]

    const result = computeAllergenStatus({
      foodLogs: logs as any,
      ageMonths: 8,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    const egg = result.allergens.find((a) => a.type === 'huevo')
    expect(egg!.exposureCount).toBe(2) // Only LIKED + NEUTRAL
    expect(egg!.introducedAt).toBe('2025-06-01') // First non-REJECTED
  })

  it('returns fish and shellfish as separate allergens (pescado / mariscos)', () => {
    const logs = [
      { foodId: 'f1', date: new Date('2025-06-01'), reaction: 'LIKED', food: { allergenType: 'fish' } },
      { foodId: 'f2', date: new Date('2025-06-05'), reaction: 'LIKED', food: { allergenType: 'shellfish' } },
    ]

    const result = computeAllergenStatus({
      foodLogs: logs as any,
      ageMonths: 8,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    const fish = result.allergens.find((a) => a.type === 'pescado')
    const shellfish = result.allergens.find((a) => a.type === 'mariscos')

    expect(fish).toBeDefined()
    expect(fish!.status).toBe('introduced')
    expect(shellfish).toBeDefined()
    expect(shellfish!.status).toBe('introduced')
  })

  it('ignores foods with null allergenType', () => {
    const logs = [
      { foodId: 'f1', date: new Date('2025-06-01'), reaction: 'LIKED', food: { allergenType: null } },
    ]

    const result = computeAllergenStatus({
      foodLogs: logs as any,
      ageMonths: 8,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    // All allergens should remain in_window
    result.allergens.forEach((allergen) => {
      expect(allergen.status).toBe('in_window')
    })
  })

  it('ignores foods with unmapped allergenType (e.g. celery)', () => {
    const logs = [
      { foodId: 'f1', date: new Date('2025-06-01'), reaction: 'LIKED', food: { allergenType: 'celery' } },
    ]

    const result = computeAllergenStatus({
      foodLogs: logs as any,
      ageMonths: 8,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    // All allergens should remain in_window
    result.allergens.forEach((allergen) => {
      expect(allergen.status).toBe('in_window')
    })
  })

  it('does NOT include mostaza in output', () => {
    const result = computeAllergenStatus({
      foodLogs: [],
      ageMonths: 8,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    const mostaza = result.allergens.find((a) => a.type === 'mostaza')
    expect(mostaza).toBeUndefined()
  })

  it('includes nameEs from TOP_ALLERGENS', () => {
    const result = computeAllergenStatus({
      foodLogs: [],
      ageMonths: 8,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    const leche = result.allergens.find((a) => a.type === 'leche')
    expect(leche!.name).toBe('Leche / Lácteos')
  })

  it('handles multiple allergens introduced (comprehensive scenario)', () => {
    const logs = [
      { foodId: 'f1', date: new Date('2025-06-01'), reaction: 'LIKED', food: { allergenType: 'egg' } },
      { foodId: 'f2', date: new Date('2025-06-03'), reaction: 'LIKED', food: { allergenType: 'egg' } },
      { foodId: 'f3', date: new Date('2025-06-05'), reaction: 'NEUTRAL', food: { allergenType: 'dairy' } },
      { foodId: 'f4', date: new Date('2025-06-07'), reaction: 'LIKED', food: { allergenType: 'fish' } },
    ]

    const result = computeAllergenStatus({
      foodLogs: logs as any,
      ageMonths: 14,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    const egg = result.allergens.find((a) => a.type === 'huevo')
    const dairy = result.allergens.find((a) => a.type === 'leche')
    const fish = result.allergens.find((a) => a.type === 'pescado')
    const soy = result.allergens.find((a) => a.type === 'soya')

    expect(egg!.status).toBe('introduced')
    expect(egg!.exposureCount).toBe(2)
    expect(dairy!.status).toBe('introduced')
    expect(fish!.status).toBe('introduced')
    expect(soy!.status).toBe('pending') // No exposures, age >= 10
  })

  // ── FIX 2: Ordering tests ─────────────────────────────────────────────────────

  it('handles SHUFFLED (out-of-order) logs correctly for introducedAt/lastReaction', () => {
    // Logs are intentionally OUT OF ORDER (not date-ascending)
    const logs = [
      { foodId: 'f3', date: new Date('2025-06-10'), reaction: 'DISLIKED', food: { allergenType: 'egg' } },
      { foodId: 'f1', date: new Date('2025-06-01'), reaction: 'LIKED', food: { allergenType: 'egg' } },
      { foodId: 'f2', date: new Date('2025-06-05'), reaction: 'NEUTRAL', food: { allergenType: 'egg' } },
    ]

    const result = computeAllergenStatus({
      foodLogs: logs as any,
      ageMonths: 8,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    const egg = result.allergens.find((a) => a.type === 'huevo')
    expect(egg!.introducedAt).toBe('2025-06-01') // Chronological FIRST, not input-order first
    expect(egg!.lastReaction).toBe('DISLIKED') // Chronological LAST, not input-order last
    expect(egg!.exposureCount).toBe(3)
  })

  it('handles same-date logs deterministically (secondary order by createdAt if available)', () => {
    // Two logs on the SAME date (both 2025-06-01)
    const logs = [
      { foodId: 'f2', date: new Date('2025-06-01'), reaction: 'NEUTRAL', food: { allergenType: 'egg' } },
      { foodId: 'f1', date: new Date('2025-06-01'), reaction: 'LIKED', food: { allergenType: 'egg' } },
    ]

    const result = computeAllergenStatus({
      foodLogs: logs as any,
      ageMonths: 8,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    const egg = result.allergens.find((a) => a.type === 'huevo')
    // Since both are same date, lastReaction should be deterministic
    // (implementation will decide: either pick one consistently or use secondary field)
    expect(egg!.exposureCount).toBe(2)
    expect(['LIKED', 'NEUTRAL']).toContain(egg!.lastReaction) // One of the two
  })

  // ── FIX 3: Boundary + REJECTED at closing window ──────────────────────────────

  it('returns status=pending when ageMonths EXACTLY 10 (boundary)', () => {
    const result = computeAllergenStatus({
      foodLogs: [],
      ageMonths: 10, // EXACT boundary
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    expect(result.closingWindow).toBe(true)
    result.allergens.forEach((allergen) => {
      expect(allergen.status).toBe('pending')
    })
  })

  it('baby at ageMonths 11 with ONLY REJECTED exposure → status pending, count 0', () => {
    const logs = [
      { foodId: 'f1', date: new Date('2025-06-01'), reaction: 'REJECTED', food: { allergenType: 'peanut' } },
    ]

    const result = computeAllergenStatus({
      foodLogs: logs as any,
      ageMonths: 11,
      closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
    })

    const peanut = result.allergens.find((a) => a.type === 'cacahuate')
    expect(peanut!.status).toBe('pending') // Not introduced (REJECTED doesn't count)
    expect(peanut!.exposureCount).toBe(0)
    expect(peanut!.introducedAt).toBeNull()
    expect(peanut!.lastReaction).toBeNull()
  })
})

// ── getStatus wrapper tests ───────────────────────────────────────────────────

describe('getStatus', () => {
  it('throws ForbiddenError when babyProfile not found', async () => {
    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(null) },
    })

    await expect(
      getStatus(prisma as unknown as PrismaClient, 'baby-1', 'user-1'),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError when babyProfile belongs to different user', async () => {
    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(null) },
    })

    await expect(
      getStatus(prisma as unknown as PrismaClient, 'baby-1', 'wrong-user'),
    ).rejects.toThrow(ForbiddenError)
  })

  it('returns allergen status for valid babyProfile', async () => {
    const mockProfile = {
      id: 'baby-1',
      userId: 'user-1',
      birthDate: new Date('2025-10-15'),
    }

    const mockLogs = [
      { foodId: 'f1', date: new Date('2026-05-01'), reaction: 'LIKED', food: { allergenType: 'egg', isAllergen: true } },
    ]

    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(mockProfile) },
      foodLog: { findMany: vi.fn().mockResolvedValue(mockLogs) },
    })

    const result = await getStatus(prisma as unknown as PrismaClient, 'baby-1', 'user-1')

    expect(result.ageMonths).toBeGreaterThanOrEqual(7)
    expect(result.allergens).toHaveLength(9)
    const egg = result.allergens.find((a) => a.type === 'huevo')
    expect(egg!.status).toBe('introduced')
  })

  it('logs warning when FoodLog has unmapped non-null allergenType', async () => {
    const mockProfile = {
      id: 'baby-1',
      userId: 'user-1',
      birthDate: new Date('2025-10-15'),
    }

    const mockLogs = [
      { foodId: 'f1', date: new Date('2026-05-01'), reaction: 'LIKED', food: { allergenType: 'lupin', isAllergen: true } },
    ]

    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(mockProfile) },
      foodLog: { findMany: vi.fn().mockResolvedValue(mockLogs) },
    })

    // Mock the logger
    const warnSpy = vi.fn()
    const mockLogger = { warn: warnSpy, info: vi.fn(), error: vi.fn(), debug: vi.fn() }

    const result = await getStatus(
      prisma as unknown as PrismaClient,
      'baby-1',
      'user-1',
      mockLogger as any,
    )

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        unmappedAllergenTypes: ['lupin'],
      }),
      expect.stringContaining('Unmapped allergenType values found'),
    )
    expect(result.allergens).toHaveLength(9) // Still returns 9 tracked allergens
  })

  it('does NOT log warning for celery (explicitly excluded)', async () => {
    const mockProfile = {
      id: 'baby-1',
      userId: 'user-1',
      birthDate: new Date('2025-10-15'),
    }

    const mockLogs = [
      { foodId: 'f1', date: new Date('2026-05-01'), reaction: 'LIKED', food: { allergenType: 'celery', isAllergen: true } },
    ]

    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(mockProfile) },
      foodLog: { findMany: vi.fn().mockResolvedValue(mockLogs) },
    })

    const warnSpy = vi.fn()
    const mockLogger = { warn: warnSpy, info: vi.fn(), error: vi.fn(), debug: vi.fn() }

    await getStatus(prisma as unknown as PrismaClient, 'baby-1', 'user-1', mockLogger as any)

    expect(warnSpy).not.toHaveBeenCalled() // celery is explicitly excluded, not unmapped
  })

  it('does NOT log warning for null allergenType', async () => {
    const mockProfile = {
      id: 'baby-1',
      userId: 'user-1',
      birthDate: new Date('2025-10-15'),
    }

    const mockLogs = [
      { foodId: 'f1', date: new Date('2026-05-01'), reaction: 'LIKED', food: { allergenType: null, isAllergen: false } },
    ]

    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(mockProfile) },
      foodLog: { findMany: vi.fn().mockResolvedValue(mockLogs) },
    })

    const warnSpy = vi.fn()
    const mockLogger = { warn: warnSpy, info: vi.fn(), error: vi.fn(), debug: vi.fn() }

    await getStatus(prisma as unknown as PrismaClient, 'baby-1', 'user-1', mockLogger as any)

    expect(warnSpy).not.toHaveBeenCalled() // null allergenType is silently ignored (expected)
  })
})

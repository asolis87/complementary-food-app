/**
 * Safety/idempotency tests for backfill-snack-to-snack1.ts
 *
 * Verifies:
 * - Default mode is dry-run (no writes).
 * - --apply rewrites only legacy SNACK rows to SNACK_1.
 * - A second apply run is idempotent.
 * - Deleted rows and non-SNACK rows are not modified.
 * - Argument parsing is fail-closed (unknown flags default to dry-run).
 * - Importing the module does not execute the CLI entry point.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MealType, type PrismaClient } from '@prisma/client'
import { parseArgs, runBackfill } from './backfill-snack-to-snack1.js'

vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@prisma/client')>()
  return {
    ...actual,
    PrismaClient: vi.fn().mockImplementation(() => ({
      foodLog: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      $disconnect: vi.fn().mockResolvedValue(undefined),
    })) as unknown as typeof actual.PrismaClient,
  }
})

type MockFoodLogDelegate = {
  count: ReturnType<typeof vi.fn>
  findMany: ReturnType<typeof vi.fn>
  updateMany: ReturnType<typeof vi.fn>
}

type MockPrisma = {
  foodLog: MockFoodLogDelegate
}

function createMockPrisma(overrides?: Partial<MockFoodLogDelegate>): MockPrisma {
  return {
    foodLog: {
      count: overrides?.count ?? vi.fn().mockResolvedValue(0),
      findMany: overrides?.findMany ?? vi.fn().mockResolvedValue([]),
      updateMany: overrides?.updateMany ?? vi.fn().mockResolvedValue({ count: 0 }),
    },
  }
}

describe('parseArgs', () => {
  it('defaults to dry-run when no flags are passed', () => {
    expect(parseArgs([])).toBe('dry-run')
  })

  it('returns dry-run when --dry-run is passed', () => {
    expect(parseArgs(['--dry-run'])).toBe('dry-run')
  })

  it('returns apply when --apply is passed', () => {
    expect(parseArgs(['--apply'])).toBe('apply')
  })

  it('defaults to dry-run for unknown flags (fail-closed)', () => {
    expect(parseArgs(['--invalid'])).toBe('dry-run')
  })
})

describe('runBackfill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('counts only non-deleted SNACK rows', async () => {
    const countFn = vi.fn().mockResolvedValue(0)
    const prisma = createMockPrisma({ count: countFn })

    await runBackfill(prisma as unknown as PrismaClient, 'dry-run')

    expect(countFn).toHaveBeenCalledOnce()
    expect(countFn).toHaveBeenCalledWith({
      where: { mealType: MealType.SNACK, deletedAt: null },
    })
  })

  it('does not call updateMany in dry-run mode', async () => {
    const updateManyFn = vi.fn().mockResolvedValue({ count: 0 })
    const prisma = createMockPrisma({
      count: vi.fn().mockResolvedValue(3),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: updateManyFn,
    })

    const result = await runBackfill(prisma as unknown as PrismaClient, 'dry-run')

    expect(updateManyFn).not.toHaveBeenCalled()
    expect(result.updatedCount).toBe(0)
  })

  it('returns the sample rows in dry-run mode', async () => {
    const sampleRows = [
      {
        id: 'log-1',
        userId: 'user-1',
        babyProfileId: 'baby-1',
        date: new Date('2026-01-15'),
        time: '10:00',
        createdAt: new Date('2026-01-15T10:05:00Z'),
      },
    ]
    const findManyFn = vi.fn().mockResolvedValue(sampleRows)
    const prisma = createMockPrisma({
      count: vi.fn().mockResolvedValue(1),
      findMany: findManyFn,
    })

    const result = await runBackfill(prisma as unknown as PrismaClient, 'dry-run')

    expect(findManyFn).toHaveBeenCalledOnce()
    expect(result.sample).toEqual(sampleRows)
    expect(result.remainingCount).toBe(1)
  })

  it('does not fetch a sample in apply mode', async () => {
    const findManyFn = vi.fn().mockResolvedValue([])
    const prisma = createMockPrisma({
      count: vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(0),
      findMany: findManyFn,
      updateMany: vi.fn().mockResolvedValue({ count: 2 }),
    })

    await runBackfill(prisma as unknown as PrismaClient, 'apply')

    expect(findManyFn).not.toHaveBeenCalled()
  })

  it('applies updateMany with the correct predicate and data in apply mode', async () => {
    const updateManyFn = vi.fn().mockResolvedValue({ count: 3 })
    const countFn = vi.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(0)
    const prisma = createMockPrisma({
      count: countFn,
      updateMany: updateManyFn,
    })

    const result = await runBackfill(prisma as unknown as PrismaClient, 'apply')

    expect(updateManyFn).toHaveBeenCalledOnce()
    expect(updateManyFn).toHaveBeenCalledWith({
      where: { mealType: MealType.SNACK, deletedAt: null },
      data: { mealType: MealType.SNACK_1 },
    })
    expect(result.matchedCount).toBe(3)
    expect(result.updatedCount).toBe(3)
    expect(result.remainingCount).toBe(0)
  })

  it('is idempotent: a second apply run with zero matches does not update', async () => {
    const updateManyFn = vi.fn().mockResolvedValue({ count: 0 })
    const countFn = vi.fn().mockResolvedValue(0)
    const prisma = createMockPrisma({
      count: countFn,
      updateMany: updateManyFn,
    })

    const first = await runBackfill(prisma as unknown as PrismaClient, 'apply')
    const second = await runBackfill(prisma as unknown as PrismaClient, 'apply')

    expect(updateManyFn).not.toHaveBeenCalled()
    expect(first.matchedCount).toBe(0)
    expect(second.matchedCount).toBe(0)
  })

  it('throws when the self-check detects remaining SNACK rows after apply', async () => {
    const updateManyFn = vi.fn().mockResolvedValue({ count: 3 })
    const countFn = vi.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(2)
    const prisma = createMockPrisma({
      count: countFn,
      updateMany: updateManyFn,
    })

    await expect(runBackfill(prisma as unknown as PrismaClient, 'apply')).rejects.toThrow(
      'self-check failed',
    )
  })

  it('does not modify deleted SNACK rows (predicate excludes deletedAt)', async () => {
    const updateManyFn = vi.fn().mockResolvedValue({ count: 2 })
    const countFn = vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(0)
    const prisma = createMockPrisma({
      count: countFn,
      updateMany: updateManyFn,
    })

    await runBackfill(prisma as unknown as PrismaClient, 'apply')

    expect(updateManyFn).toHaveBeenCalledWith({
      where: { mealType: MealType.SNACK, deletedAt: null },
      data: { mealType: MealType.SNACK_1 },
    })
  })

  it('does not modify non-SNACK rows when no SNACK rows exist', async () => {
    const updateManyFn = vi.fn().mockResolvedValue({ count: 0 })
    const countFn = vi.fn().mockResolvedValue(0)
    const prisma = createMockPrisma({
      count: countFn,
      updateMany: updateManyFn,
    })

    await runBackfill(prisma as unknown as PrismaClient, 'apply')

    expect(updateManyFn).not.toHaveBeenCalled()
  })
})

describe('module import safety', () => {
  it('does not execute main() when imported as a module', async () => {
    vi.resetModules()

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { PrismaClient } = await import('@prisma/client')
    await import('./backfill-snack-to-snack1.js')

    expect(logSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(PrismaClient).not.toHaveBeenCalled()

    logSpy.mockRestore()
    errorSpy.mockRestore()
  })
})

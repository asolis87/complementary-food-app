/**
 * Safety/idempotency tests for backfill-plate-stage.ts
 *
 * Verifies:
 * - Default mode is dry-run (no writes); default stage is SIX_TO_NINE_MONTHS.
 * - --apply stamps only NULL-stage, non-deleted plates.
 * - --stage=<valid> overrides the target; invalid --stage fails closed to default.
 * - A second apply run is idempotent.
 * - The self-check throws if NULL-stage plates remain after apply.
 * - Importing the module does not execute the CLI entry point.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PlateStage, type PrismaClient } from '@prisma/client'
import { parseArgs, runBackfill } from './backfill-plate-stage.js'

vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@prisma/client')>()
  return {
    ...actual,
    PrismaClient: vi.fn().mockImplementation(() => ({
      plate: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      $disconnect: vi.fn().mockResolvedValue(undefined),
    })) as unknown as typeof actual.PrismaClient,
  }
})

type MockPlateDelegate = {
  count: ReturnType<typeof vi.fn>
  findMany: ReturnType<typeof vi.fn>
  updateMany: ReturnType<typeof vi.fn>
}

type MockPrisma = {
  plate: MockPlateDelegate
}

function createMockPrisma(overrides?: Partial<MockPlateDelegate>): MockPrisma {
  return {
    plate: {
      count: overrides?.count ?? vi.fn().mockResolvedValue(0),
      findMany: overrides?.findMany ?? vi.fn().mockResolvedValue([]),
      updateMany: overrides?.updateMany ?? vi.fn().mockResolvedValue({ count: 0 }),
    },
  }
}

describe('parseArgs', () => {
  it('defaults to dry-run + SIX_TO_NINE_MONTHS when no flags are passed', () => {
    expect(parseArgs([])).toEqual({ mode: 'dry-run', stage: PlateStage.SIX_TO_NINE_MONTHS })
  })

  it('returns dry-run when --dry-run is passed', () => {
    expect(parseArgs(['--dry-run']).mode).toBe('dry-run')
  })

  it('returns apply when --apply is passed', () => {
    expect(parseArgs(['--apply']).mode).toBe('apply')
  })

  it('honors a valid --stage override', () => {
    expect(parseArgs(['--apply', '--stage=TEN_TO_TWELVE_MONTHS'])).toEqual({
      mode: 'apply',
      stage: PlateStage.TEN_TO_TWELVE_MONTHS,
    })
  })

  it('falls back to the default stage for an invalid --stage (fail-closed)', () => {
    expect(parseArgs(['--apply', '--stage=NOT_A_STAGE']).stage).toBe(
      PlateStage.SIX_TO_NINE_MONTHS,
    )
  })

  it('defaults to dry-run for unknown flags (fail-closed)', () => {
    expect(parseArgs(['--invalid']).mode).toBe('dry-run')
  })
})

describe('runBackfill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('counts only non-deleted NULL-stage plates', async () => {
    const countFn = vi.fn().mockResolvedValue(0)
    const prisma = createMockPrisma({ count: countFn })

    await runBackfill(prisma as unknown as PrismaClient, 'dry-run')

    expect(countFn).toHaveBeenCalledOnce()
    expect(countFn).toHaveBeenCalledWith({
      where: { stageFor: null, deletedAt: null },
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
        id: 'plate-1',
        userId: 'user-1',
        babyProfileId: 'baby-1',
        name: 'Mi plato',
        createdAt: new Date('2026-04-15T10:05:00Z'),
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

  it('applies updateMany with the default stage in apply mode', async () => {
    const updateManyFn = vi.fn().mockResolvedValue({ count: 3 })
    const countFn = vi.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(0)
    const prisma = createMockPrisma({
      count: countFn,
      updateMany: updateManyFn,
    })

    const result = await runBackfill(prisma as unknown as PrismaClient, 'apply')

    expect(updateManyFn).toHaveBeenCalledOnce()
    expect(updateManyFn).toHaveBeenCalledWith({
      where: { stageFor: null, deletedAt: null },
      data: { stageFor: PlateStage.SIX_TO_NINE_MONTHS },
    })
    expect(result.matchedCount).toBe(3)
    expect(result.updatedCount).toBe(3)
    expect(result.remainingCount).toBe(0)
  })

  it('applies the provided stage override', async () => {
    const updateManyFn = vi.fn().mockResolvedValue({ count: 1 })
    const countFn = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0)
    const prisma = createMockPrisma({ count: countFn, updateMany: updateManyFn })

    await runBackfill(prisma as unknown as PrismaClient, 'apply', PlateStage.TEN_TO_TWELVE_MONTHS)

    expect(updateManyFn).toHaveBeenCalledWith({
      where: { stageFor: null, deletedAt: null },
      data: { stageFor: PlateStage.TEN_TO_TWELVE_MONTHS },
    })
  })

  it('is idempotent: a second apply run with zero matches does not update', async () => {
    const updateManyFn = vi.fn().mockResolvedValue({ count: 0 })
    const countFn = vi.fn().mockResolvedValue(0)
    const prisma = createMockPrisma({ count: countFn, updateMany: updateManyFn })

    const first = await runBackfill(prisma as unknown as PrismaClient, 'apply')
    const second = await runBackfill(prisma as unknown as PrismaClient, 'apply')

    expect(updateManyFn).not.toHaveBeenCalled()
    expect(first.matchedCount).toBe(0)
    expect(second.matchedCount).toBe(0)
  })

  it('throws when the self-check detects remaining NULL-stage plates after apply', async () => {
    const updateManyFn = vi.fn().mockResolvedValue({ count: 3 })
    const countFn = vi.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(2)
    const prisma = createMockPrisma({ count: countFn, updateMany: updateManyFn })

    await expect(
      runBackfill(prisma as unknown as PrismaClient, 'apply'),
    ).rejects.toThrow('self-check failed')
  })

  it('does not modify anything when no NULL-stage plates exist', async () => {
    const updateManyFn = vi.fn().mockResolvedValue({ count: 0 })
    const countFn = vi.fn().mockResolvedValue(0)
    const prisma = createMockPrisma({ count: countFn, updateMany: updateManyFn })

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
    await import('./backfill-plate-stage.js')

    expect(logSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(PrismaClient).not.toHaveBeenCalled()

    logSpy.mockRestore()
    errorSpy.mockRestore()
  })
})

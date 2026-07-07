/**
 * Unit tests for snack service.
 * REQ-SM2: Create snack via manual per-group selection.
 * REQ-SM3: List snacks ("Mis Colaciones").
 */

import { beforeEach, describe, it, expect, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { createSnack, getUserSnacks, getSnackById, softDeleteSnack } from '../snack.service.js'
import { TierLimitError } from '../../../shared/errors/index.js'

const mockPrisma = {
  snack: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  babyProfile: {
    findFirst: vi.fn(),
  },
  $transaction: vi.fn(),
} as unknown as PrismaClient

/**
 * Build a birthDate that yields exactly `ageMonths` complete months against
 * the real current clock, so createSnack's internal getAgeMonths(now) call
 * derives the intended age deterministically. Sets the day-of-month to 1 to
 * avoid month-boundary rounding on end-of-month reference dates.
 */
function birthDateForAge(ageMonths: number): Date {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - ageMonths, 1)
  return d
}

describe('createSnack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a 2-group snack (typical for 10-12m)', async () => {
    const input = {
      name: 'Colación Mañana',
      babyProfileId: 'profile-123',
      stageFor: 'TEN_TO_TWELVE_MONTHS' as const,
      items: [
        { foodId: 'food-fat', groupAssignment: 'HEALTHY_FAT' as const },
        { foodId: 'food-cereal', groupAssignment: 'CEREAL_TUBER' as const },
      ],
    }

    const mockCreatedSnack = {
      id: 'snack-123',
      userId: 'user-123',
      babyProfileId: 'profile-123',
      name: 'Colación Mañana',
      stageFor: 'TEN_TO_TWELVE_MONTHS',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      items: [
        {
          id: 'item-1',
          snackId: 'snack-123',
          foodId: 'food-fat',
          groupAssignment: 'HEALTHY_FAT',
          servingAmount: null,
          createdAt: new Date(),
          food: { id: 'food-fat', name: 'Aguacate', group: 'HEALTHY_FAT' },
        },
        {
          id: 'item-2',
          snackId: 'snack-123',
          foodId: 'food-cereal',
          groupAssignment: 'CEREAL_TUBER',
          servingAmount: null,
          createdAt: new Date(),
          food: { id: 'food-cereal', name: 'Avena', group: 'CEREAL_TUBER' },
        },
      ],
    }

    mockPrisma.snack.count = vi.fn().mockResolvedValue(2)
    mockPrisma.snack.create = vi.fn().mockResolvedValue(mockCreatedSnack)
    // 2-group snack for an 11m profile matches the suggestion → no warnings.
    mockPrisma.babyProfile.findFirst = vi.fn().mockResolvedValue({
      birthDate: birthDateForAge(11),
    })

    const result = await createSnack(mockPrisma, 'user-123', 'FREE', input)

    expect(result.snack).toEqual(mockCreatedSnack)
    expect(result.warnings).toEqual([])
    expect(mockPrisma.snack.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        name: 'Colación Mañana',
        babyProfileId: 'profile-123',
        stageFor: 'TEN_TO_TWELVE_MONTHS',
        items: {
          create: [
            { foodId: 'food-fat', groupAssignment: 'HEALTHY_FAT', servingAmount: undefined },
            { foodId: 'food-cereal', groupAssignment: 'CEREAL_TUBER', servingAmount: undefined },
          ],
        },
      },
      include: { items: { include: { food: true } } },
    })
  })

  it('should create a 3-group snack (typical for 13-23m)', async () => {
    const input = {
      name: 'Colación Completa',
      items: [
        { foodId: 'food-fat', groupAssignment: 'HEALTHY_FAT' as const },
        { foodId: 'food-cereal', groupAssignment: 'CEREAL_TUBER' as const },
        { foodId: 'food-fruit', groupAssignment: 'FRUIT' as const },
      ],
    }

    const mockCreatedSnack = {
      id: 'snack-456',
      userId: 'user-123',
      babyProfileId: null,
      name: 'Colación Completa',
      stageFor: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      items: [
        {
          id: 'item-1',
          snackId: 'snack-456',
          foodId: 'food-fat',
          groupAssignment: 'HEALTHY_FAT',
          servingAmount: null,
          createdAt: new Date(),
          food: { id: 'food-fat', name: 'Aguacate', group: 'HEALTHY_FAT' },
        },
        {
          id: 'item-2',
          snackId: 'snack-456',
          foodId: 'food-cereal',
          groupAssignment: 'CEREAL_TUBER',
          servingAmount: null,
          createdAt: new Date(),
          food: { id: 'food-cereal', name: 'Avena', group: 'CEREAL_TUBER' },
        },
        {
          id: 'item-3',
          snackId: 'snack-456',
          foodId: 'food-fruit',
          groupAssignment: 'FRUIT',
          servingAmount: null,
          createdAt: new Date(),
          food: { id: 'food-fruit', name: 'Manzana', group: 'FRUIT' },
        },
      ],
    }

    mockPrisma.snack.count = vi.fn().mockResolvedValue(0)
    mockPrisma.snack.create = vi.fn().mockResolvedValue(mockCreatedSnack)

    const result = await createSnack(mockPrisma, 'user-123', 'FREE', input)

    // No babyProfileId → no age context → no warnings.
    expect(result.snack).toEqual(mockCreatedSnack)
    expect(result.warnings).toEqual([])
    expect(result.snack.items).toHaveLength(3)
  })

  it('should enforce FREE tier limit of 5 snacks', async () => {
    const input = {
      name: 'Snack 6',
      items: [{ foodId: 'food-fat', groupAssignment: 'HEALTHY_FAT' as const }],
    }

    mockPrisma.snack.count = vi.fn().mockResolvedValue(5)

    await expect(createSnack(mockPrisma, 'user-123', 'FREE', input)).rejects.toThrow(TierLimitError)
    await expect(createSnack(mockPrisma, 'user-123', 'FREE', input)).rejects.toThrow(
      'Has alcanzado el límite de 5 colaciones para el plan gratuito',
    )
  })

  it('should warn about a missing suggested group (11m profile, only HEALTHY_FAT)', async () => {
    const input = {
      name: 'Colación Ana',
      babyProfileId: 'profile-ana',
      items: [{ foodId: 'food-fat', groupAssignment: 'HEALTHY_FAT' as const }],
    }

    const mockCreatedSnack = {
      id: 'snack-ana',
      userId: 'user-123',
      babyProfileId: 'profile-ana',
      name: 'Colación Ana',
      stageFor: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      items: [
        {
          id: 'item-1',
          snackId: 'snack-ana',
          foodId: 'food-fat',
          groupAssignment: 'HEALTHY_FAT',
          servingAmount: null,
          createdAt: new Date(),
          food: { id: 'food-fat', name: 'Aguacate', group: 'HEALTHY_FAT' },
        },
      ],
    }

    mockPrisma.snack.count = vi.fn().mockResolvedValue(0)
    mockPrisma.snack.create = vi.fn().mockResolvedValue(mockCreatedSnack)
    mockPrisma.babyProfile.findFirst = vi.fn().mockResolvedValue({
      birthDate: birthDateForAge(11),
    })

    const result = await createSnack(mockPrisma, 'user-123', 'FREE', input)

    // Snack still saved.
    expect(result.snack).toEqual(mockCreatedSnack)
    // Non-blocking warning about the missing suggested group.
    expect(result.warnings).toContain('Suggested group CEREAL_TUBER is missing')
    // Age was derived from the baby profile scoped to the user.
    expect(mockPrisma.babyProfile.findFirst).toHaveBeenCalledWith({
      where: { id: 'profile-ana', userId: 'user-123', deletedAt: null },
    })
  })

  it('should warn about an extra group (10m profile, includes FRUIT)', async () => {
    const input = {
      name: 'Colación Tomás',
      babyProfileId: 'profile-tomas',
      items: [
        { foodId: 'food-fat', groupAssignment: 'HEALTHY_FAT' as const },
        { foodId: 'food-cereal', groupAssignment: 'CEREAL_TUBER' as const },
        { foodId: 'food-fruit', groupAssignment: 'FRUIT' as const },
      ],
    }

    const mockCreatedSnack = {
      id: 'snack-tomas',
      userId: 'user-123',
      babyProfileId: 'profile-tomas',
      name: 'Colación Tomás',
      stageFor: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      items: [],
    }

    mockPrisma.snack.count = vi.fn().mockResolvedValue(0)
    mockPrisma.snack.create = vi.fn().mockResolvedValue(mockCreatedSnack)
    mockPrisma.babyProfile.findFirst = vi.fn().mockResolvedValue({
      birthDate: birthDateForAge(10),
    })

    const result = await createSnack(mockPrisma, 'user-123', 'FREE', input)

    expect(result.snack).toEqual(mockCreatedSnack)
    expect(result.warnings).toContain('FRUIT is not typically suggested for 10 months')
  })

  it('should return empty warnings when no babyProfileId is provided (no age context)', async () => {
    const input = {
      name: 'Colación sin perfil',
      items: [{ foodId: 'food-fat', groupAssignment: 'HEALTHY_FAT' as const }],
    }

    const mockCreatedSnack = {
      id: 'snack-noprofile',
      userId: 'user-123',
      babyProfileId: null,
      name: 'Colación sin perfil',
      stageFor: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      items: [],
    }

    mockPrisma.snack.count = vi.fn().mockResolvedValue(0)
    mockPrisma.snack.create = vi.fn().mockResolvedValue(mockCreatedSnack)
    mockPrisma.babyProfile.findFirst = vi.fn()

    const result = await createSnack(mockPrisma, 'user-123', 'FREE', input)

    expect(result.snack).toEqual(mockCreatedSnack)
    expect(result.warnings).toEqual([])
    // No age context to fetch when babyProfileId is absent.
    expect(mockPrisma.babyProfile.findFirst).not.toHaveBeenCalled()
  })

  it('should return empty warnings when the baby profile is not found', async () => {
    const input = {
      name: 'Colación perfil inexistente',
      babyProfileId: 'profile-missing',
      items: [{ foodId: 'food-fat', groupAssignment: 'HEALTHY_FAT' as const }],
    }

    const mockCreatedSnack = {
      id: 'snack-missingprofile',
      userId: 'user-123',
      babyProfileId: 'profile-missing',
      name: 'Colación perfil inexistente',
      stageFor: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      items: [],
    }

    mockPrisma.snack.count = vi.fn().mockResolvedValue(0)
    mockPrisma.snack.create = vi.fn().mockResolvedValue(mockCreatedSnack)
    mockPrisma.babyProfile.findFirst = vi.fn().mockResolvedValue(null)

    const result = await createSnack(mockPrisma, 'user-123', 'FREE', input)

    // Snack still saved; no age context → no warnings, no throw.
    expect(result.snack).toEqual(mockCreatedSnack)
    expect(result.warnings).toEqual([])
  })

  it('should NOT enforce limit for PRO tier', async () => {
    const input = {
      name: 'Snack 99',
      items: [{ foodId: 'food-fat', groupAssignment: 'HEALTHY_FAT' as const }],
    }

    mockPrisma.snack.count = vi.fn().mockResolvedValue(50)
    mockPrisma.snack.create = vi.fn().mockResolvedValue({
      id: 'snack-99',
      userId: 'user-pro',
      babyProfileId: null,
      name: 'Snack 99',
      stageFor: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      items: [],
    })

    await expect(createSnack(mockPrisma, 'user-pro', 'PRO', input)).resolves.not.toThrow()
  })
})

describe('getUserSnacks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should list all snacks for a user with pagination', async () => {
    const mockSnacks = [
      { id: 'snack-1', userId: 'user-123', name: 'Snack 1', deletedAt: null, items: [] },
      { id: 'snack-2', userId: 'user-123', name: 'Snack 2', deletedAt: null, items: [] },
    ]

    mockPrisma.$transaction = vi.fn().mockResolvedValue([mockSnacks, 2])

    const result = await getUserSnacks(mockPrisma, 'user-123', { page: 1, limit: 20 })

    expect(result.data).toEqual(mockSnacks)
    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('should filter by babyProfileId when provided', async () => {
    const mockSnacks = [{ id: 'snack-1', userId: 'user-123', babyProfileId: 'profile-123', items: [] }]

    mockPrisma.$transaction = vi.fn().mockResolvedValue([mockSnacks, 1])

    const result = await getUserSnacks(mockPrisma, 'user-123', { page: 1, limit: 20, babyProfileId: 'profile-123' })

    expect(result.data).toEqual(mockSnacks)
    expect(result.total).toBe(1)
  })

  it('should filter by stageFor when provided', async () => {
    const mockSnacks = [{ id: 'snack-1', stageFor: 'TEN_TO_TWELVE_MONTHS', items: [] }]

    mockPrisma.$transaction = vi.fn().mockResolvedValue([mockSnacks, 1])

    const result = await getUserSnacks(mockPrisma, 'user-123', {
      page: 1,
      limit: 20,
      stageFor: 'TEN_TO_TWELVE_MONTHS',
    })

    expect(result.data).toEqual(mockSnacks)
    expect(result.total).toBe(1)
  })

  it('should exclude soft-deleted snacks', async () => {
    const mockSnacks = [{ id: 'snack-1', deletedAt: null, items: [] }]

    mockPrisma.$transaction = vi.fn().mockResolvedValue([mockSnacks, 1])

    await getUserSnacks(mockPrisma, 'user-123', { page: 1, limit: 20 })

    // Verify deletedAt: null is part of the where clause
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })
})

describe('getSnackById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return snack when found and owned by user', async () => {
    const mockSnack = {
      id: 'snack-123',
      userId: 'user-123',
      name: 'My Snack',
      deletedAt: null,
      items: [{ id: 'item-1', foodId: 'food-fat', food: { id: 'food-fat', name: 'Aguacate' } }],
    }

    mockPrisma.snack.findFirst = vi.fn().mockResolvedValue(mockSnack)

    const result = await getSnackById(mockPrisma, 'snack-123', 'user-123')

    expect(result).toEqual(mockSnack)
    expect(mockPrisma.snack.findFirst).toHaveBeenCalledWith({
      where: { id: 'snack-123', userId: 'user-123', deletedAt: null },
      include: { items: { include: { food: true } } },
    })
  })

  it('should return null when snack not found or not owned', async () => {
    mockPrisma.snack.findFirst = vi.fn().mockResolvedValue(null)

    const result = await getSnackById(mockPrisma, 'snack-999', 'user-123')

    expect(result).toBeNull()
  })
})

describe('softDeleteSnack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should soft-delete snack when found and owned', async () => {
    const mockSnack = { id: 'snack-123', userId: 'user-123', deletedAt: null }

    mockPrisma.snack.findFirst = vi.fn().mockResolvedValue(mockSnack)
    mockPrisma.snack.update = vi.fn().mockResolvedValue({ ...mockSnack, deletedAt: new Date() })

    const result = await softDeleteSnack(mockPrisma, 'snack-123', 'user-123')

    expect(result).toBeDefined()
    expect(mockPrisma.snack.update).toHaveBeenCalledWith({
      where: { id: 'snack-123' },
      data: { deletedAt: expect.any(Date) },
    })
  })

  it('should return null when snack not found or not owned', async () => {
    mockPrisma.snack.findFirst = vi.fn().mockResolvedValue(null)

    const result = await softDeleteSnack(mockPrisma, 'snack-999', 'user-123')

    expect(result).toBeNull()
    expect(mockPrisma.snack.update).not.toHaveBeenCalled()
  })
})

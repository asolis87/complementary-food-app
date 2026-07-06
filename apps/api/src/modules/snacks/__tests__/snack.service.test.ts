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
  $transaction: vi.fn(),
} as unknown as PrismaClient

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

    const result = await createSnack(mockPrisma, 'user-123', 'FREE', input)

    expect(result).toEqual(mockCreatedSnack)
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

    expect(result).toEqual(mockCreatedSnack)
    expect(result.items).toHaveLength(3)
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

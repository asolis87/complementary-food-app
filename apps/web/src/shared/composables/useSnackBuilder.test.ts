/**
 * useSnackBuilder composable tests — isolated draft state per call-site.
 *
 * Mirrors usePlateBuilder test patterns:
 * - Each invocation gets isolated reactive draft state
 * - addFood replaces per zone (one food per snack group)
 * - saveSnack delegates to snackStore.createSnack and returns { snack, warnings }
 * - canSave gates on authentication + SNACK_LIMITS[tier]
 * - suggestedGroups derives from getSnackGroupsForAge
 *
 * Design: AD-1 — composable-owned draft state (not Pinia singleton).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Food, Snack } from '@pakulab/shared'

// Hoisted mocks
const { mockCreateSnack, mockSavedSnacks, mockIsAuthenticated, mockTier } = vi.hoisted(() => {
  const { ref } = require('vue')
  return {
    mockCreateSnack: vi.fn(),
    mockSavedSnacks: ref([]),
    mockIsAuthenticated: ref(true),
    mockTier: ref('PRO' as const),
  }
})

vi.mock('@/shared/stores/snackStore.js', () => ({
  useSnackStore: vi.fn(() => {
    // Pinia stores auto-unwrap refs, so accessing store.savedSnacks gives you the array directly, not a Ref
    const store = {
      get savedSnacks() {
        return mockSavedSnacks.value
      },
      createSnack: mockCreateSnack,
    }
    return store
  }),
}))

vi.mock('@/shared/stores/authStore.js', () => ({
  useAuthStore: vi.fn(() => ({
    get isAuthenticated() { return mockIsAuthenticated.value },
    get tier() { return mockTier.value },
  })),
}))

// Must import after mocks
import { useSnackBuilder } from './useSnackBuilder.js'
import { ref } from 'vue'

const mockFood: Food = {
  id: 'ckfoodid00000000000000001',
  name: 'Aguacate',
  group: 'HEALTHY_FAT',
  alClassification: 'neutral',
  alScore: 0,
  isAllergen: false,
  allergenType: null,
  isIronRich: false,
  ageMonths: 6,
  needsValidation: false,
  warningTags: [],
  createdAt: '',
  updatedAt: '',
}

const mockSnack: Snack = {
  id: 'cksnackid0000000000000001',
  userId: 'u1',
  babyProfileId: null,
  name: 'Aguacate picado',
  stageFor: 'TEN_TO_TWELVE_MONTHS',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
  items: [],
}

describe('useSnackBuilder — draft isolation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsAuthenticated.value = true
    mockTier.value = 'PRO'
  })

  it('creates isolated draft state per call-site', () => {
    const builder1 = useSnackBuilder({ ageMonths: ref(11) })
    const builder2 = useSnackBuilder({ ageMonths: ref(15) })

    builder1.draftName.value = 'Colación A'
    builder2.draftName.value = 'Colación B'

    expect(builder1.draftName.value).toBe('Colación A')
    expect(builder2.draftName.value).toBe('Colación B')

    // AD-1: draftItems must be isolated too, not just draftName. Mutating one
    // builder's items must NOT leak into the other (proves no shared singleton).
    builder1.addFood(mockFood, 'HEALTHY_FAT')
    expect(builder1.draftItems.value).toHaveLength(1)
    expect(builder2.draftItems.value).toHaveLength(0)
  })
})

describe('useSnackBuilder — addFood/removeFood', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsAuthenticated.value = true
    mockTier.value = 'PRO'
  })

  it('addFood replaces existing item in the same group', () => {
    const builder = useSnackBuilder({ ageMonths: ref(11) })
    const food1: Food = { ...mockFood, id: 'food1', name: 'Aguacate' }
    const food2: Food = { ...mockFood, id: 'food2', name: 'Aceite de oliva' }

    builder.addFood(food1, 'HEALTHY_FAT')
    expect(builder.draftItems.value).toHaveLength(1)
    expect(builder.draftItems.value[0].food.id).toBe('food1')

    builder.addFood(food2, 'HEALTHY_FAT')
    expect(builder.draftItems.value).toHaveLength(1)
    expect(builder.draftItems.value[0].food.id).toBe('food2')
  })

  it('addFood allows one food per snack group (3 groups max)', () => {
    const builder = useSnackBuilder({ ageMonths: ref(15) })
    const fat: Food = { ...mockFood, id: 'fat', name: 'Aguacate', group: 'HEALTHY_FAT' }
    const cereal: Food = { ...mockFood, id: 'cereal', name: 'Pan', group: 'CEREAL_TUBER' }
    const fruit: Food = { ...mockFood, id: 'fruit', name: 'Manzana', group: 'FRUIT' }

    builder.addFood(fat, 'HEALTHY_FAT')
    builder.addFood(cereal, 'CEREAL_TUBER')
    builder.addFood(fruit, 'FRUIT')

    expect(builder.draftItems.value).toHaveLength(3)
    expect(builder.draftItems.value.map(i => i.groupAssignment)).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER', 'FRUIT'])
  })

  it('removeFood removes item by localId', () => {
    const builder = useSnackBuilder({ ageMonths: ref(11) })
    builder.addFood(mockFood, 'HEALTHY_FAT')
    const localId = builder.draftItems.value[0].id

    builder.removeFood(localId)

    expect(builder.draftItems.value).toHaveLength(0)
  })
})

describe('useSnackBuilder — isValid/canSave', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsAuthenticated.value = true
    mockTier.value = 'PRO'
    mockSavedSnacks.value = []
  })

  it('isValid is true when hasItems and name is non-empty', () => {
    const builder = useSnackBuilder({ ageMonths: ref(11) })
    expect(builder.isValid.value).toBe(false)

    builder.addFood(mockFood, 'HEALTHY_FAT')
    expect(builder.isValid.value).toBe(true)

    builder.draftName.value = ''
    expect(builder.isValid.value).toBe(false)

    builder.draftName.value = 'Test'
    expect(builder.isValid.value).toBe(true)
  })

  it('canSave is false when not authenticated', () => {
    mockIsAuthenticated.value = false
    const builder = useSnackBuilder({ ageMonths: ref(11) })
    builder.addFood(mockFood, 'HEALTHY_FAT')

    expect(builder.canSave.value).toBe(false)
  })

  it('canSave is false when at SNACK_LIMITS[tier]', () => {
    mockTier.value = 'FREE'
    const builder = useSnackBuilder({ ageMonths: ref(11) })
    // FREE tier has SNACK_LIMITS.FREE = 0

    expect(builder.canSave.value).toBe(false)
  })

  it('canSave is true when authenticated and under limit', () => {
    mockTier.value = 'PRO'
    mockSavedSnacks.value = []
    mockIsAuthenticated.value = true
    const builder = useSnackBuilder({ ageMonths: ref(11) })

    expect(builder.canSave.value).toBe(true)
  })
})

describe('useSnackBuilder — suggestedGroups', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsAuthenticated.value = true
    mockTier.value = 'PRO'
  })

  it('suggestedGroups derives from getSnackGroupsForAge(11m) → [HEALTHY_FAT, CEREAL_TUBER]', () => {
    const builder = useSnackBuilder({ ageMonths: ref(11) })

    expect(builder.suggestedGroups.value).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER'])
  })

  it('suggestedGroups for 15m → [HEALTHY_FAT, CEREAL_TUBER, FRUIT]', () => {
    const builder = useSnackBuilder({ ageMonths: ref(15) })

    expect(builder.suggestedGroups.value).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER', 'FRUIT'])
  })

  it('isSuggested returns true for suggested groups', () => {
    const builder = useSnackBuilder({ ageMonths: ref(11) })

    expect(builder.isSuggested('HEALTHY_FAT')).toBe(true)
    expect(builder.isSuggested('CEREAL_TUBER')).toBe(true)
    expect(builder.isSuggested('FRUIT')).toBe(false)
  })
})

describe('useSnackBuilder — saveSnack', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsAuthenticated.value = true
    mockTier.value = 'PRO'
  })

  it('calls snackStore.createSnack and returns { snack, warnings }', async () => {
    const warnings = ['Missing FRUIT group for age 15m']
    mockCreateSnack.mockResolvedValueOnce({ snack: mockSnack, warnings })
    const builder = useSnackBuilder({ ageMonths: ref(15) })
    builder.draftName.value = 'Aguacate picado'
    builder.addFood(mockFood, 'HEALTHY_FAT')

    const result = await builder.saveSnack()

    expect(mockCreateSnack).toHaveBeenCalledWith({
      name: 'Aguacate picado',
      stageFor: undefined,
      items: [{ foodId: mockFood.id, groupAssignment: 'HEALTHY_FAT' }],
    })
    expect(result.snack).toEqual(mockSnack)
    expect(result.warnings).toEqual(warnings)
    expect(builder.lastWarnings.value).toEqual(warnings)
  })

  it('invokes onSaved callback when provided', async () => {
    mockCreateSnack.mockResolvedValueOnce({ snack: mockSnack, warnings: [] })
    const onSaved = vi.fn()
    const builder = useSnackBuilder({ ageMonths: ref(11), onSaved })
    builder.addFood(mockFood, 'HEALTHY_FAT')

    await builder.saveSnack()

    expect(onSaved).toHaveBeenCalledWith(mockSnack)
  })
})

describe('useSnackBuilder — resetDraft', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsAuthenticated.value = true
    mockTier.value = 'PRO'
  })

  it('clears items and name', () => {
    const builder = useSnackBuilder({ ageMonths: ref(11) })
    builder.draftName.value = 'Test'
    builder.addFood(mockFood, 'HEALTHY_FAT')

    builder.resetDraft()

    expect(builder.draftItems.value).toHaveLength(0)
    expect(builder.draftName.value).toBe('Mi colación')
  })
})

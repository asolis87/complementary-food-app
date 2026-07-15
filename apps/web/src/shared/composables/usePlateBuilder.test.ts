/**
 * Tests for usePlateBuilder — loadPlateIntoDraft warningTags preservation
 * and serving amount logic (REQ-B1, REQ-B2, REQ-B3).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Plate } from '@pakulab/shared'
import { usePlateBuilder } from './usePlateBuilder'

function makePlate(overrides: Partial<Plate> = {}): Plate {
  return {
    id: 'plate-1',
    userId: 'user-1',
    babyProfileId: null,
    name: 'Plato de prueba',
    groupCount: 4,
    stageFor: null,
    balanceScore: 0,
    astringentCount: 0,
    laxativeCount: 0,
    neutralCount: 0,
    deletedAt: null,
    createdAt: '',
    updatedAt: '',
    items: [
      {
        id: 'item-1',
        plateId: 'plate-1',
        foodId: 'food-1',
        groupAssignment: 'FRUIT',
        servingAmount: null,
        createdAt: '',
        food: {
          id: 'food-1',
          name: 'Uvas (sin semilla, en cuartos)',
          group: 'FRUIT',
          alClassification: 'NEUTRAL',
          ageMonths: 9,
          isAllergen: false,
          allergenType: null,
          warningTags: ['CHOKING_HAZARD_UNDER_5Y', 'REQUIRES_PREPARATION'],
        },
      },
    ],
    ...overrides,
  }
}

describe('usePlateBuilder — loadPlateIntoDraft', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('preserves warningTags from the saved plate into the draft (edit path)', () => {
    const builder = usePlateBuilder()
    builder.loadPlateIntoDraft(makePlate())

    expect(builder.draftItems.value).toHaveLength(1)
    expect(builder.draftItems.value[0]!.food.warningTags).toEqual([
      'CHOKING_HAZARD_UNDER_5Y',
      'REQUIRES_PREPARATION',
    ])
  })

  it('defaults to [] when the loaded food has no warningTags', () => {
    const plate = makePlate()
    // Simulate a food whose warningTags is absent (partial data)
    delete (plate.items![0]!.food as { warningTags?: unknown }).warningTags
    const builder = usePlateBuilder()
    builder.loadPlateIntoDraft(plate)

    expect(builder.draftItems.value[0]!.food.warningTags).toEqual([])
  })

  // PR-7 dead-badge regression tests (T-05-06 + T-04-02)
  it('preserves stageFor from saved plate into draft (dead-badge trap fix)', () => {
    // RED: would FAIL if loadPlateIntoDraft hardcoded draftStageFor.value = null
    // GREEN: PASSES because line 164 reads plate.stageFor ?? null
    const plate = makePlate({ stageFor: 'TEN_TO_TWELVE_MONTHS' })
    const builder = usePlateBuilder()
    builder.loadPlateIntoDraft(plate)

    expect(builder.draftStageFor.value).toBe('TEN_TO_TWELVE_MONTHS')
  })

  it('preserves servingAmount from saved PlateItems into draft (dead-badge trap fix)', () => {
    // RED: would FAIL if loadPlateIntoDraft hardcoded servingAmount: null for all items
    // GREEN: PASSES because line 186 reads item.servingAmount ?? null
    const plate = makePlate({
      items: [
        {
          id: 'item-1',
          plateId: 'plate-1',
          foodId: 'food-1',
          groupAssignment: 'PROTEIN',
          servingAmount: '3', // Explicitly set 3 cdas
          createdAt: '',
          food: {
            id: 'food-1',
            name: 'Huevo',
            group: 'PROTEIN',
            alClassification: 'NEUTRAL',
            ageMonths: 6,
            isAllergen: true,
            allergenType: 'egg',
            warningTags: [],
          },
        },
      ],
    })
    const builder = usePlateBuilder()
    builder.loadPlateIntoDraft(plate)

    expect(builder.draftItems.value).toHaveLength(1)
    expect(builder.draftItems.value[0]!.servingAmount).toBe('3')
  })

  it('defaults servingAmount to null when PlateItem has no servingAmount', () => {
    const plate = makePlate({
      items: [
        {
          id: 'item-1',
          plateId: 'plate-1',
          foodId: 'food-1',
          groupAssignment: 'FRUIT',
          servingAmount: null, // Explicitly null
          createdAt: '',
          food: {
            id: 'food-1',
            name: 'Manzana',
            group: 'FRUIT',
            alClassification: 'NEUTRAL',
            ageMonths: 6,
            isAllergen: false,
            warningTags: [],
          },
        },
      ],
    })
    const builder = usePlateBuilder()
    builder.loadPlateIntoDraft(plate)

    expect(builder.draftItems.value[0]!.servingAmount).toBeNull()
  })
})

describe('usePlateBuilder — serving amount logic (REQ-B1, B2, B3)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('totalServingAmount defaults to item count when no servingAmount set (1 cda per item)', () => {
    const plate = makePlate({
      items: [
        {
          id: 'item-1',
          plateId: 'plate-1',
          foodId: 'food-1',
          groupAssignment: 'FRUIT',
          servingAmount: null,
          createdAt: '',
          food: {
            id: 'food-1',
            name: 'Manzana',
            group: 'FRUIT',
            alClassification: 'NEUTRAL',
            ageMonths: 6,
            isAllergen: false,
            warningTags: [],
          },
        },
        {
          id: 'item-2',
          plateId: 'plate-1',
          foodId: 'food-2',
          groupAssignment: 'PROTEIN',
          servingAmount: null,
          createdAt: '',
          food: {
            id: 'food-2',
            name: 'Pollo',
            group: 'PROTEIN',
            alClassification: 'NEUTRAL',
            ageMonths: 6,
            isAllergen: false,
            warningTags: [],
          },
        },
      ],
    })
    const builder = usePlateBuilder()
    builder.loadPlateIntoDraft(plate)

    // REQ-B1: default 1 cda per item → 2 items = 2 cdas
    expect(builder.totalServingAmount.value).toBe(2)
  })

  it('totalServingAmount sums explicit servingAmounts', () => {
    const plate = makePlate({
      items: [
        {
          id: 'item-1',
          plateId: 'plate-1',
          foodId: 'food-1',
          groupAssignment: 'FRUIT',
          servingAmount: '2',
          createdAt: '',
          food: {
            id: 'food-1',
            name: 'Manzana',
            group: 'FRUIT',
            alClassification: 'NEUTRAL',
            ageMonths: 6,
            isAllergen: false,
            warningTags: [],
          },
        },
        {
          id: 'item-2',
          plateId: 'plate-1',
          foodId: 'food-2',
          groupAssignment: 'PROTEIN',
          servingAmount: '3',
          createdAt: '',
          food: {
            id: 'food-2',
            name: 'Pollo',
            group: 'PROTEIN',
            alClassification: 'NEUTRAL',
            ageMonths: 6,
            isAllergen: false,
            warningTags: [],
          },
        },
      ],
    })
    const builder = usePlateBuilder()
    builder.loadPlateIntoDraft(plate)

    // REQ-B2: 2 + 3 = 5 cdas
    expect(builder.totalServingAmount.value).toBe(5)
  })

  it('hasExcessServing is false when all groups <= 4 cdas', () => {
    const plate = makePlate({
      items: [
        {
          id: 'item-1',
          plateId: 'plate-1',
          foodId: 'food-1',
          groupAssignment: 'FRUIT',
          servingAmount: '4',
          createdAt: '',
          food: {
            id: 'food-1',
            name: 'Manzana',
            group: 'FRUIT',
            alClassification: 'NEUTRAL',
            ageMonths: 6,
            isAllergen: false,
            warningTags: [],
          },
        },
        {
          id: 'item-2',
          plateId: 'plate-1',
          foodId: 'food-2',
          groupAssignment: 'PROTEIN',
          servingAmount: '4',
          createdAt: '',
          food: {
            id: 'food-2',
            name: 'Pollo',
            group: 'PROTEIN',
            alClassification: 'NEUTRAL',
            ageMonths: 6,
            isAllergen: false,
            warningTags: [],
          },
        },
      ],
    })
    const builder = usePlateBuilder()
    builder.loadPlateIntoDraft(plate)

    // REQ-B3: max per group is 4, no excess
    expect(builder.hasExcessServing.value).toBe(false)
  })

  it('hasExcessServing is true when any single group > 4 cdas', () => {
    const plate = makePlate({
      items: [
        {
          id: 'item-1',
          plateId: 'plate-1',
          foodId: 'food-1',
          groupAssignment: 'PROTEIN',
          servingAmount: '5',
          createdAt: '',
          food: {
            id: 'food-1',
            name: 'Pollo',
            group: 'PROTEIN',
            alClassification: 'NEUTRAL',
            ageMonths: 6,
            isAllergen: false,
            warningTags: [],
          },
        },
      ],
    })
    const builder = usePlateBuilder()
    builder.loadPlateIntoDraft(plate)

    // REQ-B3: PROTEIN has 5 cdas, exceeds threshold
    expect(builder.hasExcessServing.value).toBe(true)
  })

  it('updateServingAmount changes item servingAmount and reflects in total', () => {
    const builder = usePlateBuilder()
    builder.addFood(
      {
        id: 'food-1',
        name: 'Manzana',
        group: 'FRUIT',
        alClassification: 'NEUTRAL',
        alScore: 0,
        ageMonths: 6,
        isAllergen: false,
        needsValidation: false,
        warningTags: [],
        createdAt: '',
        updatedAt: '',
      },
      'FRUIT',
    )

    const localId = builder.draftItems.value[0]!.id
    expect(builder.totalServingAmount.value).toBe(1) // Default

    builder.updateServingAmount(localId, '3')
    expect(builder.draftItems.value[0]!.servingAmount).toBe('3')
    expect(builder.totalServingAmount.value).toBe(3)
  })
})

describe('usePlateBuilder — applyStageHintIfUnset (REQ-C2 stage default)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('sets the stage when the draft currently has no stage (initial state)', () => {
    const builder = usePlateBuilder()
    expect(builder.draftStageFor.value).toBeNull()

    builder.applyStageHintIfUnset('TEN_TO_TWELVE_MONTHS')

    expect(builder.draftStageFor.value).toBe('TEN_TO_TWELVE_MONTHS')
  })

  it('does not overwrite an explicit manual choice (sticky-once-set)', () => {
    const builder = usePlateBuilder()
    builder.setStageFor('FAMILY_TABLE')

    builder.applyStageHintIfUnset('TEN_TO_TWELVE_MONTHS')

    expect(builder.draftStageFor.value).toBe('FAMILY_TABLE')
  })

  it('does not overwrite a previously-applied hint when the age changes', () => {
    const builder = usePlateBuilder()

    // First sync of profile data — hint applied, age=10m => TEN_TO_TWELVE_MONTHS.
    builder.applyStageHintIfUnset('TEN_TO_TWELVE_MONTHS')
    expect(builder.draftStageFor.value).toBe('TEN_TO_TWELVE_MONTHS')

    // Profile switches to a different baby (age=18m). The user has not picked
    // anything manually, BUT the hint was already applied to the previous baby.
    // Contract: do NOT overwrite — the user must opt in.
    builder.applyStageHintIfUnset('THIRTEEN_TO_TWENTY_THREE_MONTHS')
    expect(builder.draftStageFor.value).toBe('TEN_TO_TWELVE_MONTHS')
  })
})

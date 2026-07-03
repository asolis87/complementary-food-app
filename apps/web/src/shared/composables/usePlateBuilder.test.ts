/**
 * Tests for usePlateBuilder — loadPlateIntoDraft warningTags preservation.
 * Regression guard for the dead-badge-on-edit bug: when a saved plate is
 * loaded for editing, the food's safety warningTags must survive into the
 * draft (they were previously hardcoded to [], silently dropping choking/
 * prohibited warnings on the edit path).
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

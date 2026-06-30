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
    name: 'Plato de prueba',
    groupCount: 4,
    balanceScore: 0,
    astringentCount: 0,
    laxativeCount: 0,
    neutralCount: 0,
    createdAt: '',
    updatedAt: '',
    items: [
      {
        id: 'item-1',
        foodId: 'food-1',
        groupAssignment: 'FRUIT',
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
})

/**
 * Tests for SnackVisualization.vue — bento-box layout (REQ-SC7: NO A/L balance).
 * Verifies the 3-cell bento (HEALTHY_FAT, CEREAL_TUBER, FRUIT), age-based cell
 * locking (a cell is enabled only when its group is age-suggested), tap emits
 * only for enabled cells, the <10m all-locked age hint, and NO balance indicator.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import type { FoodGroup } from '@pakulab/shared'
import type { PlateItemDraft } from '@/shared/stores/plateStore.js'
import SnackVisualization from '../SnackVisualization.vue'

function makeDraftItem(group: FoodGroup, foodName: string): PlateItemDraft {
  return {
    id: `${foodName}-${Math.random()}`,
    food: {
      id: `food-${foodName}`,
      name: foodName,
      group,
      alClassification: 'NEUTRAL',
      alScore: 0,
      isAllergen: false,
      allergenType: null,
      ageMonths: 6,
      needsValidation: false,
      warningTags: [],
      createdAt: '',
      updatedAt: '',
    },
    groupAssignment: group,
    servingAmount: null,
  }
}

function mountVisualization(items: PlateItemDraft[], suggestedGroups: FoodGroup[] = []) {
  return mount(SnackVisualization, {
    props: {
      items,
      suggestedGroups,
    },
  })
}

// All three snack groups suggested → the ≥13m case (every cell enabled).
const ALL_GROUPS: FoodGroup[] = ['HEALTHY_FAT', 'CEREAL_TUBER', 'FRUIT']
// The 10-12m case → fruit is not suggested (locked).
const TWO_GROUPS: FoodGroup[] = ['HEALTHY_FAT', 'CEREAL_TUBER']

describe('SnackVisualization — bento box (REQ-SC7)', () => {
  it('renders exactly 3 bento cells: HEALTHY_FAT, CEREAL_TUBER, FRUIT', () => {
    const wrapper = mountVisualization([], ALL_GROUPS)

    expect(wrapper.find('.cell-fat').exists()).toBe(true)
    expect(wrapper.find('.cell-cereal').exists()).toBe(true)
    expect(wrapper.find('.cell-fruit').exists()).toBe(true)
    expect(wrapper.findAll('.cell')).toHaveLength(3)

    // No VEGETABLE or PROTEIN cells
    expect(wrapper.find('.cell-vegetable').exists()).toBe(false)
    expect(wrapper.find('.cell-protein').exists()).toBe(false)
  })

  it('displays food name in the correct cell when an item is assigned', () => {
    const items = [
      makeDraftItem('HEALTHY_FAT', 'Aguacate'),
      makeDraftItem('CEREAL_TUBER', 'Avena'),
      makeDraftItem('FRUIT', 'Manzana'),
    ]
    const wrapper = mountVisualization(items, ALL_GROUPS)

    const html = wrapper.html()
    expect(html).toContain('Aguacate')
    expect(html).toContain('Avena')
    expect(html).toContain('Manzana')
  })

  it('shows "Vacío" only in enabled empty cells', () => {
    // ≥13m: all 3 enabled and empty → 3 "Vacío"
    const all = mountVisualization([], ALL_GROUPS)
    expect((all.html().match(/Vacío/g) || []).length).toBe(3)

    // 10-12m: fruit locked → the locked cell shows no "Vacío" hint (2 enabled)
    const two = mountVisualization([], TWO_GROUPS)
    expect((two.html().match(/Vacío/g) || []).length).toBe(2)
  })

  describe('age-based cell locking', () => {
    it('≥13m: all three cells enabled (not locked)', () => {
      const wrapper = mountVisualization([], ALL_GROUPS)
      expect(wrapper.find('.cell-fat').classes()).not.toContain('cell--locked')
      expect(wrapper.find('.cell-cereal').classes()).not.toContain('cell--locked')
      expect(wrapper.find('.cell-fruit').classes()).not.toContain('cell--locked')
      expect(wrapper.find('.cell-fruit').attributes('disabled')).toBeUndefined()
    })

    it('10-12m: fruit cell is locked and disabled, the other two enabled', () => {
      const wrapper = mountVisualization([], TWO_GROUPS)
      expect(wrapper.find('.cell-fat').classes()).not.toContain('cell--locked')
      expect(wrapper.find('.cell-cereal').classes()).not.toContain('cell--locked')

      const fruit = wrapper.find('.cell-fruit')
      expect(fruit.classes()).toContain('cell--locked')
      expect(fruit.attributes('disabled')).toBeDefined()
    })

    it('<10m: all cells locked + shows the age hint', () => {
      const wrapper = mountVisualization([], []) // no suggested groups
      expect(wrapper.find('.cell-fat').classes()).toContain('cell--locked')
      expect(wrapper.find('.cell-cereal').classes()).toContain('cell--locked')
      expect(wrapper.find('.cell-fruit').classes()).toContain('cell--locked')
      expect(wrapper.find('.bento-age-hint').exists()).toBe(true)
      expect(wrapper.text()).toContain('a partir de los 10 meses')
    })

    it('does not show the age hint when at least one group is suggested', () => {
      expect(mountVisualization([], TWO_GROUPS).find('.bento-age-hint').exists()).toBe(false)
      expect(mountVisualization([], ALL_GROUPS).find('.bento-age-hint').exists()).toBe(false)
    })
  })

  describe('tap behavior respects the age gate', () => {
    it('emits "select-group" for enabled cells', async () => {
      const wrapper = mountVisualization([], ALL_GROUPS)

      await wrapper.find('.cell-fat').trigger('click')
      await wrapper.find('.cell-cereal').trigger('click')
      await wrapper.find('.cell-fruit').trigger('click')

      expect(wrapper.emitted('select-group')).toEqual([
        ['HEALTHY_FAT'],
        ['CEREAL_TUBER'],
        ['FRUIT'],
      ])
    })

    it('does NOT emit when a locked cell is tapped (10-12m fruit)', async () => {
      const wrapper = mountVisualization([], TWO_GROUPS)

      await wrapper.find('.cell-fruit').trigger('click')
      expect(wrapper.emitted('select-group')).toBeUndefined()

      // The enabled cells still emit
      await wrapper.find('.cell-fat').trigger('click')
      expect(wrapper.emitted('select-group')).toEqual([['HEALTHY_FAT']])
    })
  })

  it('does NOT render any A/L balance indicator (REQ-SC7)', () => {
    const items = [
      makeDraftItem('HEALTHY_FAT', 'Aguacate'),
      makeDraftItem('CEREAL_TUBER', 'Avena'),
      makeDraftItem('FRUIT', 'Manzana'),
    ]
    const wrapper = mountVisualization(items, ALL_GROUPS)

    expect(wrapper.find('.balance-bar').exists()).toBe(false)
    expect(wrapper.find('.balance-indicator').exists()).toBe(false)
    expect(wrapper.find('[class*="balance"]').exists()).toBe(false)

    const html = wrapper.html()
    expect(html).not.toMatch(/equilibrado|astringente|laxante/i)
  })
})

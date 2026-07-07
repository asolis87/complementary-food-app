/**
 * Tests for SnackVisualization.vue (REQ-SC7 — NO A/L balance indicator).
 * Verifies the dedicated 3-zone circular layout (HEALTHY_FAT, CEREAL_TUBER, FRUIT),
 * zone tap emits select event, suggested zones are emphasized, and NO balance indicator exists.
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

describe('SnackVisualization — 3-zone dedicated component (REQ-SC7)', () => {
  it('renders exactly 3 zones: HEALTHY_FAT, CEREAL_TUBER, FRUIT', () => {
    const wrapper = mountVisualization([])

    expect(wrapper.find('.segment-fat').exists()).toBe(true)
    expect(wrapper.find('.segment-cereal').exists()).toBe(true)
    expect(wrapper.find('.segment-fruit').exists()).toBe(true)

    // Should NOT have VEGETABLE or PROTEIN zones
    expect(wrapper.find('.segment-vegetable').exists()).toBe(false)
    expect(wrapper.find('.segment-protein').exists()).toBe(false)
  })

  it('displays food name in the correct zone when an item is assigned', () => {
    const items = [
      makeDraftItem('HEALTHY_FAT', 'Aguacate'),
      makeDraftItem('CEREAL_TUBER', 'Avena'),
      makeDraftItem('FRUIT', 'Manzana'),
    ]
    const wrapper = mountVisualization(items)

    const html = wrapper.html()
    expect(html).toContain('Aguacate')
    expect(html).toContain('Avena')
    expect(html).toContain('Manzana')
  })

  it('shows "Vacío" placeholder in empty zones', () => {
    const wrapper = mountVisualization([])

    const html = wrapper.html()
    const emptyCount = (html.match(/Vacío/g) || []).length
    expect(emptyCount).toBe(3) // All 3 zones empty
  })

  it('emits "select-group" event when a zone is tapped', async () => {
    const wrapper = mountVisualization([])

    await wrapper.find('.segment-fat').trigger('click')
    expect(wrapper.emitted('select-group')).toEqual([['HEALTHY_FAT']])

    await wrapper.find('.segment-cereal').trigger('click')
    expect(wrapper.emitted('select-group')).toEqual([['HEALTHY_FAT'], ['CEREAL_TUBER']])

    await wrapper.find('.segment-fruit').trigger('click')
    expect(wrapper.emitted('select-group')).toEqual([['HEALTHY_FAT'], ['CEREAL_TUBER'], ['FRUIT']])
  })

  it('emphasizes suggested zones (11m baby: HEALTHY_FAT + CEREAL_TUBER)', () => {
    const wrapper = mountVisualization([], ['HEALTHY_FAT', 'CEREAL_TUBER'])

    const fatZone = wrapper.find('.segment-fat')
    const cerealZone = wrapper.find('.segment-cereal')
    const fruitZone = wrapper.find('.segment-fruit')

    expect(fatZone.classes()).toContain('segment--suggested')
    expect(cerealZone.classes()).toContain('segment--suggested')
    expect(fruitZone.classes()).not.toContain('segment--suggested')
  })

  it('does NOT render any A/L balance indicator (REQ-SC7)', () => {
    const items = [
      makeDraftItem('HEALTHY_FAT', 'Aguacate'),
      makeDraftItem('CEREAL_TUBER', 'Avena'),
      makeDraftItem('FRUIT', 'Manzana'),
    ]
    const wrapper = mountVisualization(items)

    // Search for any balance-related elements that PlateVisualization might have
    expect(wrapper.find('.balance-bar').exists()).toBe(false)
    expect(wrapper.find('.balance-indicator').exists()).toBe(false)
    expect(wrapper.find('[class*="balance"]').exists()).toBe(false)

    const html = wrapper.html()
    expect(html).not.toMatch(/equilibrado|astringente|laxante/i)
  })
})

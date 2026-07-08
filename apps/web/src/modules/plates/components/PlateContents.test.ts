/**
 * Tests for PlateContents — serving amount selector (REQ-B1).
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PlateContents from './PlateContents.vue'
import type { PlateItemDraft } from '@/shared/stores/plateStore'

function makeDraftItem(overrides: Partial<PlateItemDraft> = {}): PlateItemDraft {
  return {
    id: 'item-1',
    food: {
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
    groupAssignment: 'FRUIT',
    servingAmount: null,
    ...overrides,
  }
}

describe('PlateContents — serving amount selector (REQ-B1)', () => {
  it('should render serving amount selector with default "1 cda" for new item', () => {
    const items = [makeDraftItem()]
    const wrapper = mount(PlateContents, {
      props: {
        items,
        groupCount: 4,
      },
    })

    const selector = wrapper.find('.serving-selector')
    expect(selector.exists()).toBe(true)
    expect(selector.element.value).toBe('1') // Default when servingAmount is null
  })

  it('should render serving amount selector with saved value for existing item', () => {
    const items = [makeDraftItem({ servingAmount: '3' })]
    const wrapper = mount(PlateContents, {
      props: {
        items,
        groupCount: 4,
      },
    })

    const selector = wrapper.find('.serving-selector')
    expect(selector.element.value).toBe('3')
  })

  it('should emit update-serving-amount when selector changes', async () => {
    const items = [makeDraftItem()]
    const wrapper = mount(PlateContents, {
      props: {
        items,
        groupCount: 4,
      },
    })

    const selector = wrapper.find('.serving-selector')
    await selector.setValue('4')

    expect(wrapper.emitted('update-serving-amount')).toBeTruthy()
    expect(wrapper.emitted('update-serving-amount')![0]).toEqual(['item-1', '4'])
  })
})

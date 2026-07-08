/**
 * Tests for FoodSearchModal.vue (T-04-13 — WarningBadge + warning panel).
 * Verifies the safety panel renders from real food.warningTags, shows the
 * es-MX descriptions + pediatra disclaimer, and leaves the add button enabled
 * (REQ-4-B2: warnings are informative, never block adding the food).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Food } from '@pakulab/shared'
import FoodSearchModal from './FoodSearchModal.vue'

function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: 'food-1',
    name: 'Uvas (sin semilla, en cuartos)',
    group: 'FRUIT',
    alClassification: 'NEUTRAL',
    alScore: 0,
    isAllergen: false,
    allergenType: null,
    ageMonths: 9,
    needsValidation: false,
    warningTags: ['CHOKING_HAZARD_UNDER_5Y', 'REQUIRES_PREPARATION'],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function mountModal(groupFoods: Food[]) {
  return mount(FoodSearchModal, {
    props: {
      isOpen: true,
      group: 'FRUIT',
      groupFoods,
      currentItems: [],
    },
    global: {
      stubs: {
        teleport: true,
        transition: false,
      },
    },
  })
}

describe('FoodSearchModal — WarningBadge + warning panel (T-04-13)', () => {
  it('renders the warning panel with es-MX descriptions for a tagged food', () => {
    const wrapper = mountModal([makeFood()])

    expect(wrapper.find('.warning-panel').exists()).toBe(true)
    const html = wrapper.html()
    expect(html).toContain('Riesgo de atragantamiento en menores de 5 años')
    expect(html).toContain('Requiere preparación específica (cocción/corte)')
    expect(html).toContain('Si tienes dudas, consulta a tu pediatra.')
  })

  it('renders the WarningBadge icon for a tagged food', () => {
    const wrapper = mountModal([makeFood()])
    expect(wrapper.find('.warning-badge').exists()).toBe(true)
  })

  it('keeps the add button enabled even when the food has warnings (REQ-4-B2)', () => {
    const wrapper = mountModal([makeFood()])
    const addButton = wrapper.find('.food-btn')
    expect(addButton.exists()).toBe(true)
    expect(addButton.attributes('disabled')).toBeUndefined()
  })

  it('does NOT render a warning panel for a food without tags', () => {
    const wrapper = mountModal([makeFood({ id: 'food-2', name: 'Plátano maduro', warningTags: [] })])

    expect(wrapper.find('.warning-panel').exists()).toBe(false)
    expect(wrapper.find('.warning-badge').exists()).toBe(false)
  })
})

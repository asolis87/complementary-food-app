/**
 * Tests for FoodSearchPage.vue (T-04-12 — WarningBadge integration).
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import FoodSearchPage from './FoodSearchPage.vue'
import type { Food } from '@pakulab/shared'

describe('FoodSearchPage — WarningBadge integration (T-04-12)', () => {
  const mockFoodWithTag: Food = {
    id: 'food-1',
    name: 'Miel',
    group: 'HEALTHY_FAT',
    alClassification: 'NEUTRAL',
    alScore: 0,
    isAllergen: false,
    ageMonths: 24,
    needsValidation: false,
    warningTags: ['PROHIBITED_UNDER_24M'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockFoodWithoutTag: Food = {
    id: 'food-2',
    name: 'Manzana',
    group: 'FRUIT',
    alClassification: 'NEUTRAL',
    alScore: 0,
    isAllergen: false,
    ageMonths: 6,
    needsValidation: false,
    warningTags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it('should render WarningBadge for food with warningTags', async () => {
    const pinia = createPinia()
    const wrapper = mount(FoodSearchPage, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
        mocks: {
          $router: {
            push: vi.fn(),
          },
        },
      },
    })

    // Mock the food store state
    const foodStore = wrapper.vm.store as unknown as { foods: Food[], totalCount: number, filters: Record<string, unknown> }
    foodStore.foods = [mockFoodWithTag]
    foodStore.totalCount = 1
    foodStore.filters = { search: '', group: null, alClassification: null, ageMonths: null }

    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('warning-badge')
    expect(wrapper.html()).toContain('⚠️')
  })

  it('should NOT render WarningBadge for food without warningTags', async () => {
    const pinia = createPinia()
    const wrapper = mount(FoodSearchPage, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
        mocks: {
          $router: {
            push: vi.fn(),
          },
        },
      },
    })

    // Mock the food store state
    const foodStore = wrapper.vm.store as unknown as { foods: Food[], totalCount: number, filters: Record<string, unknown> }
    foodStore.foods = [mockFoodWithoutTag]
    foodStore.totalCount = 1
    foodStore.filters = { search: '', group: null, alClassification: null, ageMonths: null }

    await wrapper.vm.$nextTick()
    // Should not contain warning-badge when warningTags is empty
    const html = wrapper.html()
    const hasWarningBadge = html.includes('class="warning-badge"')
    expect(hasWarningBadge).toBe(false)
  })
})

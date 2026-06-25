/**
 * AllergenAlertsCard component tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed } from 'vue'
import AllergenAlertsCard from './AllergenAlertsCard.vue'
import type { AllergenAlert } from '@pakulab/shared'

// Mock authStore for TierGate
vi.mock('@/shared/stores/authStore.js', () => ({
  useAuthStore: vi.fn(() => ({
    tier: computed(() => 'PRO'),
    isPro: computed(() => true),
    isFree: computed(() => false),
    isAuthenticated: computed(() => true),
  })),
}))

describe('AllergenAlertsCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const normalAllergen: AllergenAlert = {
    allergenKey: 'huevo',
    nameEs: 'Huevo',
    icon: '🥚',
    minAgeMonths: 6,
    urgency: 'normal',
  }

  const urgentAllergen: AllergenAlert = {
    allergenKey: 'mani',
    nameEs: 'Maní',
    icon: '🥜',
    minAgeMonths: 6,
    urgency: 'closing_window',
  }

  it('renders allergen name and icon', () => {
    const wrapper = mount(AllergenAlertsCard, {
      props: { allergens: [normalAllergen] },
      global: {
        stubs: { TierGate: { template: '<div><slot /></div>' } },
      },
    })
    expect(wrapper.text()).toContain('Huevo')
    expect(wrapper.text()).toContain('🥚')
  })

  it('does not render minimum age info in compact view', () => {
    const wrapper = mount(AllergenAlertsCard, {
      props: { allergens: [normalAllergen] },
      global: {
        stubs: { TierGate: { template: '<div><slot /></div>' } },
      },
    })
    expect(wrapper.text()).not.toContain('Desde 6 meses')
  })

  it('does not apply urgency modifier to closing_window allergen in compact view', () => {
    const wrapper = mount(AllergenAlertsCard, {
      props: { allergens: [urgentAllergen] },
      global: {
        stubs: { TierGate: { template: '<div><slot /></div>' } },
      },
    })
    const urgentItem = wrapper.find('.allergen-item--urgent')
    expect(urgentItem.exists()).toBe(false)
  })

  it('emits viewGuide on button click', async () => {
    const wrapper = mount(AllergenAlertsCard, {
      props: { allergens: [normalAllergen] },
      global: {
        stubs: { TierGate: { template: '<div><slot /></div>' } },
      },
    })
    await wrapper.find('.btn-intro').trigger('click')
    expect(wrapper.emitted('viewGuide')).toHaveLength(1)
    expect(wrapper.emitted('viewGuide')![0]).toEqual(['huevo'])
  })

  it('hides card when allergens array is empty and not loading', () => {
    const wrapper = mount(AllergenAlertsCard, {
      props: { allergens: [], loading: false },
      global: {
        stubs: { TierGate: { template: '<div><slot /></div>' } },
      },
    })
    expect(wrapper.find('.allergen-card').exists()).toBe(false)
  })

  it('shows loading skeleton when loading', () => {
    const wrapper = mount(AllergenAlertsCard, {
      props: { allergens: [], loading: true },
      global: {
        stubs: { TierGate: { template: '<div><slot /></div>' } },
      },
    })
    expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
  })

  it('has accessible region role', () => {
    const wrapper = mount(AllergenAlertsCard, {
      props: { allergens: [normalAllergen] },
      global: {
        stubs: { TierGate: { template: '<div><slot /></div>' } },
      },
    })
    expect(wrapper.find('[role="region"]').exists()).toBe(true)
  })
})

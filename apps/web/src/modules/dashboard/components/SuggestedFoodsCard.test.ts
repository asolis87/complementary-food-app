/**
 * SuggestedFoodsCard component tests.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SuggestedFoodsCard from './SuggestedFoodsCard.vue'
import type { SuggestedFood } from '@pakulab/shared'

describe('SuggestedFoodsCard', () => {
  const pendingFood: SuggestedFood = {
    foodId: 'f1',
    name: 'Huevo',
    group: 'PROTEIN',
    ageMonths: 8,
    benefit: 'Alto en proteína',
    isAllergen: true,
    allergenType: 'huevo',
    status: 'pending',
  }

  const triedFood: SuggestedFood = {
    foodId: 'f2',
    name: 'Zanahoria',
    group: 'VEGETABLE',
    ageMonths: 6,
    benefit: 'Fácil de digerir',
    isAllergen: false,
    allergenType: null,
    status: 'tried',
  }

  const rejectedFood: SuggestedFood = {
    foodId: 'f3',
    name: 'Brócoli',
    group: 'VEGETABLE',
    ageMonths: 6,
    benefit: 'Rico en fibra',
    isAllergen: false,
    allergenType: null,
    status: 'rejected',
  }

  it('renders pending suggestion with correct status', () => {
    const wrapper = mount(SuggestedFoodsCard, {
      props: { suggestions: [pendingFood] },
    })
    expect(wrapper.text()).toContain('⏳ Pendiente')
  })

  it('renders tried suggestion with correct status', () => {
    const wrapper = mount(SuggestedFoodsCard, {
      props: { suggestions: [triedFood] },
    })
    expect(wrapper.text()).toContain('✅ Probado')
  })

  it('renders rejected suggestion with correct status', () => {
    const wrapper = mount(SuggestedFoodsCard, {
      props: { suggestions: [rejectedFood] },
    })
    expect(wrapper.text()).toContain('❌ Rechazado')
  })

  it('renders allergen tag for allergen foods', () => {
    const wrapper = mount(SuggestedFoodsCard, {
      props: { suggestions: [pendingFood] },
    })
    expect(wrapper.text()).toContain('⚠️ Alérgeno')
  })

  it('does not render allergen tag for non-allergen foods', () => {
    const wrapper = mount(SuggestedFoodsCard, {
      props: { suggestions: [triedFood] },
    })
    expect(wrapper.text()).not.toContain('⚠️ Alérgeno')
  })

  it('renders age tag with months', () => {
    const wrapper = mount(SuggestedFoodsCard, {
      props: { suggestions: [pendingFood] },
    })
    expect(wrapper.text()).toContain('8+ meses')
  })

  it('emits viewFood on suggestion click', async () => {
    const wrapper = mount(SuggestedFoodsCard, {
      props: { suggestions: [pendingFood] },
    })
    await wrapper.find('.suggestion-item').trigger('click')
    expect(wrapper.emitted('viewFood')).toHaveLength(1)
    expect(wrapper.emitted('viewFood')![0]).toEqual(['f1'])
  })

  it('emits viewAll when "Ver más opciones" is clicked', async () => {
    const wrapper = mount(SuggestedFoodsCard, {
      props: { suggestions: [pendingFood] },
    })
    await wrapper.find('.card-link').trigger('click')
    expect(wrapper.emitted('viewAll')).toHaveLength(1)
  })

  it('shows empty state when no suggestions', () => {
    const wrapper = mount(SuggestedFoodsCard, {
      props: { suggestions: [] },
    })
    expect(wrapper.text()).toContain('No hay sugerencias por ahora')
  })

  it('renders correct benefit text', () => {
    const wrapper = mount(SuggestedFoodsCard, {
      props: { suggestions: [pendingFood] },
    })
    expect(wrapper.text()).toContain('Alto en proteína')
  })

  it('has accessible region role', () => {
    const wrapper = mount(SuggestedFoodsCard, {
      props: { suggestions: [pendingFood] },
    })
    expect(wrapper.find('[role="region"]').exists()).toBe(true)
  })
})

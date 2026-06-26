/**
 * TextureGuideCard component tests.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TextureGuideCard from './TextureGuideCard.vue'

describe('TextureGuideCard', () => {
  it('renders all 5 stages (no active stage) for babies under 6 months', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 5 },
    })
    // Should have 5 stages, all marked as future
    expect(wrapper.findAll('.stage-item').length).toBe(5)
    expect(wrapper.findAll('.stage-future').length).toBe(5)
    expect(wrapper.text()).toContain('Próximamente')
  })

  it('renders 5 stages and shows 6m stage for 6-month baby', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 6 },
    })
    // Should have 5 stages
    expect(wrapper.findAll('.stage-item').length).toBe(5)
    // 6m stage should be current
    expect(wrapper.text()).toContain('6m')
    expect(wrapper.text()).toContain('Purés suaves y Bastones grandes')
    expect(wrapper.text()).toContain('Purés bien lisos y sin grumos')
  })

  it('renders 7-9m stage as current for 7-month baby', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 7 },
    })
    expect(wrapper.findAll('.stage-item').length).toBe(5)
    expect(wrapper.text()).toContain('7-9m')
    expect(wrapper.text()).toContain('Machacados y Grumos suaves')
  })

  it('renders 10-12m stage as current for 10-month baby', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 10 },
    })
    expect(wrapper.findAll('.stage-item').length).toBe(5)
    expect(wrapper.text()).toContain('10-12m')
    expect(wrapper.text()).toContain('Trozos pequeños y sólidos blandos')
  })

  it('renders 10-12m stage as current for 12-month baby', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 12 },
    })
    expect(wrapper.findAll('.stage-item').length).toBe(5)
    // 12 months falls into 10-12m range now
    expect(wrapper.text()).toContain('10-12m')
    expect(wrapper.text()).toContain('Trozos pequeños y sólidos blandos')
  })

  it('shows loading skeleton when loading is true', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 6, loading: true },
    })
    expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
    expect(wrapper.find('.texture-content').exists()).toBe(false)
  })

  it('renders 5 stages for 8-month baby with 6m and 7-9m marked, rest dimmed', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 8 },
    })

    // Should have 5 stage items
    const stageItems = wrapper.findAll('.stage-item')
    expect(stageItems.length).toBe(5)

    // 6m and 7-9m should be marked as active/current (not future)
    const activeStages = wrapper.findAll('.stage-item:not(.stage-future)')
    expect(activeStages.length).toBeGreaterThanOrEqual(2)

    // 10-12m, 13-17m, 18-23m should be future (dimmed or with "Próximamente")
    const futureStages = wrapper.findAll('.stage-future')
    expect(futureStages.length).toBeGreaterThanOrEqual(3)
    expect(wrapper.text()).toContain('Próximamente')
  })

  it('renders 5 stages for 14-month baby with 13-17m marked as current', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 14 },
    })

    // Should have 5 stage items
    const stageItems = wrapper.findAll('.stage-item')
    expect(stageItems.length).toBe(5)

    // 13-17m stage should be marked as current
    const currentStage = wrapper.find('.stage-current')
    expect(currentStage.exists()).toBe(true)
    expect(currentStage.text()).toMatch(/13.*17/i)

    // 18-23m should be future
    const futureStages = wrapper.findAll('.stage-future')
    expect(futureStages.length).toBeGreaterThanOrEqual(1)
  })
})

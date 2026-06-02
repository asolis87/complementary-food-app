/**
 * TextureGuideCard component tests.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TextureGuideCard from './TextureGuideCard.vue'

describe('TextureGuideCard', () => {
  it('renders Exclusive Breastfeeding stage for babies under 6 months', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 5 },
    })
    expect(wrapper.text()).toContain('Lactancia')
    expect(wrapper.text()).toContain('Lactancia Exclusiva')
    expect(wrapper.text()).toContain('Solo leche materna o de fórmula')
  })

  it('renders Phase 1 textures for babies at 6 months', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 6 },
    })
    expect(wrapper.text()).toContain('Fase 1: Inicio')
    expect(wrapper.text()).toContain('Purés suaves y Bastones grandes')
    expect(wrapper.text()).toContain('Purés bien lisos y sin grumos')
  })

  it('renders Phase 2 textures for babies at 7-8 months', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 7 },
    })
    expect(wrapper.text()).toContain('Fase 2: Transición')
    expect(wrapper.text()).toContain('Machacados y Grumos suaves')
  })

  it('renders Phase 3 textures for babies at 9-11 months', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 10 },
    })
    expect(wrapper.text()).toContain('Fase 3: Pinza digital')
    expect(wrapper.text()).toContain('Trozos pequeños y sólidos blandos')
  })

  it('renders Phase 4 textures for babies at 12+ months', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 12 },
    })
    expect(wrapper.text()).toContain('Fase 4: Mesa familiar')
    expect(wrapper.text()).toContain('Textura Familiar Adaptada')
  })

  it('shows loading skeleton when loading is true', () => {
    const wrapper = mount(TextureGuideCard, {
      props: { babyAgeMonths: 6, loading: true },
    })
    expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
    expect(wrapper.find('.texture-content').exists()).toBe(false)
  })
})

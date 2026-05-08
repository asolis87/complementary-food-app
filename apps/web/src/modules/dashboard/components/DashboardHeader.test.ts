/**
 * DashboardHeader component tests.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardHeader from './DashboardHeader.vue'

describe('DashboardHeader', () => {
  const defaultProps = {
    userName: 'Ana',
    babyName: 'Mateo',
    babyAgeMonths: 8,
    daysInAC: 52,
    userTier: 'PRO' as const,
  }

  it('renders the user name in greeting', () => {
    const wrapper = mount(DashboardHeader, { props: defaultProps })
    expect(wrapper.text()).toContain('Ana')
  })

  it('renders the baby name', () => {
    const wrapper = mount(DashboardHeader, { props: defaultProps })
    expect(wrapper.text()).toContain('Mateo')
  })

  it('renders baby age in months', () => {
    const wrapper = mount(DashboardHeader, { props: defaultProps })
    expect(wrapper.text()).toContain('8 meses')
  })

  it('renders days in AC when greater than 0', () => {
    const wrapper = mount(DashboardHeader, { props: defaultProps })
    expect(wrapper.text()).toContain('52 días en AC')
  })

  it('hides days in AC when 0', () => {
    const wrapper = mount(DashboardHeader, {
      props: { ...defaultProps, daysInAC: 0 },
    })
    expect(wrapper.text()).not.toContain('días en AC')
  })

  it('shows Pro badge when userTier is PRO', () => {
    const wrapper = mount(DashboardHeader, { props: defaultProps })
    expect(wrapper.text()).toContain('Pro')
  })

  it('hides Pro badge when userTier is FREE', () => {
    const wrapper = mount(DashboardHeader, {
      props: { ...defaultProps, userTier: 'FREE' },
    })
    expect(wrapper.text()).not.toContain('Pro')
  })

  it('has a banner role', () => {
    const wrapper = mount(DashboardHeader, { props: defaultProps })
    expect(wrapper.find('[role="banner"]').exists()).toBe(true)
  })

  it('has accessible baby name label', () => {
    const wrapper = mount(DashboardHeader, { props: defaultProps })
    const babyNameEl = wrapper.find('[aria-label="Nombre del bebé"]')
    expect(babyNameEl.exists()).toBe(true)
  })

  it('has accessible baby age label', () => {
    const wrapper = mount(DashboardHeader, { props: defaultProps })
    const babyAgeEl = wrapper.find('[aria-label="Edad del bebé"]')
    expect(babyAgeEl.exists()).toBe(true)
  })
})

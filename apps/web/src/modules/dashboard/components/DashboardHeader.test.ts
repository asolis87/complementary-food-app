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

  it('always shows days in AC (even when 0)', () => {
    // The conditional render was removed: the component now always
    // renders `{{ daysInAC }} días en AC` (consistency over hiding 0).
    // The "hides when 0" assertion no longer reflects the contract.
    const wrapper = mount(DashboardHeader, {
      props: { ...defaultProps, daysInAC: 0 },
    })
    expect(wrapper.text()).toContain('0 días en AC')
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

  it('exposes an accessible label on the baby capsule', () => {
    // The label lives on the parent .baby-capsule, not on the inner
    // .baby-name / .baby-meta spans, because AT engines announce the
    // label and ignore the visible text. Asserting the structural
    // contract (parent has aria-label, inner spans are visible-text-
    // only) is more resilient than coupling to the literal Spanish.
    const wrapper = mount(DashboardHeader, { props: defaultProps })
    const capsule = wrapper.find('.baby-capsule')
    expect(capsule.attributes('aria-label')).toBeTruthy()
    expect(wrapper.find('.baby-name').attributes('aria-label')).toBeUndefined()
    expect(wrapper.find('.baby-meta').attributes('aria-label')).toBeUndefined()
  })
})

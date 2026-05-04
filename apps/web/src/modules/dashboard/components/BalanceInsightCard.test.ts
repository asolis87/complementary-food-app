/**
 * BalanceInsightCard component tests.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BalanceInsightCard from './BalanceInsightCard.vue'
import type { BalanceInsight } from '@pakulab/shared'

describe('BalanceInsightCard', () => {
  const balancedInsight: BalanceInsight = {
    label: 'balanced',
    labelEs: 'Mayormente equilibrada',
    severity: 'green',
    tip: 'La avena es suave para el estómago.',
  }

  const laxativeInsight: BalanceInsight = {
    label: 'laxative',
    labelEs: 'Mayormente laxante',
    severity: 'yellow',
    tip: 'Las frutas como la manzana aportan fibra natural.',
  }

  const astringentInsight: BalanceInsight = {
    label: 'astringent',
    labelEs: 'Mayormente astringente',
    severity: 'red',
    tip: 'El pollo es una proteína magra ideal para bebés.',
  }

  it('renders the balance label in Spanish', () => {
    const wrapper = mount(BalanceInsightCard, {
      props: { insight: balancedInsight },
    })
    expect(wrapper.text()).toContain('Mayormente equilibrada')
  })

  it('renders the rotating tip', () => {
    const wrapper = mount(BalanceInsightCard, {
      props: { insight: balancedInsight },
    })
    expect(wrapper.text()).toContain('La avena es suave para el estómago.')
  })

  it('renders green severity for balanced', () => {
    const wrapper = mount(BalanceInsightCard, {
      props: { insight: balancedInsight },
    })
    expect(wrapper.classes()).toContain('balance-card--green')
  })

  it('renders yellow severity for laxative', () => {
    const wrapper = mount(BalanceInsightCard, {
      props: { insight: laxativeInsight },
    })
    expect(wrapper.classes()).toContain('balance-card--yellow')
  })

  it('renders red severity for astringent', () => {
    const wrapper = mount(BalanceInsightCard, {
      props: { insight: astringentInsight },
    })
    expect(wrapper.classes()).toContain('balance-card--red')
  })

  it('never shows raw percentages — only qualitative label', () => {
    const wrapper = mount(BalanceInsightCard, {
      props: { insight: balancedInsight },
    })
    // Check that the text does NOT contain percentage patterns
    expect(wrapper.text()).not.toMatch(/\d+%/)
  })

  it('emits viewWeeklyDetail on click', async () => {
    const wrapper = mount(BalanceInsightCard, {
      props: { insight: balancedInsight },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('viewWeeklyDetail')).toHaveLength(1)
  })

  it('emits viewWeeklyDetail on Enter keypress', async () => {
    const wrapper = mount(BalanceInsightCard, {
      props: { insight: balancedInsight },
    })
    await wrapper.trigger('keydown.enter')
    expect(wrapper.emitted('viewWeeklyDetail')).toHaveLength(1)
  })

  it('emits viewWeeklyDetail on Space keypress', async () => {
    const wrapper = mount(BalanceInsightCard, {
      props: { insight: balancedInsight },
    })
    await wrapper.trigger('keydown.space')
    expect(wrapper.emitted('viewWeeklyDetail')).toHaveLength(1)
  })

  it('has a region role with accessible label', () => {
    const wrapper = mount(BalanceInsightCard, {
      props: { insight: balancedInsight },
    })
    const region = wrapper.find('[role="region"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('aria-label')).toBe('Balance de la semana: Mayormente equilibrada')
  })

  it('shows loading skeleton when loading prop is true', () => {
    const wrapper = mount(BalanceInsightCard, {
      props: { insight: balancedInsight, loading: true },
    })
    // Should still render (with skeleton lines)
    expect(wrapper.find('.skeleton-line').exists()).toBe(true)
    // Should not render the tip
    expect(wrapper.text()).not.toContain('La avena es suave para el estómago.')
  })
})

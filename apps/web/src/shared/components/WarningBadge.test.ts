/**
 * Tests for WarningBadge.vue (T-04-11).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WarningBadge from './WarningBadge.vue'
import type { WarningTag } from '@pakulab/shared'

describe('WarningBadge', () => {
  const DISCLAIMER = 'Si tienes dudas, consulta a tu pediatra.'

  it('should render ⚠️ icon when tags prop is non-empty', () => {
    const wrapper = mount(WarningBadge, {
      props: { tags: ['PROHIBITED_UNDER_24M'] as WarningTag[] },
    })

    // Should render the badge
    expect(wrapper.find('.warning-badge').exists()).toBe(true)
    // Should contain warning icon (⚠️ or material-symbols-outlined warning)
    expect(wrapper.text()).toContain('⚠')
  })

  it('should NOT render when tags prop is empty', () => {
    const wrapper = mount(WarningBadge, {
      props: { tags: [] as WarningTag[] },
    })

    expect(wrapper.find('.warning-badge').exists()).toBe(false)
  })

  it('should show PROHIBITED_UNDER_24M description in tooltip', () => {
    const wrapper = mount(WarningBadge, {
      props: { tags: ['PROHIBITED_UNDER_24M'] as WarningTag[] },
    })

    const titleAttr = wrapper.find('.warning-badge').attributes('title')
    expect(titleAttr).toBeDefined()
    expect(titleAttr).toContain('No recomendado antes de los 2 años')
    expect(titleAttr).toContain(DISCLAIMER)
  })

  it('should show CHOKING_HAZARD_UNDER_5Y description in tooltip', () => {
    const wrapper = mount(WarningBadge, {
      props: { tags: ['CHOKING_HAZARD_UNDER_5Y'] as WarningTag[] },
    })

    const titleAttr = wrapper.find('.warning-badge').attributes('title')
    expect(titleAttr).toContain('Riesgo de atragantamiento en menores de 5 años')
    expect(titleAttr).toContain(DISCLAIMER)
  })

  it('should show PROHIBITED_PEDIATRIC description in tooltip', () => {
    const wrapper = mount(WarningBadge, {
      props: { tags: ['PROHIBITED_PEDIATRIC'] as WarningTag[] },
    })

    const titleAttr = wrapper.find('.warning-badge').attributes('title')
    expect(titleAttr).toContain('No recomendado en toda la edad pediátrica')
    expect(titleAttr).toContain(DISCLAIMER)
  })

  it('should show REQUIRES_PREPARATION description in tooltip', () => {
    const wrapper = mount(WarningBadge, {
      props: { tags: ['REQUIRES_PREPARATION'] as WarningTag[] },
    })

    const titleAttr = wrapper.find('.warning-badge').attributes('title')
    expect(titleAttr).toContain('Requiere preparación específica (cocción/corte)')
    expect(titleAttr).toContain(DISCLAIMER)
  })

  it('should show all descriptions for multi-tag food', () => {
    const wrapper = mount(WarningBadge, {
      props: {
        tags: ['CHOKING_HAZARD_UNDER_5Y', 'REQUIRES_PREPARATION'] as WarningTag[],
      },
    })

    const titleAttr = wrapper.find('.warning-badge').attributes('title')
    expect(titleAttr).toContain('Riesgo de atragantamiento en menores de 5 años')
    expect(titleAttr).toContain('Requiere preparación específica (cocción/corte)')
    expect(titleAttr).toContain(DISCLAIMER)
  })

  it('should always include pediatra disclaimer', () => {
    const tags: WarningTag[] = [
      'PROHIBITED_UNDER_24M',
      'CHOKING_HAZARD_UNDER_5Y',
      'PROHIBITED_PEDIATRIC',
      'REQUIRES_PREPARATION',
    ]

    tags.forEach((tag) => {
      const wrapper = mount(WarningBadge, {
        props: { tags: [tag] },
      })
      const titleAttr = wrapper.find('.warning-badge').attributes('title')
      expect(titleAttr).toContain(DISCLAIMER)
    })
  })
})

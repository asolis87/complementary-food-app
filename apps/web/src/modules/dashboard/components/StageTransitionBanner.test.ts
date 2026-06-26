/**
 * StageTransitionBanner component tests.
 * Tests rendering and interaction for the stage transition banner.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StageTransitionBanner from './StageTransitionBanner.vue'
import type { AgeStage } from '@pakulab/shared'

describe('StageTransitionBanner', () => {
  it('should render with 10-12 months transition copy', () => {
    const wrapper = mount(StageTransitionBanner, {
      props: { transition: 'TEN_TO_TWELVE_MONTHS' as AgeStage },
    })
    expect(wrapper.text()).toContain('🎉')
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('12')
  })

  it('should render with 13-17 months transition copy', () => {
    const wrapper = mount(StageTransitionBanner, {
      props: { transition: 'THIRTEEN_TO_SEVENTEEN_MONTHS' as AgeStage },
    })
    expect(wrapper.text()).toContain('🎉')
    expect(wrapper.text()).toContain('13')
    expect(wrapper.text()).toContain('17')
  })

  it('should emit @dismiss when "No mostrar de nuevo" is clicked', async () => {
    const wrapper = mount(StageTransitionBanner, {
      props: { transition: 'TEN_TO_TWELVE_MONTHS' as AgeStage },
    })

    const dismissButton = wrapper.find('button:nth-of-type(2)')
    await dismissButton.trigger('click')

    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('should emit @show-texture-guide when "Ver guía de texturas" is clicked', async () => {
    const wrapper = mount(StageTransitionBanner, {
      props: { transition: 'TEN_TO_TWELVE_MONTHS' as AgeStage },
    })

    const guideButton = wrapper.find('button:nth-of-type(1)')
    await guideButton.trigger('click')

    expect(wrapper.emitted('show-texture-guide')).toHaveLength(1)
  })
})

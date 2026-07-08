/**
 * StageTipCard tests — CRITICAL-2 (REQ-D2)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StageTipCard from './StageTipCard.vue'

describe('StageTipCard — REQ-D2 (CRITICAL-2)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a tip from the baby\'s stage list', () => {
    // 11 months → TEN_TO_TWELVE_MONTHS. Force index 0 so we assert the exact
    // tip from that stage's list (not just "non-empty", which is vacuous).
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const wrapper = mount(StageTipCard, {
      props: { babyAgeMonths: 11 },
    })

    const tipText = wrapper.find('.tip-text')
    expect(tipText.exists()).toBe(true)
    expect(tipText.text()).toBe('Cada alimento nuevo necesita 10-15 exposiciones para ser aceptado.')
  })

  it('displays the stage label', () => {
    const wrapper = mount(StageTipCard, {
      props: { babyAgeMonths: 11 },
    })

    const stageLabel = wrapper.find('.stage-label')
    expect(stageLabel.exists()).toBe(true)
    // Should show "Tip para 10-12 meses" or similar
    expect(stageLabel.text()).toMatch(/10.*12.*meses/i)
  })

  it('reshuffle button click rotates the tip', async () => {
    // Determinism: the composable picks tips via Math.floor(random * len).
    // TIPS_10_12 has 6 entries. Force index 0 on mount, then index 2 on reshuffle
    // so the change is asserted deterministically (not left to chance).
    // random 0 -> floor(0*6)=0; random 0.34 -> floor(0.34*6)=2
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValueOnce(0) // initial tip = TIPS_10_12[0]
    randomSpy.mockReturnValueOnce(0.34) // reshuffled tip = TIPS_10_12[2]

    const wrapper = mount(StageTipCard, {
      props: { babyAgeMonths: 11 },
    })

    const initialTip = wrapper.find('.tip-text').text()
    expect(initialTip).toBe('Cada alimento nuevo necesita 10-15 exposiciones para ser aceptado.')

    await wrapper.find('.reshuffle-btn').trigger('click')

    const newTip = wrapper.find('.tip-text').text()
    expect(newTip).toBe('Experimenta con diferentes preparaciones y sabores.')
    expect(newTip).not.toBe(initialTip)
  })

  it('renders for different age stages', () => {
    // 8m → SIX_TO_NINE_MONTHS
    const wrapper8m = mount(StageTipCard, {
      props: { babyAgeMonths: 8 },
    })
    expect(wrapper8m.find('.stage-label').text()).toMatch(/6.*9.*meses/i)

    // 15m → THIRTEEN_TO_SEVENTEEN_MONTHS
    const wrapper15m = mount(StageTipCard, {
      props: { babyAgeMonths: 15 },
    })
    expect(wrapper15m.find('.stage-label').text()).toMatch(/13.*17.*meses/i)

    // 20m → EIGHTEEN_TO_TWENTY_THREE_MONTHS
    const wrapper20m = mount(StageTipCard, {
      props: { babyAgeMonths: 20 },
    })
    expect(wrapper20m.find('.stage-label').text()).toMatch(/18.*23.*meses/i)
  })
})

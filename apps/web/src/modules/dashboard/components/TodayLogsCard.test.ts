/**
 * TodayLogsCard component tests.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TodayLogsCard from './TodayLogsCard.vue'
import type { MealSlot } from '@pakulab/shared'
import { MealType } from '@pakulab/shared'

describe('TodayLogsCard', () => {
  const pendingSlot: MealSlot = {
    mealType: MealType.BREAKFAST,
    label: 'Desayuno',
    icon: '🌅',
    isRegistered: false,
    registeredTime: null,
    foodCount: 0,
  }

  const registeredSlot: MealSlot = {
    mealType: MealType.LUNCH,
    label: 'Almuerzo',
    icon: '☀️',
    isRegistered: true,
    registeredTime: '12:30',
    foodCount: 2,
  }

  it('renders pending slot with "Registrar" button', () => {
    const wrapper = mount(TodayLogsCard, {
      props: { mealSlots: [pendingSlot] },
    })
    expect(wrapper.text()).toContain('Registrar')
    expect(wrapper.text()).toContain('Pendiente')
  })

  it('renders registered slot with "Editar" button', () => {
    const wrapper = mount(TodayLogsCard, {
      props: { mealSlots: [registeredSlot] },
    })
    expect(wrapper.text()).toContain('Editar')
    expect(wrapper.text()).toContain('12:30')
  })

  it('shows food count for registered slots', () => {
    const wrapper = mount(TodayLogsCard, {
      props: { mealSlots: [registeredSlot] },
    })
    expect(wrapper.text()).toContain('2 alimentos')
  })

  it('emits register event when clicking Registrar button', async () => {
    const wrapper = mount(TodayLogsCard, {
      props: { mealSlots: [pendingSlot] },
    })
    const btn = wrapper.find('.btn-register')
    await btn.trigger('click')
    expect(wrapper.emitted('register')).toHaveLength(1)
    expect(wrapper.emitted('register')![0]).toEqual([MealType.BREAKFAST])
  })

  it('emits edit event when clicking Editar button', async () => {
    const wrapper = mount(TodayLogsCard, {
      props: { mealSlots: [registeredSlot] },
    })
    const btn = wrapper.find('.btn-edit')
    await btn.trigger('click')
    expect(wrapper.emitted('edit')).toHaveLength(1)
    expect(wrapper.emitted('edit')![0]).toEqual([MealType.LUNCH])
  })

  it('renders 4 meal slots when data includes all slots', () => {
    const allSlots: MealSlot[] = [
      { mealType: MealType.BREAKFAST, label: 'Desayuno', icon: '🌅', isRegistered: false, registeredTime: null, foodCount: 0 },
      { mealType: MealType.LUNCH, label: 'Almuerzo', icon: '☀️', isRegistered: false, registeredTime: null, foodCount: 0 },
      { mealType: MealType.DINNER, label: 'Cena', icon: '🌙', isRegistered: false, registeredTime: null, foodCount: 0 },
      { mealType: MealType.SNACK, label: 'Snack', icon: '🍪', isRegistered: false, registeredTime: null, foodCount: 0 },
    ]
    const wrapper = mount(TodayLogsCard, {
      props: { mealSlots: allSlots },
    })
    const items = wrapper.findAll('.slot-item')
    expect(items).toHaveLength(4)
  })

  it('has a region role with accessible label', () => {
    const wrapper = mount(TodayLogsCard, {
      props: { mealSlots: [pendingSlot] },
    })
    const region = wrapper.find('[role="region"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('aria-label')).toBe('Registros de hoy')
  })

  it('shows empty state when no slots', () => {
    const wrapper = mount(TodayLogsCard, {
      props: { mealSlots: [] },
    })
    expect(wrapper.text()).toContain('Aún no hay registros para hoy')
  })

  it('shows loading skeleton when loading is true', () => {
    const wrapper = mount(TodayLogsCard, {
      props: { mealSlots: [], loading: true },
    })
    expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
  })
})

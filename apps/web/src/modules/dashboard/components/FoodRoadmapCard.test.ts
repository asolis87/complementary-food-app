/**
 * FoodRoadmapCard component tests.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FoodRoadmapCard from './FoodRoadmapCard.vue'
import type { RoadmapProgress } from '@pakulab/shared'

describe('FoodRoadmapCard', () => {
  const vegetableProgress: RoadmapProgress = {
    group: 'VEGETABLE',
    labelEs: 'Verduras',
    triedCount: 6,
    totalCount: 10,
    percentage: 60,
    foods: [
      { foodId: 'v1', name: 'Zanahoria', status: 'tried' },
      { foodId: 'v2', name: 'Brócoli', status: 'tried' },
      { foodId: 'v3', name: 'Espinaca', status: 'pending' },
    ],
  }

  const fruitProgress: RoadmapProgress = {
    group: 'FRUIT',
    labelEs: 'Frutas',
    triedCount: 4,
    totalCount: 10,
    percentage: 40,
    foods: [
      { foodId: 'f1', name: 'Manzana', status: 'tried' },
      { foodId: 'f2', name: 'Plátano', status: 'rejected' },
    ],
  }

  const multipleGroups = [vegetableProgress, fruitProgress]

  it('renders group labels', () => {
    const wrapper = mount(FoodRoadmapCard, {
      props: { progress: multipleGroups },
    })
    expect(wrapper.text()).toContain('Verduras')
    expect(wrapper.text()).toContain('Frutas')
  })

  it('renders tried/total fraction', () => {
    const wrapper = mount(FoodRoadmapCard, {
      props: { progress: [vegetableProgress] },
    })
    expect(wrapper.text()).toContain('6')
    expect(wrapper.text()).toContain('/10')
  })

  it('renders progress bar with correct aria value', () => {
    const wrapper = mount(FoodRoadmapCard, {
      props: { progress: [vegetableProgress] },
    })
    const progressBar = wrapper.find('[role="progressbar"]')
    expect(progressBar.exists()).toBe(true)
    expect(progressBar.attributes('aria-valuenow')).toBe('60')
    expect(progressBar.attributes('aria-valuemin')).toBe('0')
    expect(progressBar.attributes('aria-valuemax')).toBe('100')
  })

  it('renders food chips with status icons', () => {
    const wrapper = mount(FoodRoadmapCard, {
      props: { progress: [vegetableProgress] },
    })
    expect(wrapper.text()).toContain('Zanahoria')
    expect(wrapper.text()).toContain('✅')
    expect(wrapper.text()).toContain('Brócoli')
    expect(wrapper.text()).toContain('Espinaca')
    expect(wrapper.text()).toContain('⏳')
  })

  it('renders rejected food chips with rejected status', () => {
    const wrapper = mount(FoodRoadmapCard, {
      props: { progress: [fruitProgress] },
    })
    expect(wrapper.text()).toContain('Plátano')
    expect(wrapper.text()).toContain('❌')
  })

  it('emits viewFullRoadmap on "Ver completo" click', async () => {
    const wrapper = mount(FoodRoadmapCard, {
      props: { progress: [vegetableProgress] },
    })
    await wrapper.find('.card-link').trigger('click')
    expect(wrapper.emitted('viewFullRoadmap')).toHaveLength(1)
  })

  it('shows empty state when no progress data', () => {
    const wrapper = mount(FoodRoadmapCard, {
      props: { progress: [] },
    })
    expect(wrapper.text()).toContain('Sin datos de progreso')
  })

  it('shows loading skeleton when loading', () => {
    const wrapper = mount(FoodRoadmapCard, {
      props: { progress: [], loading: true },
    })
    expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
  })

  it('has accessible region role', () => {
    const wrapper = mount(FoodRoadmapCard, {
      props: { progress: [vegetableProgress] },
    })
    expect(wrapper.find('[role="region"]').exists()).toBe(true)
  })
})

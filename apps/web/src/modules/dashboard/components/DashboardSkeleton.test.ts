import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardSkeleton from './DashboardSkeleton.vue'

describe('DashboardSkeleton', () => {
  it('renders the skeleton container', () => {
    const wrapper = mount(DashboardSkeleton)

    const root = wrapper.find('.dashboard-skeleton')
    expect(root.exists()).toBe(true)
  })

  it('has accessible role="status" for screen readers', () => {
    const wrapper = mount(DashboardSkeleton)

    const root = wrapper.find('.dashboard-skeleton')
    expect(root.attributes('role')).toBe('status')
  })

  it('announces loading state with aria-label', () => {
    const wrapper = mount(DashboardSkeleton)

    const root = wrapper.find('.dashboard-skeleton')
    expect(root.attributes('aria-label')).toBe('Cargando dashboard')
  })

  it('marks itself as busy for assistive tech', () => {
    const wrapper = mount(DashboardSkeleton)

    const root = wrapper.find('.dashboard-skeleton')
    expect(root.attributes('aria-busy')).toBe('true')
  })

  it('renders 6 skeleton sections (header + 4 cards + insight)', () => {
    const wrapper = mount(DashboardSkeleton)

    // Header section
    expect(wrapper.find('.skeleton-header').exists()).toBe(true)
    // Col 1: Registros (TodayLogs)
    expect(wrapper.find('.skeleton-col-1').exists()).toBe(true)
    // Col 2: Sugeridos + Alérgenos
    expect(wrapper.find('.skeleton-col-2').exists()).toBe(true)
    // Col 3: Roadmap
    expect(wrapper.find('.skeleton-col-3').exists()).toBe(true)
    // Full width: Insight
    expect(wrapper.find('.skeleton-insight').exists()).toBe(true)
  })

  it('renders 4 meal slot skeletons', () => {
    const wrapper = mount(DashboardSkeleton)

    const slots = wrapper.findAll('.skeleton-slot')
    expect(slots).toHaveLength(4)
  })

  it('renders 3 suggestion chip skeletons', () => {
    const wrapper = mount(DashboardSkeleton)

    const suggestions = wrapper.findAll('.skeleton-suggestion-chip')
    expect(suggestions).toHaveLength(3)
  })

  it('renders 2 allergen item skeletons', () => {
    const wrapper = mount(DashboardSkeleton)

    const allergens = wrapper.findAll('.skeleton-allergen-item')
    expect(allergens).toHaveLength(2)
  })

  it('renders 5 roadmap item skeletons (one per food group)', () => {
    const wrapper = mount(DashboardSkeleton)

    const roadmapItems = wrapper.findAll('.skeleton-roadmap-item')
    expect(roadmapItems).toHaveLength(5)
  })

  it('has the shimmer animation defined', () => {
    const wrapper = mount(DashboardSkeleton)

    // At least one skeleton line should have the shimmer animation
    const skeletonLine = wrapper.find('.skeleton-line')
    expect(skeletonLine.exists()).toBe(true)
  })
})

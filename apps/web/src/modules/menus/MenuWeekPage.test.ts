/**
 * MenuWeekPage tests — Phase 2: UI Food Visualization
 *
 * Tests for:
 * - Desktop dots rendering for different food counts
 * - Overflow badge showing when >3 foods
 * - Tooltip content displaying full food list on hover
 * - Empty-slot fallback (no dots when no plate)
 * - Mobile chip scrolling behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'
import MenuWeekPage from './MenuWeekPage.vue'
import { useMenuStore } from '@/shared/stores/menuStore.js'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import type { Plate, PlateItemSummary } from '@pakulab/shared'

// Mock the stores
vi.mock('@/shared/stores/menuStore.js')
vi.mock('@/shared/stores/plateStore.js')
vi.mock('@/shared/stores/profileStore.js')

// Mock TierGate component
vi.mock('@/shared/components/TierGate.vue', () => ({
  default: {
    name: 'TierGate',
    template: '<div><slot /></div>',
  },
}))

describe('MenuWeekPage — Food Visualization (Phase 2)', () => {
  const createMockPlate = (foodCount: number, overrides?: Partial<Plate>): Plate => {
    const items: PlateItemSummary[] = Array.from({ length: foodCount }, (_, i) => ({
      id: `item-${i}`,
      foodId: `food-${i}`,
      groupAssignment: 'FRUIT',
      food: {
        name: `Alimento ${i + 1}`,
        alClassification: i % 3 === 0 ? 'ASTRINGENT' : i % 3 === 1 ? 'LAXATIVE' : 'NEUTRAL',
      },
    }))

    return {
      id: 'plate-1',
      name: 'Plato de prueba',
      balanceScore: 0.5,
      astringentCount: items.filter(i => i.food?.alClassification === 'ASTRINGENT').length,
      laxativeCount: items.filter(i => i.food?.alClassification === 'LAXATIVE').length,
      neutralCount: items.filter(i => i.food?.alClassification === 'NEUTRAL').length,
      groupCount: 4,
      userId: 'user-1',
      babyProfileId: 'profile-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items,
      ...overrides,
    }
  }

  const mockMenuStore = (plates: Record<string, Plate | null> = {}) => ({
    currentWeekStart: ref('2024-01-15'),
    loading: ref(false),
    error: ref(null),
    slotLoading: ref(new Set()),
    currentMenu: ref(null),
    menuMap: computed(() => plates),
    weekStats: computed(() => ({ total: 3, balanced: 2, empty: 18 })),
    getPlate: vi.fn((dayKey: string, mealKey: string) => plates[`${dayKey}:${mealKey}`] ?? null),
    getSlotFoods: vi.fn((dayKey: string, mealKey: string) => {
      const plate = plates[`${dayKey}:${mealKey}`]
      return plate?.items ?? []
    }),
    isSlotLoading: vi.fn(() => false),
    fetchWeekMenu: vi.fn(),
    clearProfileCache: vi.fn(),
    assignPlate: vi.fn(),
    removePlate: vi.fn(),
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('REQ-001: Desktop A/L Dots', () => {
    it('renders no dots when slot has no plate', async () => {
      const store = mockMenuStore({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const foodDots = wrapper.findAll('.food-dots-container')
      expect(foodDots.length).toBe(0)
    })

    it('renders 1 dot for plate with 1 food', async () => {
      const plate = createMockPlate(1)
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const dots = wrapper.findAll('.food-dot')
      expect(dots.length).toBeGreaterThanOrEqual(1)
    })

    it('renders max 3 dots even with more foods', async () => {
      const plate = createMockPlate(5)
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const dots = wrapper.findAll('.food-dot')
      expect(dots.length).toBeLessThanOrEqual(3)
    })
  })

  describe('REQ-002: Overflow Badge', () => {
    it('shows no overflow badge when 3 or fewer foods', async () => {
      const plate = createMockPlate(3)
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const overflowBadge = wrapper.find('.food-overflow-badge')
      expect(overflowBadge.exists()).toBe(false)
    })

    it('shows overflow badge when more than 3 foods', async () => {
      const plate = createMockPlate(5)
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const overflowBadge = wrapper.find('.food-overflow-badge')
      expect(overflowBadge.exists()).toBe(true)
      expect(overflowBadge.text()).toBe('+2')
    })
  })

  describe('REQ-003: Tooltip on Hover', () => {
    it('does not show tooltip for empty slots', async () => {
      const store = mockMenuStore({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const tooltip = wrapper.find('.food-tooltip')
      expect(tooltip.exists()).toBe(false)
    })

    it('shows tooltip with full food list on hover', async () => {
      const plate = createMockPlate(3)
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const plateChip = wrapper.find('.plate-chip')
      await plateChip.trigger('mouseenter')
      await flushPromises()

      const tooltipItems = document.querySelectorAll('.food-tooltip__item')
      expect(tooltipItems.length).toBe(3)
    })
  })

  describe('REQ-004: Mobile Food Chips', () => {
    it('renders food chips in mobile view', async () => {
      const plate = createMockPlate(3)
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const foodChips = wrapper.findAll('.food-chip')
      expect(foodChips.length).toBeGreaterThanOrEqual(3)
    })

    it('truncates food names to 15 characters', async () => {
      const plate: Plate = {
        id: 'plate-1',
        name: 'Plato largo',
        balanceScore: 0,
        astringentCount: 0,
        laxativeCount: 0,
        neutralCount: 1,
        groupCount: 4,
        userId: 'user-1',
        babyProfileId: 'profile-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          { id: '1', foodId: 'f1', groupAssignment: 'VEGETABLE', food: { name: 'Espinaca baby organica', alClassification: 'NEUTRAL' } },
        ],
      }
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const chipName = wrapper.find('.food-chip__name')
      const text = chipName.text()
      expect(text.length).toBeLessThanOrEqual(16) // 15 chars + ellipsis
      expect(text.endsWith('...')).toBe(true) || expect(text.endsWith('…')).toBe(true)
    })

    it('food chips container is horizontally scrollable', async () => {
      const plate = createMockPlate(5)
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const scrollContainer = wrapper.find('.food-chips-scroll')
      expect(scrollContainer.exists()).toBe(true)
    })
  })

  describe('REQ-005: 7-Column Grid Preservation', () => {
    it('maintains 7-column grid layout on desktop', async () => {
      const store = mockMenuStore({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const weekGrid = wrapper.find('.week-grid')
      expect(weekGrid.exists()).toBe(true)

      const dayColumns = wrapper.findAll('.day-column')
      expect(dayColumns.length).toBe(7)
    })
  })

  describe('3.3: Export button states', () => {
    const mockMenuStoreWithExport = (plates: Record<string, Plate | null> = {}) => ({
      currentWeekStart: ref('2024-01-15'),
      loading: ref(false),
      error: ref(null),
      slotLoading: ref(new Set()),
      currentMenu: ref(null),
      menuMap: computed(() => plates),
      weekStats: computed(() => ({ total: 3, balanced: 2, empty: 18 })),
      getPlate: vi.fn((dayKey: string, mealKey: string) => plates[`${dayKey}:${mealKey}`] ?? null),
      getSlotFoods: vi.fn((dayKey: string, mealKey: string) => {
        const plate = plates[`${dayKey}:${mealKey}`]
        return plate?.items ?? []
      }),
      getServedAt: vi.fn(() => null),
      isSlotLoading: vi.fn(() => false),
      isServeLoading: vi.fn(() => false),
      fetchWeekMenu: vi.fn(),
      clearProfileCache: vi.fn(),
      assignPlate: vi.fn(),
      removePlate: vi.fn(),
    })

    it('renders export button', async () => {
      const store = mockMenuStoreWithExport({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1', name: 'Martina' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const exportBtn = wrapper.find('.export-btn')
      expect(exportBtn.exists()).toBe(true)
      expect(exportBtn.text()).toContain('Exportar')
    })

    it('disables export button during export', async () => {
      const store = mockMenuStoreWithExport({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1', name: 'Martina' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      // Trigger export state by setting isExporting to true
      // We access the component's internal state through vm
      const vm = wrapper.vm as any
      vm.isExporting = true
      await wrapper.vm.$nextTick()

      const exportBtn = wrapper.find('.export-btn')
      expect(exportBtn.attributes('disabled')).toBeDefined()
    })

    it('shows spinner during export', async () => {
      const store = mockMenuStoreWithExport({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1', name: 'Martina' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      // Set isExporting to true
      const vm = wrapper.vm as any
      vm.isExporting = true
      await wrapper.vm.$nextTick()

      const spinner = wrapper.find('.export-btn__spinner')
      expect(spinner.exists()).toBe(true)
    })

    it('hides export text and shows spinner during export', async () => {
      const store = mockMenuStoreWithExport({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1', name: 'Martina' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      // Initially shows "Exportar"
      expect(wrapper.find('.export-btn').text()).toContain('Exportar')

      // Set isExporting to true
      const vm = wrapper.vm as any
      vm.isExporting = true
      await wrapper.vm.$nextTick()

      // Should not contain "Exportar" text anymore, only spinner
      const btnText = wrapper.find('.export-btn').text()
      expect(btnText).not.toContain('Exportar')
    })

    it('has correct aria-label for export button', async () => {
      const store = mockMenuStoreWithExport({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1', name: 'Martina' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const exportBtn = wrapper.find('.export-btn')
      // Default aria-label
      expect(exportBtn.attributes('aria-label')).toBe('Exportar menú semanal')
    })

    it('updates aria-label during export', async () => {
      const store = mockMenuStoreWithExport({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1', name: 'Martina' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      // Set isExporting to true
      const vm = wrapper.vm as any
      vm.isExporting = true
      await wrapper.vm.$nextTick()

      const exportBtn = wrapper.find('.export-btn')
      expect(exportBtn.attributes('aria-label')).toBe('Exportando menú...')
    })

    it('renders MenuExportFrame component', async () => {
      const store = mockMenuStoreWithExport({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1', name: 'Martina' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      // MenuExportFrame should be rendered
      const exportFrame = wrapper.findComponent({ name: 'MenuExportFrame' })
      expect(exportFrame.exists()).toBe(true)
    })

    it('passes correct props to MenuExportFrame', async () => {
      const store = mockMenuStoreWithExport({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: ref([]),
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: ref([]),
        activeProfile: ref({ id: 'profile-1', name: 'Martina' }),
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const exportFrame = wrapper.findComponent({ name: 'MenuExportFrame' })
      expect(exportFrame.exists()).toBe(true)

      // Check that required props are passed
      expect(exportFrame.props('weekStart')).toBeDefined()
      expect(exportFrame.props('weekEnd')).toBeDefined()
      expect(exportFrame.props('weekLabel')).toBeDefined()
      expect(exportFrame.props('babyName')).toBe('Martina')
      expect(exportFrame.props('days')).toBeDefined()
      expect(exportFrame.props('weekStats')).toBeDefined()
    })
  })
})

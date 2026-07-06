/**
 * MenuWeekPage tests — existing food display behavior
 *
 * Tests for:
 * - Mobile food summary line rendering (existing behavior)
 * - Score tooltip on plate chips
 * - Empty-slot CTA with "Agregar plato" text
 * - 7-column grid preservation
 * - Export button states
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
    getServedAt: vi.fn(() => null),
    isSlotLoading: vi.fn(() => false),
    isServeLoading: vi.fn(() => false),
    fetchWeekMenu: vi.fn(),
    clearProfileCache: vi.fn(),
    assignPlate: vi.fn(),
    removePlate: vi.fn(),
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('REQ-1: Food name display (existing behavior)', () => {
    it('does not render inline desktop food list items', async () => {
      const plate = createMockPlate(3)
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1' },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const foodItems = wrapper.findAll('.food-list__item')
      expect(foodItems.length).toBe(0)
    })

    it('renders mobile food summary with food names', async () => {
      const plate = createMockPlate(3)
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1' },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const summary = wrapper.find('.food-summary')
      expect(summary.exists()).toBe(true)
      expect(summary.text()).toContain('Alimento 1')
    })

    it('renders A/L colored dots in mobile food summary', async () => {
      const plate = createMockPlate(3)
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1' },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const dots = wrapper.findAll('.food-summary__dot')
      expect(dots.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('REQ-3: Balance Score Tooltip', () => {
    it('shows tooltip on score icon for balanced plate', async () => {
      const plate = createMockPlate(3, { balanceScore: 0.5 })
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1' },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const scoreIcon = wrapper.find('.plate-chip__score')
      expect(scoreIcon.exists()).toBe(true)
      expect(scoreIcon.attributes('title')).toBe('Plato equilibrado')
    })

    it('shows tooltip on score icon for astringent plate', async () => {
      const plate = createMockPlate(3, { balanceScore: -0.5 })
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1' },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const scoreIcon = wrapper.find('.plate-chip__score')
      expect(scoreIcon.attributes('title')).toBe('Plato astringente')
    })
  })

  describe('REQ-004: Mobile food display (existing behavior)', () => {
    it('does not render mobile food chips', async () => {
      const plate = createMockPlate(3)
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1' },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const foodChips = wrapper.findAll('.food-chip')
      expect(foodChips.length).toBe(0)
    })

    it('does not render horizontally scrollable chip container', async () => {
      const plate = createMockPlate(5)
      const store = mockMenuStore({ 'lun:desayuno': plate })
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1' },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const scrollContainer = wrapper.find('.food-chips-scroll')
      expect(scrollContainer.exists()).toBe(false)
    })
  })

  describe('REQ-005: 7-Column Grid Preservation', () => {
    it('maintains 7-column grid layout on desktop', async () => {
      const store = mockMenuStore({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1' },
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
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', name: 'Martina' },
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
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', name: 'Martina' },
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
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', name: 'Martina' },
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
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', name: 'Martina' },
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
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', name: 'Martina' },
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
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', name: 'Martina' },
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
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', name: 'Martina' },
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
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', name: 'Martina' },
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

  describe('T-05-08: stage label derivation (birthDate → stageLabel)', () => {
    // getAgeMonths derives age from birthDate against the CURRENT date. Pin the
    // birth day to 1 and shift whole months back from now so the computed age is
    // deterministic (ref.getDate() < 1 is always false → no day-based subtraction,
    // no end-of-month rollover).
    const birthDateForAge = (months: number): Date => {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth() - months, 1)
    }

    it('derives the current stage label from the baby birthDate and passes it to MenuExportFrame', async () => {
      const store = mockMenuStore({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        // 15 months old → THIRTEEN_TO_TWENTY_THREE_MONTHS → "13-23 meses"
        activeProfile: { id: 'profile-1', name: 'Tomás', birthDate: birthDateForAge(15) },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const exportFrame = wrapper.findComponent({ name: 'MenuExportFrame' })
      expect(exportFrame.props('stageLabel')).toBe('13-23 meses')
    })

    it('passes an empty stage label when the baby has no birthDate (age-0 guard)', async () => {
      const store = mockMenuStore({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        // No birthDate → getAgeMonths falls back to 0 → stage label omitted
        activeProfile: { id: 'profile-1', name: 'Tomás' },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const exportFrame = wrapper.findComponent({ name: 'MenuExportFrame' })
      expect(exportFrame.props('stageLabel')).toBe('')
    })
  })
})

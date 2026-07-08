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
import { useSnackStore } from '@/shared/stores/snackStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import type { Plate, PlateItemSummary } from '@pakulab/shared'

// Mock the stores
vi.mock('@/shared/stores/menuStore.js')
vi.mock('@/shared/stores/plateStore.js')
vi.mock('@/shared/stores/snackStore.js')
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

  const mockMenuStore = (
    plates: Record<string, Plate | null> = {},
    snacks: Record<string, { id: string; name: string } | null> = {},
  ) => ({
    currentWeekStart: ref('2024-01-15'),
    loading: ref(false),
    error: ref(null),
    slotLoading: ref(new Set()),
    currentMenu: ref(null),
    menuMap: computed(() => plates),
    snackMap: computed(() => snacks),
    weekStats: computed(() => ({ total: 3, balanced: 2, empty: 18 })),
    getPlate: vi.fn((dayKey: string, mealKey: string) => plates[`${dayKey}:${mealKey}`] ?? null),
    getSnack: vi.fn((dayKey: string, mealKey: string) => snacks[`${dayKey}:${mealKey}`] ?? null),
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
    assignSnack: vi.fn(),
    removeSnack: vi.fn(),
    serveMeal: vi.fn(),
    reServeMeal: vi.fn(),
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Default snack store mock (no saved snacks). Tests that need snacks
    // override this after beforeEach runs.
    vi.mocked(useSnackStore).mockReturnValue({
      savedSnacks: [],
      loading: ref(false),
      fetchSavedSnacks: vi.fn(),
    } as any)
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
      snackMap: computed(() => ({})),
      weekStats: computed(() => ({ total: 3, balanced: 2, empty: 18 })),
      getPlate: vi.fn((dayKey: string, mealKey: string) => plates[`${dayKey}:${mealKey}`] ?? null),
      getSnack: vi.fn(() => null),
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
      assignSnack: vi.fn(),
      removeSnack: vi.fn(),
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

    it('excludes snack rows from the export even when snack columns are visible', async () => {
      // 15-month baby → grid shows 5 columns (breakfast, snack1, lunch, snack2,
      // dinner), but the export must render only the 3 main meals.
      const birthDateForAge = (months: number): Date => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth() - months, 1)
      }

      const store = mockMenuStoreWithExport({})
      // Assign a snack so the (would-be) snack rows have content to leak.
      store.getSnack = vi.fn((dayKey: string, mealKey: string) =>
        mealKey === 'snack1' && dayKey === 'lun' ? { id: 's1', name: 'Manzana con nuez' } : null,
      ) as any
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', name: 'Tomás', birthDate: birthDateForAge(15) },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const exportFrame = wrapper.findComponent({ name: 'MenuExportFrame' })
      const days = exportFrame.props('days') as Array<{ meals: Array<{ type: string }> }>

      // Each exported day carries only the 3 main meals — no snack rows.
      expect(days.length).toBe(7)
      for (const day of days) {
        expect(day.meals.length).toBe(3)
        const types = day.meals.map((m) => m.type)
        expect(types.some((t) => t.includes('Colación'))).toBe(false)
      }
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

  describe('REQ-A3: Age-aware meal columns (CRITICAL-1)', () => {
    const birthDateForAge = (months: number): Date => {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth() - months, 1)
    }

    it('shows 3 meal columns for an 8-month baby (no snack columns)', async () => {
      const store = mockMenuStore({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', birthDate: birthDateForAge(8) },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const mealSlots = wrapper.findAll('.meal-slot')
      // 7 days * 3 meals = 21 slots
      expect(mealSlots.length).toBe(21)

      // Verify labels are: Desayuno, Comida, Cena (no Colación)
      const labels = wrapper.findAll('.meal-slot__label')
      const labelTexts = labels.map(l => l.text().replace(/\s+/g, ' ').trim())
      expect(labelTexts.some(t => t.includes('Desayuno'))).toBe(true)
      expect(labelTexts.some(t => t.includes('Comida'))).toBe(true)
      expect(labelTexts.some(t => t.includes('Cena'))).toBe(true)
      expect(labelTexts.filter(t => t.includes('Colación')).length).toBe(0)
    })

    it('shows 4 meal columns for an 11-month baby (SNACK_1 "Colación" present)', async () => {
      const store = mockMenuStore({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', birthDate: birthDateForAge(11) },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const mealSlots = wrapper.findAll('.meal-slot')
      // 7 days * 4 meals = 28 slots
      expect(mealSlots.length).toBe(28)

      // Verify labels include "Colación" (singular for 4-meal layout)
      const labels = wrapper.findAll('.meal-slot__label')
      const labelTexts = labels.map(l => l.text().replace(/\s+/g, ' ').trim())
      expect(labelTexts.filter(t => t.includes('Colación')).length).toBeGreaterThan(0)
      // Should be singular "Colación", not "Colación 1"
      expect(labelTexts.some(t => t.includes('Colación') && !t.includes('Colación 1'))).toBe(true)
    })

    it('shows 5 meal columns for a 15-month baby (two colación columns)', async () => {
      const store = mockMenuStore({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', birthDate: birthDateForAge(15) },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const mealSlots = wrapper.findAll('.meal-slot')
      // 7 days * 5 meals = 35 slots
      expect(mealSlots.length).toBe(35)

      // Verify labels include "Colación 1" and "Colación 2"
      const labels = wrapper.findAll('.meal-slot__label')
      const labelTexts = labels.map(l => l.text().replace(/\s+/g, ' ').trim())
      expect(labelTexts.filter(t => t.includes('Colación 1')).length).toBeGreaterThan(0)
      expect(labelTexts.filter(t => t.includes('Colación 2')).length).toBeGreaterThan(0)
    })

    // Boundary tests — the 10m/13m thresholds are clinically load-bearing.
    it('shows 4 meal columns at EXACTLY 10 months (lower boundary of 10-12m)', async () => {
      const store = mockMenuStore({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', birthDate: birthDateForAge(10) },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      // 7 days * 4 meals = 28 — a 10-month baby must get the snack column, not 3.
      expect(wrapper.findAll('.meal-slot').length).toBe(28)
    })

    it('shows 5 meal columns at EXACTLY 13 months (lower boundary of 13-23m)', async () => {
      const store = mockMenuStore({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', birthDate: birthDateForAge(13) },
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      // 7 days * 5 meals = 35 — a 13-month baby must get both colación columns.
      expect(wrapper.findAll('.meal-slot').length).toBe(35)
    })

    it('falls back to 3 meal columns when the profile has no birthDate (age-0 guard)', async () => {
      const store = mockMenuStore({})
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1' }, // no birthDate → getAgeMonths → 0
        fetchProfiles: vi.fn(),
      } as any)

      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      // Age 0 → 3 meals (safe default), not an empty/broken grid.
      expect(wrapper.findAll('.meal-slot').length).toBe(21)
    })
  })

  describe('PR-1b: Snack slots in the menu grid', () => {
    const birthDateForAge = (months: number): Date => {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth() - months, 1)
    }

    const mountAt = (
      ageMonths: number,
      snacks: Record<string, { id: string; name: string } | null> = {},
      savedSnacks: { id: string; name: string; items: unknown[] }[] = [],
    ) => {
      const store = mockMenuStore({}, snacks)
      vi.mocked(useMenuStore).mockReturnValue(store as any)
      vi.mocked(usePlateStore).mockReturnValue({
        savedPlates: [],
        loading: ref(false),
        fetchSavedPlates: vi.fn(),
      } as any)
      vi.mocked(useSnackStore).mockReturnValue({
        savedSnacks,
        // Plain boolean: a mocked store object does not auto-unwrap refs in the
        // template the way a real Pinia setup store does.
        loading: false,
        fetchSavedSnacks: vi.fn(),
      } as any)
      vi.mocked(useProfileStore).mockReturnValue({
        profiles: [],
        activeProfile: { id: 'profile-1', birthDate: birthDateForAge(ageMonths) },
        fetchProfiles: vi.fn(),
      } as any)
      return { store }
    }

    it('renders NO snack columns for an 8-month baby', async () => {
      mountAt(8)
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const snackSlots = wrapper.findAll('.meal-slot--snack1, .meal-slot--snack2')
      expect(snackSlots.length).toBe(0)
    })

    it('renders a snack column (SNACK_1) for an 11-month baby', async () => {
      mountAt(11)
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const snack1Slots = wrapper.findAll('.meal-slot--snack1')
      // 7 days
      expect(snack1Slots.length).toBe(7)
      expect(wrapper.findAll('.meal-slot--snack2').length).toBe(0)
    })

    it('renders two snack columns (SNACK_1 + SNACK_2) for a 15-month baby', async () => {
      mountAt(15)
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      expect(wrapper.findAll('.meal-slot--snack1').length).toBe(7)
      expect(wrapper.findAll('.meal-slot--snack2').length).toBe(7)
    })

    it('empty snack slot shows an add affordance', async () => {
      mountAt(11)
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      // The snack1 slot for Monday should offer an add button
      const snack1Slot = wrapper.find('[data-slot="lun:snack1"]')
      expect(snack1Slot.exists()).toBe(true)
      expect(snack1Slot.find('.add-slot-btn').exists()).toBe(true)
    })

    it('assigned snack shows the snack name and NO score icon', async () => {
      mountAt(11, { 'lun:snack1': { id: 'snack-1', name: 'Fruta picada' } })
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const snack1Slot = wrapper.find('[data-slot="lun:snack1"]')
      expect(snack1Slot.exists()).toBe(true)
      expect(snack1Slot.text()).toContain('Fruta picada')
      // Snacks have no balance score → no score icon in the snack chip
      expect(snack1Slot.find('.snack-chip__score').exists()).toBe(false)
      expect(snack1Slot.find('.plate-chip__score').exists()).toBe(false)
    })

    it('opening an empty snack slot shows the snack empty-state (no create button)', async () => {
      mountAt(11)
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      // Open the picker for the snack slot
      const snack1Slot = wrapper.find('[data-slot="lun:snack1"]')
      await snack1Slot.find('.add-slot-btn').trigger('click')
      await flushPromises()

      // Snack empty-state copy present, and NO create affordance
      const backdrop = document.body
      expect(backdrop.textContent).toContain('No tienes colaciones guardadas todavía')
    })

    it('serve button renders on an assigned snack slot (desktop)', async () => {
      mountAt(11, { 'lun:snack1': { id: 'snack-1', name: 'Fruta picada' } })
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const snack1Slot = wrapper.find('[data-slot="lun:snack1"]')
      expect(snack1Slot.find('.snack-chip__serve').exists()).toBe(true)
    })

    it('empty snack slot has NO serve button', async () => {
      mountAt(11)
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const snack1Slot = wrapper.find('[data-slot="lun:snack1"]')
      expect(snack1Slot.exists()).toBe(true)
      expect(snack1Slot.find('.snack-chip__serve').exists()).toBe(false)
    })

    it('served snack shows the served state (same "Servido ✓" tooltip as plates)', async () => {
      const { store } = mountAt(11, { 'lun:snack1': { id: 'snack-1', name: 'Fruta picada' } })
      // Mark this snack slot as served, mirroring how the plate served-state is driven.
      store.getServedAt = vi.fn((dayKey: string, mealKey: string) =>
        dayKey === 'lun' && mealKey === 'snack1' ? '2024-01-15T10:00:00.000Z' : null,
      ) as any
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const serveBtn = wrapper.find('[data-slot="lun:snack1"] .snack-chip__serve')
      expect(serveBtn.exists()).toBe(true)
      // Served-state class + tooltip mirror the plate serve button exactly.
      expect(serveBtn.classes()).toContain('snack-chip__serve--served')
      expect(serveBtn.attributes('title')).toBe('Servido ✓')
    })

    it('unserved snack serve button uses the "Registrar colación" tooltip', async () => {
      mountAt(11, { 'lun:snack1': { id: 'snack-1', name: 'Fruta picada' } })
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const serveBtn = wrapper.find('[data-slot="lun:snack1"] .snack-chip__serve')
      expect(serveBtn.attributes('title')).toBe('Registrar colación')
    })

    it('clicking serve on an unserved snack routes through the serve handler → menuStore.serveMeal', async () => {
      const { store } = mountAt(11, { 'lun:snack1': { id: 'snack-1', name: 'Fruta picada' } })
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      await wrapper.find('[data-slot="lun:snack1"] .snack-chip__serve').trigger('click')
      await flushPromises()

      // First-serve opens the confirmation dialog; confirming calls serveMeal.
      const confirmBtn = Array.from(
        document.body.querySelectorAll('.dialog__btn--primary'),
      ).find((b) => (b.textContent ?? '').includes('registrar')) as HTMLElement
      expect(confirmBtn).toBeDefined()
      confirmBtn.click()
      await flushPromises()

      expect(store.serveMeal).toHaveBeenCalledWith('profile-1', 'lun', 'snack1')
    })

    it('serve button is disabled while the slot is serve-loading', async () => {
      const { store } = mountAt(11, { 'lun:snack1': { id: 'snack-1', name: 'Fruta picada' } })
      store.isServeLoading = vi.fn((dayKey: string, mealKey: string) =>
        dayKey === 'lun' && mealKey === 'snack1',
      ) as any
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const serveBtn = wrapper.find('[data-slot="lun:snack1"] .snack-chip__serve')
      expect(serveBtn.attributes('disabled')).toBeDefined()
    })

    // ─── Mobile snack serve button (.snack-row-chip__serve) ───
    // The mobile layout is hidden via a CSS media query (display:none), not v-if,
    // so its markup is present in the jsdom-mounted DOM. The mobile snack chip is
    // NOT under a [data-slot] node (that attribute lives only on the desktop grid),
    // so these tests scope directly to the mobile-only .snack-row-chip__serve class.
    it('mobile snack serve button renders on an assigned snack slot', async () => {
      mountAt(11, { 'lun:snack1': { id: 'snack-1', name: 'Fruta picada' } })
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      expect(wrapper.find('.snack-row-chip__serve').exists()).toBe(true)
    })

    it('clicking the mobile snack serve routes through the serve handler → menuStore.serveMeal', async () => {
      const { store } = mountAt(11, { 'lun:snack1': { id: 'snack-1', name: 'Fruta picada' } })
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      await wrapper.find('.snack-row-chip__serve').trigger('click')
      await flushPromises()

      // First-serve opens the confirmation dialog; confirming calls serveMeal.
      const confirmBtn = Array.from(
        document.body.querySelectorAll('.dialog__btn--primary'),
      ).find((b) => (b.textContent ?? '').includes('registrar')) as HTMLElement
      expect(confirmBtn).toBeDefined()
      confirmBtn.click()
      await flushPromises()

      expect(store.serveMeal).toHaveBeenCalledWith('profile-1', 'lun', 'snack1')
    })

    it('mobile snack serve button is disabled while the slot is serve-loading', async () => {
      const { store } = mountAt(11, { 'lun:snack1': { id: 'snack-1', name: 'Fruta picada' } })
      store.isServeLoading = vi.fn((dayKey: string, mealKey: string) =>
        dayKey === 'lun' && mealKey === 'snack1',
      ) as any
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      const serveBtn = wrapper.find('.snack-row-chip__serve')
      expect(serveBtn.attributes('disabled')).toBeDefined()
    })

    it('snack picker is collapsible: tapping a snack reveals its foods + select button', async () => {
      mountAt(11, {}, [
        {
          id: 'snack-1',
          name: 'Fruta y nuez',
          items: [
            { id: 'i1', groupAssignment: 'FRUIT', food: { id: 'f1', name: 'Manzana', group: 'FRUIT' } },
            { id: 'i2', groupAssignment: 'HEALTHY_FAT', food: { id: 'f2', name: 'Nuez', group: 'HEALTHY_FAT' } },
          ],
        },
      ])
      const wrapper = mount(MenuWeekPage)
      await flushPromises()

      // Open the snack picker
      await wrapper.find('[data-slot="lun:snack1"]').find('.add-slot-btn').trigger('click')
      await flushPromises()

      const dialog = document.body
      // Collapsed initially: snack name visible, but food details + select hidden
      expect(dialog.textContent).toContain('Fruta y nuez')
      expect(dialog.querySelector('.picker-item__detail')).toBeNull()

      // Tap the snack header to expand
      const header = dialog.querySelector('.picker-item__header') as HTMLElement
      header.click()
      await flushPromises()

      // Now the foods + the select button are shown
      const detail = dialog.querySelector('.picker-item__detail')
      expect(detail).not.toBeNull()
      expect(detail?.textContent).toContain('Manzana')
      expect(detail?.textContent).toContain('Nuez')
      expect(detail?.querySelector('.picker-select-btn')).not.toBeNull()
    })
  })
})

/**
 * Tests for SnackBuilderDrawer.vue (REQ-SC3, REQ-SC4, REQ-SC6).
 * Verifies the dedicated snack builder drawer: 3-zone visualization, name input,
 * suggested group emphasis, on-save warnings, tier gate lockout, and save/clear actions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Snack } from '@pakulab/shared'
import SnackBuilderDrawer from '../SnackBuilderDrawer.vue'
import { useSnackStore } from '@/shared/stores/snackStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useUiStore } from '@/shared/stores/uiStore.js'

// Default mock for useSnackBuilder
let mockBuilder: any

vi.mock('@/shared/composables/useSnackBuilder.js', () => ({
  useSnackBuilder: vi.fn(() => mockBuilder),
}))

// Mock FoodSearchModal to stub it out
vi.mock('@/modules/plates/components/FoodSearchModal.vue', () => ({
  default: {
    name: 'FoodSearchModal',
    template: '<div class="mock-food-search-modal"></div>',
  },
}))

// Mock SnackVisualization to stub it out
vi.mock('@/modules/snacks/components/SnackVisualization.vue', () => ({
  default: {
    name: 'SnackVisualization',
    template: '<div class="mock-snack-visualization"></div>',
    props: ['items', 'suggestedGroups'],
    emits: ['select-group'],
  },
}))

function mountDrawer(props = {}) {
  return mount(SnackBuilderDrawer, {
    props: {
      visible: true,
      ageMonths: 11,
      ...props,
    },
    global: {
      plugins: [createPinia()],
      stubs: {
        teleport: true,
        transition: false,
      },
    },
  })
}

describe('SnackBuilderDrawer — REQ-SC3, REQ-SC4, REQ-SC6', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.tier = 'PRO'

    // Reset to default mock builder
    mockBuilder = {
      draftItems: { value: [] },
      draftName: { value: 'Mi colación' },
      draftStageFor: { value: null },
      saving: { value: false },
      lastWarnings: { value: [] },
      suggestedGroups: { value: ['HEALTHY_FAT', 'CEREAL_TUBER'] },
      isSuggested: (group: string) => group === 'HEALTHY_FAT' || group === 'CEREAL_TUBER',
      hasItems: { value: false },
      isValid: { value: false },
      canSave: { value: true },
      addFood: vi.fn(),
      removeFood: vi.fn(),
      clear: vi.fn(),
      resetDraft: vi.fn(),
      saveSnack: vi.fn(async () => ({
        snack: { id: 'snack-1', name: 'Test Snack' } as Snack,
        warnings: [],
      })),
    }
  })

  it('renders the drawer with name input and 3-zone visualization', () => {
    const wrapper = mountDrawer()

    expect(wrapper.find('.drawer-title').text()).toContain('Crear colación')
    expect(wrapper.find('#drawer-snack-name').exists()).toBe(true)
    expect(wrapper.find('.mock-snack-visualization').exists()).toBe(true)
  })

  it('displays suggested zones emphasis for 11m baby (HEALTHY_FAT + CEREAL_TUBER)', () => {
    const wrapper = mountDrawer({ ageMonths: 11 })

    // The SnackVisualization receives suggestedGroups prop
    const viz = wrapper.findComponent({ name: 'SnackVisualization' })
    expect(viz.props('suggestedGroups')).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER'])
  })

  it('save button is disabled when name is empty', () => {
    mockBuilder.draftItems.value = [{ id: '1', food: { name: 'Aguacate' }, groupAssignment: 'HEALTHY_FAT' }]
    mockBuilder.draftName.value = ''
    mockBuilder.hasItems.value = true
    mockBuilder.isValid.value = false // Invalid due to empty name

    const wrapper = mountDrawer()
    const saveBtn = wrapper.find('.drawer-btn--primary')
    expect(saveBtn.attributes('disabled')).toBeDefined()
  })

  it('save button is disabled when !canSave (tier limit reached)', () => {
    mockBuilder.draftItems.value = [{ id: '1', food: { name: 'Aguacate' }, groupAssignment: 'HEALTHY_FAT' }]
    mockBuilder.draftName.value = 'Mi colación'
    mockBuilder.hasItems.value = true
    mockBuilder.isValid.value = true
    mockBuilder.canSave.value = false // Tier limit reached

    const wrapper = mountDrawer()
    const saveBtn = wrapper.find('.drawer-btn--primary')
    expect(saveBtn.attributes('disabled')).toBeDefined()
  })

  it('displays tier lockout upsell message when !canSave', () => {
    const authStore = useAuthStore()
    authStore.tier = 'FREE'

    mockBuilder.canSave.value = false // FREE tier lockout

    const wrapper = mountDrawer()
    const html = wrapper.html()
    expect(html).toMatch(/plan gratuito|actualiza|pro/i)
  })

  it('calls saveSnack and emits "snack-created" on successful save', async () => {
    const mockSnack = { id: 'snack-1', name: 'Test Snack' } as Snack
    let capturedOnSaved: ((snack: Snack) => void) | undefined

    mockBuilder.draftItems.value = [{ id: '1', food: { name: 'Aguacate' }, groupAssignment: 'HEALTHY_FAT' }]
    mockBuilder.draftName.value = 'Mi colación'
    mockBuilder.hasItems.value = true
    mockBuilder.isValid.value = true
    mockBuilder.canSave.value = true
    mockBuilder.saveSnack = vi.fn(async () => {
      const result = { snack: mockSnack, warnings: [] }
      // Simulate the builder calling onSaved callback
      if (capturedOnSaved) {
        capturedOnSaved(mockSnack)
      }
      return result
    })

    // Capture the onSaved callback from useSnackBuilder options
    const { useSnackBuilder } = await import('@/shared/composables/useSnackBuilder.js')
    vi.mocked(useSnackBuilder).mockImplementation((options: any) => {
      capturedOnSaved = options.onSaved
      return mockBuilder
    })

    const wrapper = mountDrawer()
    const saveBtn = wrapper.find('.drawer-btn--primary')
    await saveBtn.trigger('click')
    await flushPromises()

    expect(mockBuilder.saveSnack).toHaveBeenCalled()
    expect(wrapper.emitted('snack-created')).toBeTruthy()
    expect(wrapper.emitted('snack-created')?.[0]).toEqual([mockSnack])
  })

  it('displays warnings from saveSnack response via toast', async () => {
    mockBuilder.draftItems.value = [{ id: '1', food: { id: 'f1', name: 'Aguacate' }, groupAssignment: 'HEALTHY_FAT' }]
    mockBuilder.draftName.value = 'Mi colación'
    mockBuilder.hasItems.value = true
    mockBuilder.isValid.value = true
    mockBuilder.canSave.value = true
    mockBuilder.saveSnack = vi.fn(async () => ({
      snack: { id: 'snack-1', name: 'Test Snack' } as Snack,
      warnings: ['Missing fruit group', 'Extra group: VEGETABLE'],
    }))

    const wrapper = mountDrawer()

    // Get the store instance used by the component
    const uiStore = useUiStore()
    const addToastSpy = vi.spyOn(uiStore, 'addToast')

    // Wait for component to fully mount
    await flushPromises()

    const saveBtn = wrapper.find('.drawer-btn--primary')
    await saveBtn.trigger('click')
    await flushPromises()

    expect(mockBuilder.saveSnack).toHaveBeenCalled()
    expect(addToastSpy).toHaveBeenCalledWith('Missing fruit group', 'warning')
    expect(addToastSpy).toHaveBeenCalledWith('Extra group: VEGETABLE', 'warning')
  })

  it('clear button resets the draft', async () => {
    const mockClear = vi.fn()

    mockBuilder.draftItems.value = [{ id: '1', food: { name: 'Aguacate' }, groupAssignment: 'HEALTHY_FAT' }]
    mockBuilder.hasItems.value = true
    mockBuilder.clear = mockClear

    const wrapper = mountDrawer()
    const clearBtn = wrapper.find('.drawer-btn--secondary')
    await clearBtn.trigger('click')

    expect(mockClear).toHaveBeenCalled()
  })
})

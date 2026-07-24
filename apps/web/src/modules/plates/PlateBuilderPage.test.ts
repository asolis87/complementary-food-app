import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { BabyProfile } from '@pakulab/shared'
import PlateBuilderPage from './PlateBuilderPage.vue'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useFoodStore } from '@/shared/stores/foodStore.js'

const route = vi.hoisted(() => ({ params: {} as Record<string, string>, query: {} as Record<string, string> }))
const router = vi.hoisted(() => ({ push: vi.fn().mockReturnValue(Promise.resolve()), back: vi.fn() }))

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => router,
}))

vi.mock('@/shared/api/client.js', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: [] }), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  OfflineError: class OfflineError extends Error {},
  ApiError: class ApiError extends Error {},
}))

vi.mock('@/shared/services/syncQueue.js', () => ({
  getPendingPlates: vi.fn().mockResolvedValue([]),
  enqueuePlate: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./components/PlateVisualization.vue', () => ({
  default: {
    name: 'PlateVisualization',
    template: '<div />',
    props: ['items', 'groupCount'],
    emits: ['remove-item', 'select-group'],
  },
}))
vi.mock('./components/BalanceIndicator.vue', () => ({ default: { template: '<div />', props: ['balance'] } }))
vi.mock('./components/PlateContents.vue', () => ({
  default: {
    name: 'PlateContents',
    template: '<div />',
    props: ['items', 'groupCount'],
    emits: ['select-group', 'remove-item', 'update-serving-amount'],
  },
}))
vi.mock('./components/FoodSearchModal.vue', () => ({
  default: {
    name: 'FoodSearchModal',
    template: '<div />',
    props: ['isOpen'],
    emits: ['close', 'add-food', 'remove-food', 'search'],
  },
}))
vi.mock('./components/PlateActions.vue', () => ({
  default: {
    name: 'PlateActions',
    template: '<div />',
    props: ['canSave'],
    emits: ['save', 'export', 'clear', 'share'],
  },
}))
vi.mock('./components/PlateExportFrame.vue', () => ({ default: { template: '<div />', props: ['plateName'] } }))
vi.mock('@/shared/components/MealSlotPicker.vue', () => ({ default: { template: '<div />', props: ['visible'] } }))

function setupBaby(ageMonths: number, id = 'baby-1') {
  const birthDate = new Date()
  birthDate.setMonth(birthDate.getMonth() - ageMonths)
  const profileStore = useProfileStore()
  profileStore.profiles = [{ id, userId: 'user-1', name: 'Mateo', birthDate: birthDate.toISOString() } as BabyProfile]
  profileStore.activeProfileId = id
}

function stageValue(wrapper: ReturnType<typeof mount>) {
  return (wrapper.find('#stage-selector').element as HTMLSelectElement).value
}

function mountPage() {
  return mount(PlateBuilderPage, { global: { stubs: { transition: false } } })
}

describe('PlateBuilderPage stage selector', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('shows the inferred stage when an active 10-month profile is loaded before mount', async () => {
    setupBaby(10)
        const wrapper = mountPage()
        await flushPromises()
        expect(stageValue(wrapper)).toBe('TEN_TO_TWELVE_MONTHS')
      })

      it('infers a stage when the active profile arrives after mount', async () => {
        const wrapper = mountPage()
        await flushPromises()
        setupBaby(24, 'baby-2')
        await flushPromises()
        expect(stageValue(wrapper)).toBe('FAMILY_TABLE')
      })

      it('preserves a manual stage when the active profile changes within the draft', async () => {
        setupBaby(10)
        const wrapper = mountPage()
        await flushPromises()
        await wrapper.find('#stage-selector').setValue('FAMILY_TABLE')
        setupBaby(24, 'baby-2')
        await flushPromises()
        expect(stageValue(wrapper)).toBe('FAMILY_TABLE')
      })

      it('preserves an explicit Sin definir selection when the active profile changes', async () => {
        setupBaby(10)
        const wrapper = mountPage()
        await flushPromises()
        await wrapper.find('#stage-selector').setValue(null)
        setupBaby(24, 'baby-2')
        await flushPromises()
        expect(stageValue(wrapper)).toBe('')
      })
      it('keeps the stored stage when edit mode loads a plate', async () => {
        setupBaby(10)
        route.params = { id: 'plate-1' }
        const plateStore = usePlateStore()
        plateStore.loadPlate = vi.fn().mockResolvedValue({
          id: 'plate-1', userId: 'user-1', babyProfileId: null, name: 'Saved plate',
          groupCount: 4, balanceScore: 0, astringentCount: 0, laxativeCount: 0, neutralCount: 0,
          stageFor: 'FAMILY_TABLE', deletedAt: null, items: [],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        })
        const wrapper = mountPage()
        await flushPromises()
        expect(stageValue(wrapper)).toBe('FAMILY_TABLE')
      })

})


function savedPlate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'plate-7', userId: 'user-1', babyProfileId: null, name: 'Plato guardado',
    groupCount: 4, balanceScore: 0, astringentCount: 0, laxativeCount: 0, neutralCount: 0,
    stageFor: 'TEN_TO_TWELVE_MONTHS', deletedAt: null, items: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeFood() {
  return {
    id: 'food-apple', name: 'Manzana', group: 'FRUIT', alClassification: 'NEUTRAL',
    alScore: 0, isAllergen: false, isIronRich: false, ageMonths: 6,
    needsValidation: false, warningTags: [], createdAt: '', updatedAt: '',
  }
}

describe('PlateBuilderPage cancel/back navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    route.params = {}
    route.query = {}
    router.push.mockClear()
    router.back.mockClear()
  })
  afterEach(() => { vi.restoreAllMocks() })

  it('navigates to /plates (create) or /plates/:id (edit) on unchanged draft', async () => {
    await mountPage().find('[data-testid="cancel-button"]').trigger('click')
    await flushPromises()
    expect(router.push).toHaveBeenCalledWith('/plates')

    setupBaby(10)
    route.params = { id: 'plate-7' }
    usePlateStore().loadPlate = vi.fn().mockResolvedValue(savedPlate())
    const edit = mountPage()
    await flushPromises()
    await edit.find('[data-testid="cancel-button"]').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/plates/plate-7')
  })

  it('does NOT prompt on inferred stage only', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    setupBaby(10)
    const wrapper = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="cancel-button"]').trigger('click')
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith('/plates')
  })

  it('prompts on name edit and keeps editing on reject', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const wrapper = mountPage()
    await flushPromises()
    await wrapper.find('.plate-name-input').setValue('Mi nuevo plato')
    await wrapper.find('[data-testid="cancel-button"]').trigger('click')
    expect(confirmSpy).toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('prompts on food serving change in edit-loaded plate', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    setupBaby(10)
    route.params = { id: 'plate-7' }
    usePlateStore().loadPlate = vi.fn().mockResolvedValue(savedPlate({
      items: [{
        id: 'server-item-1', plateId: 'plate-7', foodId: 'food-apple', groupAssignment: 'FRUIT',
        servingAmount: '2', createdAt: new Date().toISOString(),
        food: makeFood(),
      }],
    }))
    const wrapper = mountPage()
    await flushPromises()
    const items = wrapper.findComponent({ name: 'PlateContents' }).props('items') as Array<{ id: string }>
    wrapper.findComponent({ name: 'PlateContents' }).vm.$emit('update-serving-amount', items[0].id, '3')
    await flushPromises()
    await wrapper.find('[data-testid="cancel-button"]').trigger('click')
    expect(confirmSpy).toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('routes to /plates/:id when loadPlate rejects (clean draft, no prompt)', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    setupBaby(10)
    route.params = { id: 'plate-7' }
    usePlateStore().loadPlate = vi.fn().mockRejectedValue(new Error('not found'))
    const wrapper = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="cancel-button"]').trigger('click')
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith('/plates/plate-7')
  })

  it('detects edits made while fetchFoods is pending (baseline captured before await)', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const foodStore = useFoodStore()
    let resolve!: () => void
    foodStore.fetchFoods = vi.fn().mockImplementation(
      () => new Promise<void>((r) => { resolve = r }),
    )
    const wrapper = mountPage()
    await flushPromises()
    await wrapper.find('.plate-name-input').setValue('Edit during load')
    await wrapper.find('[data-testid="cancel-button"]').trigger('click')
    expect(confirmSpy).toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
    resolve()
    await flushPromises()
  })

  it('surfaces catalog failure with toast (visible failure surface)', async () => {
    useFoodStore().fetchFoods = vi.fn().mockRejectedValue(new Error('network'))
    const wrapper = mountPage()
    await flushPromises()
    const toast = wrapper.find('.toast')
    expect(toast.exists()).toBe(true)
    expect(toast.text()).toMatch(/cat[aá]logo|aliment|error/)
  })
})

describe('PlateBuilderPage edit-mode load lock', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    route.params = {}
    route.query = {}
    router.push.mockClear()
  })
  afterEach(() => { vi.restoreAllMocks() })

  it('disables controls while edit load is pending, enables after resolve', async () => {
    setupBaby(10)
    route.params = { id: 'plate-7' }
    let resolveLoad!: (p: unknown) => void
    usePlateStore().loadPlate = vi.fn().mockImplementation(
      () => new Promise<unknown>((r) => { resolveLoad = r }),
    )
    const wrapper = mountPage()
    await flushPromises()
    expect((wrapper.find('.plate-name-input').element as HTMLInputElement).disabled).toBe(true)
    expect((wrapper.find('#stage-selector').element as HTMLSelectElement).disabled).toBe(true)
    for (const t of wrapper.findAll('.toggle-btn')) {
      expect((t.element as HTMLButtonElement).disabled).toBe(true)
    }
    expect(wrapper.find('[data-testid="cancel-button"]').attributes('disabled')).toBeUndefined()
    resolveLoad(savedPlate())
    await flushPromises()
    expect((wrapper.find('.plate-name-input').element as HTMLInputElement).disabled).toBe(false)
  })

  it('blocks every child draft mutation path until edit initialization completes', async () => {
    route.params = { id: 'plate-7' }
    let resolveLoad!: (p: unknown) => void
    usePlateStore().loadPlate = vi.fn().mockImplementation(
      () => new Promise<unknown>((resolve) => { resolveLoad = resolve }),
    )
    const confirmSpy = vi.spyOn(window, 'confirm')
    const wrapper = mountPage()
    await flushPromises()
    const visualization = wrapper.findComponent({ name: 'PlateVisualization' })
    const contents = wrapper.findComponent({ name: 'PlateContents' })
    const modal = wrapper.findComponent({ name: 'FoodSearchModal' })

    visualization.vm.$emit('select-group', 'FRUIT')
    visualization.vm.$emit('remove-item', 'draft-item')
    contents.vm.$emit('select-group', 'FRUIT')
    contents.vm.$emit('remove-item', 'draft-item')
    contents.vm.$emit('update-serving-amount', 'draft-item', '4')
    modal.vm.$emit('add-food', makeFood(), 'FRUIT')
    modal.vm.$emit('remove-food', 'draft-item')
    wrapper.findComponent({ name: 'PlateActions' }).vm.$emit('clear')
    await flushPromises()

    expect(modal.props('isOpen')).toBe(false)
    expect(visualization.props('items')).toEqual([])
    expect(confirmSpy).not.toHaveBeenCalled()

    resolveLoad(savedPlate())
    await flushPromises()
    visualization.vm.$emit('select-group', 'FRUIT')
    modal.vm.$emit('add-food', makeFood(), 'FRUIT')
    await flushPromises()
    expect(modal.props('isOpen')).toBe(false)
    expect(visualization.props('items')).toHaveLength(1)
  })

  it('shows error banner, blocks save, and keeps cancel working when load rejects', async () => {
    setupBaby(10)
    route.params = { id: 'plate-7' }
    usePlateStore().loadPlate = vi.fn().mockRejectedValue(new Error('not found'))
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="plate-load-error"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'PlateActions' }).props('canSave')).toBe(false)
    await wrapper.find('[data-testid="cancel-button"]').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/plates/plate-7')
  })

  it('locks controls from the start of init through loadPlate completion (covers fetchFoods window)', async () => {
    setupBaby(10)
    route.params = { id: 'plate-7' }
    const foodStore = useFoodStore()
    let resolveFoods!: () => void
    let resolveLoad!: (p: unknown) => void
    foodStore.fetchFoods = vi.fn().mockImplementation(
      () => new Promise<void>((r) => { resolveFoods = r }),
    )
    usePlateStore().loadPlate = vi.fn().mockImplementation(
      () => new Promise<unknown>((r) => { resolveLoad = r }),
    )
    const wrapper = mountPage()
    // Flush the synchronous DOM update for the loadingPlate = true write.
    // fetchFoods is mocked to never resolve, so onMounted is paused at the
    // await — the lock must already be active here (regression: controls
    // used to be enabled until loadPlate started).
    await flushPromises()
    expect((wrapper.find('.plate-name-input').element as HTMLInputElement).disabled).toBe(true)
    expect((wrapper.find('#stage-selector').element as HTMLSelectElement).disabled).toBe(true)
    for (const t of wrapper.findAll('.toggle-btn')) {
      expect((t.element as HTMLButtonElement).disabled).toBe(true)
    }
    expect(wrapper.findComponent({ name: 'PlateActions' }).props('canSave')).toBe(false)
    expect(wrapper.find('[data-testid="cancel-button"]').attributes('disabled')).toBeUndefined()

    // Resolve fetchFoods but leave loadPlate pending — still locked.
    resolveFoods()
    await flushPromises()
    expect((wrapper.find('.plate-name-input').element as HTMLInputElement).disabled).toBe(true)
    expect((wrapper.find('#stage-selector').element as HTMLSelectElement).disabled).toBe(true)

    // Resolve loadPlate — now unlocked.
    resolveLoad(savedPlate())
    await flushPromises()
    expect((wrapper.find('.plate-name-input').element as HTMLInputElement).disabled).toBe(false)
    expect((wrapper.find('#stage-selector').element as HTMLSelectElement).disabled).toBe(false)
    for (const t of wrapper.findAll('.toggle-btn')) {
      expect((t.element as HTMLButtonElement).disabled).toBe(false)
    }
  })

  it('keeps controls enabled in create mode while fetchFoods is pending', async () => {
    const foodStore = useFoodStore()
    let resolveFoods!: () => void
    foodStore.fetchFoods = vi.fn().mockImplementation(
      () => new Promise<void>((r) => { resolveFoods = r }),
    )
    const wrapper = mountPage()
    expect((wrapper.find('.plate-name-input').element as HTMLInputElement).disabled).toBe(false)
    expect((wrapper.find('#stage-selector').element as HTMLSelectElement).disabled).toBe(false)
    expect(wrapper.findComponent({ name: 'PlateActions' }).props('canSave')).toBe(false)
    resolveFoods()
    await flushPromises()
  })
})

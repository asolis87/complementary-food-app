import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { BabyProfile } from '@pakulab/shared'
import PlateBuilderPage from './PlateBuilderPage.vue'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { usePlateStore } from '@/shared/stores/plateStore.js'

const route = vi.hoisted(() => ({ params: {} as Record<string, string>, query: {} as Record<string, string> }))

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
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

vi.mock('./components/PlateVisualization.vue', () => ({ default: { template: '<div />', props: ['items', 'groupCount'] } }))
vi.mock('./components/BalanceIndicator.vue', () => ({ default: { template: '<div />', props: ['balance'] } }))
vi.mock('./components/PlateContents.vue', () => ({ default: { template: '<div />', props: ['items', 'groupCount'] } }))
vi.mock('./components/FoodSearchModal.vue', () => ({ default: { template: '<div />', props: ['isOpen'] } }))
vi.mock('./components/PlateActions.vue', () => ({ default: { template: '<div />', props: ['canSave'] } }))
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

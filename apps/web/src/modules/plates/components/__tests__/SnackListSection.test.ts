import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SnackListSection from '../SnackListSection.vue'
import { useSnackStore } from '@/shared/stores/snackStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import type { Snack } from '@pakulab/shared'

vi.mock('@/shared/stores/snackStore.js')
vi.mock('@/shared/stores/authStore.js')
vi.mock('@/shared/components/SnackBuilderDrawer.vue', () => ({
  default: {
    name: 'SnackBuilderDrawer',
    template: '<div data-test="snack-builder-drawer" />',
  },
}))

describe('SnackListSection', () => {
  const mockSnackStore = {
    savedSnacks: [] as Snack[],
    fetchSavedSnacks: vi.fn(),
    deleteSnack: vi.fn(),
    fetchMoreSnacks: vi.fn(),
    totalSnacks: 0,
    hasMore: false,
    loading: false,
    fetchMoreLoading: false,
  }

  const mockAuthStore = {
    tier: 'PRO' as const,
    isAuthenticated: true,
    isPro: true,
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockSnackStore.savedSnacks = []
    mockSnackStore.hasMore = false
    mockSnackStore.loading = false
    mockSnackStore.fetchMoreLoading = false
    mockSnackStore.totalSnacks = 0
    mockAuthStore.tier = 'PRO'
    mockAuthStore.isPro = true
    vi.mocked(useSnackStore).mockReturnValue(mockSnackStore as any)
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore as any)
  })

  const mountOptions = {
    global: {
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>',
        },
        Teleport: true,
      },
    },
  }

  describe('Empty state (REQ-SC2)', () => {
    it('should render empty state when no snacks', () => {
      mockSnackStore.savedSnacks = []
      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      expect(wrapper.text()).toContain('No tienes colaciones guardadas todavía')
      expect(wrapper.text()).toContain('Crear colación')
    })

    it('should open drawer on create button click in empty state', async () => {
      mockSnackStore.savedSnacks = []
      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      const createBtn = wrapper.find('[data-test="create-snack-btn"]')
      expect(createBtn.exists()).toBe(true)
      await createBtn.trigger('click')

      // Drawer should be visible
      expect(wrapper.find('[data-test="snack-builder-drawer"]').exists()).toBe(true)
    })
  })

  describe('Snack grid (REQ-SC2)', () => {
    it('should render snack cards with name and item count', () => {
      mockSnackStore.savedSnacks = [
        {
          id: 'snack-1',
          name: 'Mi colación saludable',
          items: [
            { id: 'item-1', foodId: 'food-1', groupAssignment: 'HEALTHY_FAT' },
            { id: 'item-2', foodId: 'food-2', groupAssignment: 'CEREAL_TUBER' },
            { id: 'item-3', foodId: 'food-3', groupAssignment: 'FRUIT' },
          ],
          createdAt: '2026-07-07T10:00:00Z',
        } as any,
        {
          id: 'snack-2',
          name: 'Colación rápida',
          items: [
            { id: 'item-4', foodId: 'food-4', groupAssignment: 'HEALTHY_FAT' },
          ],
          createdAt: '2026-07-06T10:00:00Z',
        } as any,
      ]

      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      expect(wrapper.text()).toContain('Mi colación saludable')
      expect(wrapper.text()).toContain('Colación rápida')
      expect(wrapper.text()).toContain('3 alimentos')
      expect(wrapper.text()).toContain('1 alimento')
    })

    it('should NOT render balance score or icon (REQ-SC7)', () => {
      mockSnackStore.savedSnacks = [
        {
          id: 'snack-1',
          name: 'Snack test',
          items: [
            { id: 'item-1', foodId: 'food-1', groupAssignment: 'HEALTHY_FAT' },
          ],
          createdAt: '2026-07-07T10:00:00Z',
        } as any,
      ]

      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      // Should NOT contain balance-related text
      expect(wrapper.text()).not.toContain('Equilibrado')
      expect(wrapper.text()).not.toContain('Astringente')
      expect(wrapper.text()).not.toContain('Laxante')
      expect(wrapper.find('.balance-badge').exists()).toBe(false)
    })
  })

  describe('Delete confirmation (REQ-SC5)', () => {
    it('should open confirmation modal on delete button click', async () => {
      mockSnackStore.savedSnacks = [
        {
          id: 'snack-1',
          name: 'Test snack',
          items: [{ id: 'item-1', foodId: 'food-1', groupAssignment: 'HEALTHY_FAT' }],
          createdAt: '2026-07-07T10:00:00Z',
        } as any,
      ]

      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      const deleteBtn = wrapper.find('[data-test="delete-snack-btn"]')
      await deleteBtn.trigger('click')

      // Modal overlay should be visible
      const modal = wrapper.find('.modal-overlay')
      expect(modal.exists()).toBe(true)
      expect(modal.text()).toContain('¿Eliminar colación?')
      expect(modal.text()).toContain('Esta acción no se puede deshacer')
    })

    it('should call deleteSnack on confirm', async () => {
      mockSnackStore.savedSnacks = [
        {
          id: 'snack-1',
          name: 'Test snack',
          items: [{ id: 'item-1', foodId: 'food-1', groupAssignment: 'HEALTHY_FAT' }],
          createdAt: '2026-07-07T10:00:00Z',
        } as any,
      ]

      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      const deleteBtn = wrapper.find('[data-test="delete-snack-btn"]')
      await deleteBtn.trigger('click')

      const confirmBtn = wrapper.find('.btn-confirm-delete')
      await confirmBtn.trigger('click')

      expect(mockSnackStore.deleteSnack).toHaveBeenCalledWith('snack-1')
    })

    it('closes the modal even when deleteSnack fails (no stranded dialog)', async () => {
      mockSnackStore.savedSnacks = [
        {
          id: 'snack-1',
          name: 'Test snack',
          items: [{ id: 'item-1', foodId: 'food-1', groupAssignment: 'HEALTHY_FAT' }],
          createdAt: '2026-07-07T10:00:00Z',
        } as any,
      ]
      mockSnackStore.deleteSnack.mockRejectedValueOnce(new Error('Network error'))

      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      await wrapper.find('[data-test="delete-snack-btn"]').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)

      await wrapper.find('.btn-confirm-delete').trigger('click')
      await flushPromises()

      // Modal must NOT stay open on failure (mirrors PlateDetailPage finally-close)
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('should close modal on cancel', async () => {
      mockSnackStore.savedSnacks = [
        {
          id: 'snack-1',
          name: 'Test snack',
          items: [{ id: 'item-1', foodId: 'food-1', groupAssignment: 'HEALTHY_FAT' }],
          createdAt: '2026-07-07T10:00:00Z',
        } as any,
      ]

      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      const deleteBtn = wrapper.find('[data-test="delete-snack-btn"]')
      await deleteBtn.trigger('click')

      expect(wrapper.find('.modal-overlay').exists()).toBe(true)

      const cancelBtn = wrapper.find('.btn-cancel')
      await cancelBtn.trigger('click')

      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
      expect(mockSnackStore.deleteSnack).not.toHaveBeenCalled()
    })

    it('should show empty state after deleting last snack', async () => {
      mockSnackStore.savedSnacks = [
        {
          id: 'snack-1',
          name: 'Last snack',
          items: [{ id: 'item-1', foodId: 'food-1', groupAssignment: 'HEALTHY_FAT' }],
          createdAt: '2026-07-07T10:00:00Z',
        } as any,
      ]

      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      const deleteBtn = wrapper.find('[data-test="delete-snack-btn"]')
      await deleteBtn.trigger('click')
      const confirmBtn = wrapper.find('.btn-confirm-delete')

      // Simulate deletion
      mockSnackStore.savedSnacks = []
      await confirmBtn.trigger('click')

      // Wait for reactivity
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('No tienes colaciones guardadas todavía')
    })
  })

  describe('Tier gate (REQ-SC6)', () => {
    it('should show upsell banner when at FREE tier limit', () => {
      mockAuthStore.tier = 'FREE'
      mockAuthStore.isPro = false
      mockSnackStore.savedSnacks = [] // FREE limit is 0, so 0 snacks = at limit

      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      // When at FREE limit, should show upsell banner instead of empty state
      expect(wrapper.text()).toContain('Alcanzaste el límite de colaciones del plan gratuito')
      expect(wrapper.text()).toContain('Actualiza a Pro')
    })

    it('should NOT show upsell banner when PRO', () => {
      mockAuthStore.tier = 'PRO'
      mockAuthStore.isPro = true
      mockSnackStore.savedSnacks = []

      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      expect(wrapper.text()).not.toContain('Alcanzaste el límite')
      // Should show empty state instead
      expect(wrapper.text()).toContain('No tienes colaciones guardadas todavía')
    })
  })

  describe('Load more (REQ-SC2)', () => {
    it('should render load-more button when hasMore is true', () => {
      mockSnackStore.savedSnacks = [
        {
          id: 'snack-1',
          name: 'Snack 1',
          items: [],
          createdAt: '2026-07-07T10:00:00Z',
        } as any,
      ]
      mockSnackStore.hasMore = true

      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      const loadMoreBtn = wrapper.find('[data-test="load-more-btn"]')
      expect(loadMoreBtn.exists()).toBe(true)
    })

    it('should call fetchMoreSnacks on load-more click', async () => {
      mockSnackStore.savedSnacks = [
        {
          id: 'snack-1',
          name: 'Snack 1',
          items: [],
          createdAt: '2026-07-07T10:00:00Z',
        } as any,
      ]
      mockSnackStore.hasMore = true

      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      const loadMoreBtn = wrapper.find('[data-test="load-more-btn"]')
      await loadMoreBtn.trigger('click')

      expect(mockSnackStore.fetchMoreSnacks).toHaveBeenCalled()
    })
  })

  describe('Loading state (REQ-SC2)', () => {
    it('should render loading spinner when loading', () => {
      mockSnackStore.loading = true

      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      expect(wrapper.text()).toContain('Cargando colaciones...')
    })
  })

  describe('Drawer integration', () => {
    it('should pass babyAgeMonths to drawer', async () => {
      mockSnackStore.savedSnacks = []
      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 15 },
        ...mountOptions,
      })

      const createBtn = wrapper.find('[data-test="create-snack-btn"]')
      await createBtn.trigger('click')

      const drawer = wrapper.find('[data-test="snack-builder-drawer"]')
      expect(drawer.exists()).toBe(true)
      expect(drawer.attributes('age-months')).toBe('15')
    })

    it('should close drawer and refresh list on snack-created event', async () => {
      mockSnackStore.savedSnacks = []
      const wrapper = mount(SnackListSection, {
        props: { babyAgeMonths: 11 },
        ...mountOptions,
      })

      const createBtn = wrapper.find('[data-test="create-snack-btn"]')
      await createBtn.trigger('click')

      const drawer = wrapper.findComponent({ name: 'SnackBuilderDrawer' })
      expect(drawer.exists()).toBe(true)

      // Simulate snack-created event
      await drawer.vm.$emit('snack-created', {
        id: 'new-snack',
        name: 'New snack',
        items: [],
      })

      await wrapper.vm.$nextTick()

      // Drawer should be closed
      expect(wrapper.find('[data-test="snack-builder-drawer"]').exists()).toBe(false)
    })
  })
})

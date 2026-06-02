/**
 * RoadmapDetailPage component tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'
import RoadmapDetailPage from './RoadmapDetailPage.vue'
import { useDashboardStore } from '@/shared/stores/dashboardStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import type { DashboardData, RoadmapProgress } from '@pakulab/shared'

// Mock the stores
vi.mock('@/shared/stores/dashboardStore.js')
vi.mock('@/shared/stores/profileStore.js')

describe('RoadmapDetailPage', () => {
  const mockVegetableProgress: RoadmapProgress = {
    group: 'VEGETABLE',
    labelEs: 'Verduras',
    triedCount: 3,
    totalCount: 5,
    percentage: 60,
    foods: [
      { foodId: 'v1', name: 'Zanahoria', status: 'tried' },
      { foodId: 'v2', name: 'Brócoli', status: 'tried' },
      { foodId: 'v3', name: 'Calabaza', status: 'tried' },
      { foodId: 'v4', name: 'Espinaca', status: 'pending' },
      { foodId: 'v5', name: 'Batata', status: 'rejected' },
    ],
  }

  const mockFruitProgress: RoadmapProgress = {
    group: 'FRUIT',
    labelEs: 'Frutas',
    triedCount: 2,
    totalCount: 4,
    percentage: 50,
    foods: [
      { foodId: 'f1', name: 'Manzana', status: 'tried' },
      { foodId: 'f2', name: 'Pera', status: 'tried' },
      { foodId: 'f3', name: 'Banana', status: 'pending' },
      { foodId: 'f4', name: 'Durazno', status: 'pending' },
    ],
  }

  const mockDashboardData: Partial<DashboardData> = {
    baby: {
      id: 'baby-1',
      name: 'Benjamín',
      ageInMonths: 8,
      daysInAC: 60,
    },
    roadmapProgress: [mockVegetableProgress, mockFruitProgress],
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Setup default mock implementation for profileStore
    vi.mocked(useProfileStore).mockReturnValue({
      activeProfile: {
        id: 'profile-1',
        name: 'Benjamín',
        birthDate: '2025-10-01',
        acStartDate: '2026-04-01',
        userId: 'user-1',
        createdAt: '',
        updatedAt: '',
        ageInMonths: 8,
        daysInAC: 60,
      },
      profiles: [],
      loading: false,
      error: null,
      fetchProfiles: vi.fn().mockResolvedValue(undefined),
      createProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteProfile: vi.fn(),
    } as any)

    // Setup default mock implementation for dashboardStore
    vi.mocked(useDashboardStore).mockReturnValue({
      dashboardData: mockDashboardData as DashboardData,
      loading: false,
      error: null,
      fetchDashboard: vi.fn().mockResolvedValue(undefined),
    } as any)
  })

  it('renders baby name and subtitles correctly', () => {
    const wrapper = mount(RoadmapDetailPage, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Roadmap de Benjamín')
    expect(wrapper.text()).toContain('Desglose completo de su progreso')
  })

  it('renders overall stats cards with correct metrics', () => {
    const wrapper = mount(RoadmapDetailPage, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })
    // Total elements = 5 (veg) + 4 (fruit) = 9
    // Total tried = 3 (veg) + 2 (fruit) = 5
    // Total percentage = 5 / 9 = 56%
    // Total rejected = 1 (batata)
    // Total pending = 9 - 5 - 1 = 3
    expect(wrapper.text()).toContain('56%')
    expect(wrapper.text()).toContain('5 de 9 alimentos probados')
    expect(wrapper.text()).toContain('Alimentos Aceptados')
    expect(wrapper.find('.stat-card--progress').text()).toContain('Avance Total')
  })

  it('renders categories with correct progress fraction and percentage', () => {
    const wrapper = mount(RoadmapDetailPage, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Verduras')
    expect(wrapper.text()).toContain('3/ 5')
    expect(wrapper.text()).toContain('60%')
  })

  it('renders all food items under correct category sections by default', () => {
    const wrapper = mount(RoadmapDetailPage, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Zanahoria')
    expect(wrapper.text()).toContain('Batata')
    expect(wrapper.text()).toContain('Manzana')
  })

  it('filters food items based on selected tab click', async () => {
    const wrapper = mount(RoadmapDetailPage, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    // Click "Probados" tab
    const tabs = wrapper.findAll('.filter-tab')
    const triedTab = tabs.find((t) => t.text().includes('Probados'))
    expect(triedTab).toBeDefined()
    await triedTab!.trigger('click')

    // Only tried foods should show
    expect(wrapper.text()).toContain('Zanahoria')
    expect(wrapper.text()).toContain('Manzana')
    // Pending/Rejected should be hidden
    expect(wrapper.text()).not.toContain('Batata')
    expect(wrapper.text()).not.toContain('Espinaca')
  })

  it('shows loading state when store loading is active', () => {
    // Override store mock for loading state
    vi.mocked(useDashboardStore).mockReturnValue({
      dashboardData: null,
      loading: true,
      error: null,
      fetchDashboard: vi.fn(),
    } as any)

    const wrapper = mount(RoadmapDetailPage, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })
    expect(wrapper.find('.loading-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('Cargando roadmap de alimentos')
  })
})

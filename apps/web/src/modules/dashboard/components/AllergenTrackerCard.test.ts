import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed } from 'vue'
import AllergenTrackerCard from './AllergenTrackerCard.vue'
import { apiClient } from '@/shared/api/client.js'

vi.mock('@/shared/api/client.js', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

// Mock authStore for TierGate - default to PRO
const mockAuthStore = {
  tier: computed(() => 'PRO' as 'PRO' | 'FREE'),
  isPro: computed(() => true),
  isFree: computed(() => false),
  isAuthenticated: computed(() => true),
}

vi.mock('@/shared/stores/authStore.js', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}))

describe('AllergenTrackerCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // Helper to stub TierGate so PRO content always shows in tests
  const mountWithProAccess = (props: any) =>
    mount(AllergenTrackerCard, {
      props,
      global: {
        stubs: { TierGate: { template: '<div><slot /></div>' } },
      },
    })

  describe('T-04-06: base component rendering', () => {
    it('does NOT render when baby is younger than 6 months', () => {
      const wrapper = mount(AllergenTrackerCard, {
        props: {
          babyAgeMonths: 4,
          tier: 'PRO',
          babyProfileId: 'baby-123',
        },
      })

      expect(wrapper.find('.allergen-tracker-card').exists()).toBe(false)
    })

    it('renders card when baby is 6+ months AND user is PRO', async () => {
      const mockResponse = {
        ageMonths: 8,
        closingWindow: false,
        allergens: [
          {
            type: 'dairy',
            name: 'Leche / Lácteos',
            status: 'introduced',
            introducedAt: '2026-01-01',
            exposureCount: 3,
            lastReaction: 'LIKED',
          },
          {
            type: 'egg',
            name: 'Huevo',
            status: 'in_window',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mountWithProAccess({
        babyAgeMonths: 8,
        tier: 'PRO',
        babyProfileId: 'baby-123',
      })

      // Wait for async data fetch
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.find('.allergen-tracker-card').exists()).toBe(true)
      expect(wrapper.find('.card-title').text()).toBe('Alérgenos prioritarios')
    })

    it('shows status chips: verde (introduced), amarillo (in_window), rojo (pending)', async () => {
      const mockResponse = {
        ageMonths: 11,
        closingWindow: true,
        allergens: [
          {
            type: 'dairy',
            name: 'Leche / Lácteos',
            status: 'introduced',
            introducedAt: '2026-01-01',
            exposureCount: 3,
            lastReaction: 'LIKED',
          },
          {
            type: 'egg',
            name: 'Huevo',
            status: 'in_window',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
          {
            type: 'peanut',
            name: 'Cacahuate',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mountWithProAccess({
        babyAgeMonths: 11,
        tier: 'PRO',
        babyProfileId: 'baby-123',
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const introducedChips = wrapper.findAll('.allergen-chip--introduced')
      const inWindowChips = wrapper.findAll('.allergen-chip--in_window')
      const pendingChips = wrapper.findAll('.allergen-chip--pending')

      expect(introducedChips.length).toBe(1)
      expect(inWindowChips.length).toBe(1)
      expect(pendingChips.length).toBe(1)
    })

    it('shows exposure count when exposureCount > 0', async () => {
      const mockResponse = {
        ageMonths: 8,
        closingWindow: false,
        allergens: [
          {
            type: 'egg',
            name: 'Huevo',
            status: 'introduced',
            introducedAt: '2026-01-01',
            exposureCount: 3,
            lastReaction: 'LIKED',
          },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mountWithProAccess({
        babyAgeMonths: 8,
        tier: 'PRO',
        babyProfileId: 'baby-123',
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('3 exposiciones')
    })

    it('shows closingWindow banner when closingWindow = true AND introducedCount < total', async () => {
      const mockResponse = {
        ageMonths: 11,
        closingWindow: true,
        allergens: [
          {
            type: 'dairy',
            name: 'Leche / Lácteos',
            status: 'introduced',
            introducedAt: '2026-01-01',
            exposureCount: 3,
            lastReaction: 'LIKED',
          },
          {
            type: 'egg',
            name: 'Huevo',
            status: 'introduced',
            introducedAt: '2026-01-15',
            exposureCount: 2,
            lastReaction: 'NEUTRAL',
          },
          {
            type: 'soy',
            name: 'Soya',
            status: 'introduced',
            introducedAt: '2026-01-20',
            exposureCount: 1,
            lastReaction: 'LIKED',
          },
          {
            type: 'peanut',
            name: 'Cacahuate',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
          {
            type: 'fish',
            name: 'Pescado',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
          {
            type: 'shellfish',
            name: 'Mariscos',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
          {
            type: 'wheat',
            name: 'Trigo / Gluten',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
          {
            type: 'tree_nut',
            name: 'Nueces / Frutos secos',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mountWithProAccess({
        babyAgeMonths: 11,
        tier: 'PRO',
        babyProfileId: 'baby-123',
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.find('.closing-window-banner').exists()).toBe(true)
      expect(wrapper.text()).toContain('5 alérgenos sin introducir, ventana cerrándose')
    })

    it('does NOT show banner when closingWindow = false', async () => {
      const mockResponse = {
        ageMonths: 7,
        closingWindow: false,
        allergens: [
          {
            type: 'peanut',
            name: 'Cacahuate',
            status: 'in_window',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mountWithProAccess({
        babyAgeMonths: 7,
        tier: 'PRO',
        babyProfileId: 'baby-123',
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.find('.closing-window-banner').exists()).toBe(false)
    })

    it('does NOT show banner when all allergens are introduced', async () => {
      const mockResponse = {
        ageMonths: 14,
        closingWindow: true,
        allergens: Array.from({ length: 8 }, (_, i) => ({
          type: `allergen-${i}`,
          name: `Alérgeno ${i}`,
          status: 'introduced',
          introducedAt: '2026-01-01',
          exposureCount: 2,
          lastReaction: 'LIKED',
        })),
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mountWithProAccess({
        babyAgeMonths: 14,
        tier: 'PRO',
        babyProfileId: 'baby-123',
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.find('.closing-window-banner').exists()).toBe(false)
    })
  })

  describe('TRIANGULATE: edge cases', () => {
    it('baby 7m, 0 introduced, closingWindow = false → 8 amarillo chips, NO banner', async () => {
      const mockResponse = {
        ageMonths: 7,
        closingWindow: false,
        allergens: Array.from({ length: 8 }, (_, i) => ({
          type: `allergen-${i}`,
          name: `Alérgeno ${i}`,
          status: 'in_window',
          introducedAt: null,
          exposureCount: 0,
          lastReaction: null,
        })),
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mountWithProAccess({
        babyAgeMonths: 7,
        tier: 'PRO',
        babyProfileId: 'baby-123',
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const inWindowChips = wrapper.findAll('.allergen-chip--in_window')
      expect(inWindowChips.length).toBe(8)
      expect(wrapper.find('.closing-window-banner').exists()).toBe(false)
    })

    it('baby 11m, 3 introduced, closingWindow = true → 3 verde + 5 rojo chips, banner "5 alérgenos sin introducir"', async () => {
      const mockResponse = {
        ageMonths: 11,
        closingWindow: true,
        allergens: [
          {
            type: 'dairy',
            name: 'Leche / Lácteos',
            status: 'introduced',
            introducedAt: '2026-01-01',
            exposureCount: 3,
            lastReaction: 'LIKED',
          },
          {
            type: 'egg',
            name: 'Huevo',
            status: 'introduced',
            introducedAt: '2026-01-05',
            exposureCount: 2,
            lastReaction: 'NEUTRAL',
          },
          {
            type: 'soy',
            name: 'Soya',
            status: 'introduced',
            introducedAt: '2026-01-10',
            exposureCount: 1,
            lastReaction: 'LIKED',
          },
          {
            type: 'peanut',
            name: 'Cacahuate',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
          {
            type: 'fish',
            name: 'Pescado',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
          {
            type: 'shellfish',
            name: 'Mariscos',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
          {
            type: 'wheat',
            name: 'Trigo / Gluten',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
          {
            type: 'tree_nut',
            name: 'Nueces / Frutos secos',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mountWithProAccess({
        babyAgeMonths: 11,
        tier: 'PRO',
        babyProfileId: 'baby-123',
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const introducedChips = wrapper.findAll('.allergen-chip--introduced')
      const pendingChips = wrapper.findAll('.allergen-chip--pending')

      expect(introducedChips.length).toBe(3)
      expect(pendingChips.length).toBe(5)
      expect(wrapper.find('.closing-window-banner').exists()).toBe(true)
      expect(wrapper.text()).toContain('5 alérgenos sin introducir, ventana cerrándose')
    })

    it('baby 14m, 8 introduced, closingWindow = true → 8 verde chips, NO banner', async () => {
      const mockResponse = {
        ageMonths: 14,
        closingWindow: true,
        allergens: Array.from({ length: 8 }, (_, i) => ({
          type: `allergen-${i}`,
          name: `Alérgeno ${i}`,
          status: 'introduced',
          introducedAt: '2026-01-01',
          exposureCount: 2,
          lastReaction: 'LIKED',
        })),
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mountWithProAccess({
        babyAgeMonths: 14,
        tier: 'PRO',
        babyProfileId: 'baby-123',
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const introducedChips = wrapper.findAll('.allergen-chip--introduced')
      expect(introducedChips.length).toBe(8)
      expect(wrapper.find('.closing-window-banner').exists()).toBe(false)
    })
  })

  describe('T-04-07: FREE user CTA', () => {
    it('FREE user sees teaser with upgrade CTA', async () => {
      const wrapper = mount(AllergenTrackerCard, {
        props: {
          babyAgeMonths: 8,
          tier: 'FREE',
          babyProfileId: 'baby-123',
        },
        global: {
          // FREE path renders UpgradePrompt → RouterLink; stub it to avoid the
          // "Failed to resolve component: RouterLink" warning in the test output.
          stubs: { RouterLink: RouterLinkStub },
        },
      })

      await wrapper.vm.$nextTick()

      // Should show the card
      expect(wrapper.find('.allergen-tracker-card').exists()).toBe(true)
      // Should show header
      expect(wrapper.text()).toContain('Alérgenos prioritarios')
      // Should NOT call API for FREE users
      expect(vi.mocked(apiClient.get)).not.toHaveBeenCalled()
    })
  })

  describe('T-04-10: Exposure reminder banner', () => {
    it('shows specific allergen reminder when closingWindow + pending', async () => {
      const mockResponse = {
        ageMonths: 11,
        closingWindow: true,
        allergens: [
          {
            type: 'dairy',
            name: 'Leche / Lácteos',
            status: 'introduced',
            introducedAt: '2026-01-01',
            exposureCount: 3,
            lastReaction: 'LIKED',
          },
          {
            type: 'peanut',
            name: 'Cacahuate',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
          {
            type: 'fish',
            name: 'Pescado',
            status: 'pending',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mountWithProAccess({
        babyAgeMonths: 11,
        tier: 'PRO',
        babyProfileId: 'baby-123',
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const banner = wrapper.find('.exposure-reminder-banner')
      expect(banner.exists()).toBe(true)
      expect(banner.text()).toContain('Ofrece Cacahuate esta semana, ventana cerrándose')
    })

    it('does NOT show exposure reminder if closingWindow = false', async () => {
      const mockResponse = {
        ageMonths: 8,
        closingWindow: false,
        allergens: [
          {
            type: 'peanut',
            name: 'Cacahuate',
            status: 'in_window',
            introducedAt: null,
            exposureCount: 0,
            lastReaction: null,
          },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mountWithProAccess({
        babyAgeMonths: 8,
        tier: 'PRO',
        babyProfileId: 'baby-123',
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.find('.exposure-reminder-banner').exists()).toBe(false)
    })

    it('does NOT show exposure reminder if no pending allergens', async () => {
      const mockResponse = {
        ageMonths: 14,
        closingWindow: true,
        allergens: [
          {
            type: 'dairy',
            name: 'Leche / Lácteos',
            status: 'introduced',
            introducedAt: '2026-01-01',
            exposureCount: 3,
            lastReaction: 'LIKED',
          },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mountWithProAccess({
        babyAgeMonths: 14,
        tier: 'PRO',
        babyProfileId: 'baby-123',
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.find('.exposure-reminder-banner').exists()).toBe(false)
    })
  })
})

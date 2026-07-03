import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SnackSuggestionCard from './SnackSuggestionCard.vue'
import { apiClient } from '@/shared/api/client.js'
import type { SuggestedFood } from '@pakulab/shared'

vi.mock('@/shared/api/client.js', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('SnackSuggestionCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('T-04-20: SnackSuggestionCard rendering', () => {
    it('does NOT render when baby is younger than 10 months (no snack slots)', () => {
      const wrapper = mount(SnackSuggestionCard, {
        props: {
          babyAgeMonths: 8,
          babyProfileId: 'baby-123',
        },
      })

      expect(wrapper.find('.snack-suggestion-card').exists()).toBe(false)
    })

    it('renders card when baby is 10+ months (has snack slots)', async () => {
      const mockResponse = {
        available: true,
        suggestions: [
          {
            foodId: 'f1',
            name: 'Plátano',
            group: 'FRUIT',
            ageMonths: 6,
            benefit: 'Fácil de digerir',
            isAllergen: false,
            allergenType: null,
            status: 'pending',
          },
          {
            foodId: 'f2',
            name: 'Yogur natural',
            group: 'PROTEIN',
            ageMonths: 8,
            benefit: 'Alto en proteína',
            isAllergen: false,
            allergenType: null,
            status: 'pending',
          },
          {
            foodId: 'f3',
            name: 'Mango',
            group: 'FRUIT',
            ageMonths: 6,
            benefit: 'Rico en vitaminas',
            isAllergen: false,
            allergenType: null,
            status: 'pending',
          },
          {
            foodId: 'f4',
            name: 'Queso panela',
            group: 'PROTEIN',
            ageMonths: 8,
            benefit: 'Buena fuente de calcio',
            isAllergen: true,
            allergenType: 'dairy',
            status: 'pending',
          },
          {
            foodId: 'f5',
            name: 'Zanahoria cocida',
            group: 'VEGETABLE',
            ageMonths: 6,
            benefit: 'Rica en beta-caroteno',
            isAllergen: false,
            allergenType: null,
            status: 'pending',
          },
        ] as SuggestedFood[],
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mount(SnackSuggestionCard, {
        props: {
          babyAgeMonths: 11,
          babyProfileId: 'baby-123',
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.find('.snack-suggestion-card').exists()).toBe(true)
      expect(wrapper.find('.card-title').text()).toBe('Ideas para la colación')
    })

    it('shows 5 suggestions when available', async () => {
      const mockResponse = {
        available: true,
        suggestions: Array.from({ length: 5 }, (_, i) => ({
          foodId: `f${i}`,
          name: `Alimento ${i}`,
          group: 'FRUIT',
          ageMonths: 6,
          benefit: 'Beneficio',
          isAllergen: false,
          allergenType: null,
          status: 'pending',
        })) as SuggestedFood[],
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mount(SnackSuggestionCard, {
        props: {
          babyAgeMonths: 11,
          babyProfileId: 'baby-123',
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const suggestionItems = wrapper.findAll('.suggestion-item')
      expect(suggestionItems.length).toBe(5)
    })

    it('does NOT render when snacks are not yet available (SNACKS_NOT_YET)', async () => {
      const mockResponse = {
        available: false,
        reason: 'SNACKS_NOT_YET',
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mount(SnackSuggestionCard, {
        props: {
          babyAgeMonths: 11,
          babyProfileId: 'baby-123',
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.find('.snack-suggestion-card').exists()).toBe(false)
    })

    it('emits viewFood event when "Ver detalle" is clicked', async () => {
      const mockResponse = {
        available: true,
        suggestions: [
          {
            foodId: 'f1',
            name: 'Yogur natural',
            group: 'PROTEIN',
            ageMonths: 8,
            benefit: 'Alto en proteína',
            isAllergen: false,
            allergenType: null,
            status: 'pending',
          },
        ] as SuggestedFood[],
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const wrapper = mount(SnackSuggestionCard, {
        props: {
          babyAgeMonths: 11,
          babyProfileId: 'baby-123',
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const suggestionItem = wrapper.find('.suggestion-item')
      await suggestionItem.trigger('click')

      expect(wrapper.emitted('viewFood')).toHaveLength(1)
      expect(wrapper.emitted('viewFood')![0]).toEqual(['f1'])
    })
  })
})

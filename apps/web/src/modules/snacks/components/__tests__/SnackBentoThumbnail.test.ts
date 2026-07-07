/**
 * Tests for SnackBentoThumbnail.vue — read-only bento preview shown on snack
 * cards. Verifies 3 group cells, correct food-per-group placement, empty cells,
 * the "+N" overflow, and a defensive fallback when an item lacks `food`.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import type { FoodGroup, SnackItemSummary } from '@pakulab/shared'
import SnackBentoThumbnail from '../SnackBentoThumbnail.vue'

function makeItem(group: FoodGroup, foodName: string): SnackItemSummary {
  return {
    id: `${foodName}-${Math.random()}`,
    snackId: 'snack-1',
    foodId: `food-${foodName}`,
    groupAssignment: group,
    servingAmount: null,
    createdAt: '',
    food: { id: `food-${foodName}`, name: foodName, group },
  }
}

describe('SnackBentoThumbnail', () => {
  it('renders exactly 3 group cells', () => {
    const wrapper = mount(SnackBentoThumbnail, { props: { items: [] } })
    expect(wrapper.findAll('.thumb-cell')).toHaveLength(3)
    expect(wrapper.find('.thumb-cell--fat').exists()).toBe(true)
    expect(wrapper.find('.thumb-cell--cereal').exists()).toBe(true)
    expect(wrapper.find('.thumb-cell--fruit').exists()).toBe(true)
  })

  it('places each food in its group cell', () => {
    const wrapper = mount(SnackBentoThumbnail, {
      props: {
        items: [
          makeItem('HEALTHY_FAT', 'Aguacate'),
          makeItem('CEREAL_TUBER', 'Avena'),
          makeItem('FRUIT', 'Manzana'),
        ],
      },
    })
    expect(wrapper.find('.thumb-cell--fat').text()).toContain('Aguacate')
    expect(wrapper.find('.thumb-cell--cereal').text()).toContain('Avena')
    expect(wrapper.find('.thumb-cell--fruit').text()).toContain('Manzana')
  })

  it('marks a group cell empty when it has no item', () => {
    const wrapper = mount(SnackBentoThumbnail, {
      props: { items: [makeItem('HEALTHY_FAT', 'Aguacate')] },
    })
    expect(wrapper.find('.thumb-cell--fat').classes()).not.toContain('thumb-cell--empty')
    expect(wrapper.find('.thumb-cell--cereal').classes()).toContain('thumb-cell--empty')
    expect(wrapper.find('.thumb-cell--fruit').classes()).toContain('thumb-cell--empty')
  })

  it('shows a "+N" overflow when a group has more than one food', () => {
    const wrapper = mount(SnackBentoThumbnail, {
      props: {
        items: [
          makeItem('FRUIT', 'Manzana'),
          makeItem('FRUIT', 'Pera'),
          makeItem('FRUIT', 'Plátano'),
        ],
      },
    })
    const fruit = wrapper.find('.thumb-cell--fruit')
    expect(fruit.text()).toContain('Manzana') // first shown
    expect(fruit.find('.thumb-more').text()).toBe('+2')
  })

  it('does not crash when an item lacks food (defensive fallback)', () => {
    const partial = {
      id: 'x',
      snackId: 's',
      foodId: 'f',
      groupAssignment: 'HEALTHY_FAT' as FoodGroup,
      servingAmount: null,
      createdAt: '',
      // food intentionally omitted
    } as unknown as SnackItemSummary
    const wrapper = mount(SnackBentoThumbnail, { props: { items: [partial] } })
    expect(wrapper.find('.thumb-cell--fat').text()).toContain('Alimento')
  })
})

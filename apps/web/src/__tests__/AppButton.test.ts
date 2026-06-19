import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '../shared/components/AppButton.vue'

describe('AppButton', () => {
  it('renders default slot as label', () => {
    const wrapper = mount(AppButton, {
      slots: { default: 'Click me' },
    })
    expect(wrapper.text()).toContain('Click me')
    expect(wrapper.classes()).toContain('app-btn--primary')
    expect(wrapper.classes()).toContain('app-btn--md')
  })

  it('applies variant and size classes', () => {
    const wrapper = mount(AppButton, {
      props: { variant: 'danger', size: 'lg' },
      slots: { default: 'Delete' },
    })
    expect(wrapper.classes()).toContain('app-btn--danger')
    expect(wrapper.classes()).toContain('app-btn--lg')
  })

  it('disables interaction when disabled', () => {
    const wrapper = mount(AppButton, {
      props: { disabled: true },
      slots: { default: 'No' },
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('shows spinner and disables when loading', () => {
    const wrapper = mount(AppButton, {
      props: { loading: true },
      slots: { default: 'Wait' },
    })
    expect(wrapper.find('.app-btn__spinner').exists()).toBe(true)
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })

  it('emits click when not disabled', async () => {
    const wrapper = mount(AppButton, {
      slots: { default: 'Go' },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(AppButton, {
      props: { disabled: true },
      slots: { default: 'Nope' },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})

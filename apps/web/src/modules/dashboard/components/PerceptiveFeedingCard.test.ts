/**
 * PerceptiveFeedingCard component tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PerceptiveFeedingCard from './PerceptiveFeedingCard.vue'

describe('PerceptiveFeedingCard', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>
  let sessionStorageMock: Storage

  beforeEach(() => {
    // Mock sessionStorage
    sessionStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }
    vi.stubGlobal('sessionStorage', sessionStorageMock)

    // Mock matchMedia with mobile default (matches: false)
    matchMediaMock = vi.fn().mockReturnValue({
      matches: false, // mobile (< 768px)
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      media: '(min-width: 768px)',
    })
    vi.stubGlobal('matchMedia', matchMediaMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders collapsed on mobile by default', async () => {
    // Arrange: Ensure matchMedia returns false (mobile) BEFORE mounting
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false, // mobile (< 768px)
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    // Act
    const wrapper = mount(PerceptiveFeedingCard)
    await wrapper.vm.$nextTick() // Wait for DOM updates

    // Assert: card header is present
    expect(wrapper.text()).toContain('Alimentación perceptiva')

    // Assert: aria-expanded should be false
    const toggleButton = wrapper.find('[aria-expanded]')
    expect(toggleButton.attributes('aria-expanded')).toBe('false')

    // Assert: content should NOT be visible (collapsed)
    const principlesContent = wrapper.find('#principles-content')
    // v-show sets display: none when false
    expect(principlesContent.element.style.display).toBe('none')
  })

  it('expands on click (toggle)', async () => {
    // Arrange
    const wrapper = mount(PerceptiveFeedingCard)
    await flushPromises() // Wait for onMounted to complete

    // Assert: initially collapsed (mobile default)
    const principlesContent = wrapper.find('#principles-content')
    expect(principlesContent.element.style.display).toBe('none')

    // Act: click the toggle button
    const toggleButton = wrapper.find('[aria-expanded]')
    expect(toggleButton.exists()).toBe(true)
    await toggleButton.trigger('click')

    // Assert: now expanded (display should NOT be 'none')
    expect(principlesContent.element.style.display).not.toBe('none')
    expect(wrapper.text()).toContain('Identifica las señales de hambre y saciedad de tu bebé')
  })

  it('persists expanded/collapsed state in sessionStorage', async () => {
    // Arrange
    const setItemSpy = vi.spyOn(sessionStorage, 'setItem')
    const wrapper = mount(PerceptiveFeedingCard)

    // Act: expand
    const toggleButton = wrapper.find('[aria-expanded]')
    await toggleButton.trigger('click')

    // Assert: sessionStorage.setItem was called
    expect(setItemSpy).toHaveBeenCalledWith(
      'perceptive-feeding-expanded',
      'true'
    )

    // Act: collapse again
    await toggleButton.trigger('click')

    // Assert: sessionStorage.setItem was called with false
    expect(setItemSpy).toHaveBeenCalledWith(
      'perceptive-feeding-expanded',
      'false'
    )
  })

  it('renders expanded on desktop by default', async () => {
    // Arrange: matchMedia returns true (desktop >= 768px)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: true, // desktop
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    // Act
    const wrapper = mount(PerceptiveFeedingCard)
    await wrapper.vm.$nextTick()

    // Assert: aria-expanded should be true
    const toggleButton = wrapper.find('[aria-expanded]')
    expect(toggleButton.attributes('aria-expanded')).toBe('true')

    // Assert: content should be visible (expanded)
    const principlesContent = wrapper.find('#principles-content')
    expect(principlesContent.element.style.display).not.toBe('none')
  })
})

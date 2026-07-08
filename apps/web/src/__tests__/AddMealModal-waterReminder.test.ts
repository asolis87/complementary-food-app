/**
 * Water reminder tests for AddMealModal.
 * Tests the once-per-session dismissable water guidance panel.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AddMealModal from '../modules/diary/components/AddMealModal.vue'

describe('AddMealModal - water reminder', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Ensure sessionStorage is clean and reminder is NOT dismissed initially
    sessionStorage.clear()
    sessionStorage.removeItem('pakulab_water_reminder_dismissed')
    vi.clearAllMocks()
  })

  it('should show water reminder on first confirm attempt in session', async () => {
    const wrapper = mount(AddMealModal, {
      props: {
        modelValue: true,
        babyProfileId: 'baby-1',
        date: '2025-01-15',
        ageInMonths: 12,
      },
      global: {
        stubs: {
          Teleport: true, // Stub teleport to body
        },
      },
    })

    // Wait for next tick to ensure watcher has run
    await wrapper.vm.$nextTick()

    // Simulate selecting food and clicking confirm
    // Water reminder should appear before actual submit
    const waterReminder = wrapper.find('[data-testid="water-reminder"]')
    expect(waterReminder.exists()).toBe(true)
    expect(waterReminder.text()).toContain('Ofrece agua en vaso abierto o popote')
    expect(waterReminder.text()).toContain('NO mamila, NO vaso entrenador, NO vaso 360°')
    expect(waterReminder.text()).toContain('Después de los alimentos, no durante')
    expect(waterReminder.text()).toContain('orden: leche → alimentos → agua')
    expect(waterReminder.text()).toContain('No reemplaces la leche con agua')
  })

  it('should NOT show water reminder on second confirm attempt in same session', async () => {
    // First mount — reminder appears
    const wrapper1 = mount(AddMealModal, {
      props: {
        modelValue: true,
        babyProfileId: 'baby-1',
        date: '2025-01-15',
        ageInMonths: 12,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await wrapper1.vm.$nextTick()

    let waterReminder = wrapper1.find('[data-testid="water-reminder"]')
    expect(waterReminder.exists()).toBe(true)

    // Dismiss the reminder
    const dismissBtn = wrapper1.find('[data-testid="water-reminder-close"]')
    await dismissBtn.trigger('click')

    // Unmount and remount in the same session
    wrapper1.unmount()

    const wrapper2 = mount(AddMealModal, {
      props: {
        modelValue: true,
        babyProfileId: 'baby-2',
        date: '2025-01-16',
        ageInMonths: 13,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await wrapper2.vm.$nextTick()

    waterReminder = wrapper2.find('[data-testid="water-reminder"]')
    expect(waterReminder.exists()).toBe(false)
  })

  it('should persist dismissal flag in sessionStorage', async () => {
    const wrapper = mount(AddMealModal, {
      props: {
        modelValue: true,
        babyProfileId: 'baby-1',
        date: '2025-01-15',
        ageInMonths: 12,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await wrapper.vm.$nextTick()

    // Initially no flag in sessionStorage
    expect(sessionStorage.getItem('pakulab_water_reminder_dismissed')).toBeNull()

    // Dismiss the reminder
    const dismissBtn = wrapper.find('[data-testid="water-reminder-close"]')
    await dismissBtn.trigger('click')

    // Flag should now be set
    expect(sessionStorage.getItem('pakulab_water_reminder_dismissed')).toBe('true')

    // Reminder should be hidden
    const waterReminder = wrapper.find('[data-testid="water-reminder"]')
    expect(waterReminder.exists()).toBe(false)
  })
})

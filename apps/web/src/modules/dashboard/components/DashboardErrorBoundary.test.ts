import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DashboardErrorBoundary from './DashboardErrorBoundary.vue'

// Minimal router mock
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('DashboardErrorBoundary', () => {
  // ── 401 Unauthorized ────────────────────────────────────────────────

  it('shows "Sesión expirada" for 401', () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        statusCode: 401,
      },
    })

    expect(wrapper.find('.error-title').text()).toBe('Sesión expirada')
  })

  it('shows lock icon for 401', () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        statusCode: 401,
      },
    })

    expect(wrapper.find('.error-icon').text()).toContain('lock')
  })

  it('shows "go home" button for 401', () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        statusCode: 401,
      },
    })

    expect(wrapper.find('.home-btn').exists()).toBe(true)
  })

  // ── 403 Forbidden ───────────────────────────────────────────────────

  it('shows "Acceso restringido" for 403', () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        statusCode: 403,
      },
    })

    expect(wrapper.find('.error-title').text()).toBe('Acceso restringido')
  })

  it('mentions tier/permission in 403 message', () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        statusCode: 403,
      },
    })

    const msg = wrapper.find('.error-message').text()
    expect(msg).toContain('permiso')
  })

  // ── 404 Not Found ───────────────────────────────────────────────────

  it('shows "Perfil no encontrado" for 404', () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        statusCode: 404,
      },
    })

    expect(wrapper.find('.error-title').text()).toBe('Perfil no encontrado')
  })

  it('mentions deleted/moved profile in 404 message', () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        statusCode: 404,
        message: 'El perfil del bebé no fue encontrado.',
      },
    })

    const msg = wrapper.find('.error-message').text()
    expect(msg).toContain('encontrado')
  })

  // ── 500 Server Error ────────────────────────────────────────────────

  it('shows "Error del servidor" for 500', () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        statusCode: 500,
      },
    })

    expect(wrapper.find('.error-title').text()).toBe('Error del servidor')
  })

  // ── No status code (default) ────────────────────────────────────────

  it('shows default title when no status code provided', () => {
    const wrapper = mount(DashboardErrorBoundary)

    expect(wrapper.find('.error-title').text()).toBe('No se pudo cargar el dashboard')
  })

  it('uses provided custom message', () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        message: 'Error de conexión',
      },
    })

    expect(wrapper.find('.error-message').text()).toBe('Error de conexión')
  })

  // ── Retry button ────────────────────────────────────────────────────

  it('emits "retry" when retry button is clicked', async () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        statusCode: 500,
      },
    })

    const retryBtn = wrapper.find('.retry-btn')
    await retryBtn.trigger('click')

    expect(wrapper.emitted('retry')).toBeTruthy()
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  // ── Go home button ──────────────────────────────────────────────────

  it('navigates to home when "Volver al inicio" is clicked', async () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        statusCode: 401,
      },
    })

    const homeBtn = wrapper.find('.home-btn')
    await homeBtn.trigger('click')
    await nextTick()

    expect(mockPush).toHaveBeenCalledWith({ name: 'home' })
  })

  it('shows "go home" button when showGoHome prop is true', () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        showGoHome: true,
      },
    })

    expect(wrapper.find('.home-btn').exists()).toBe(true)
  })

  // ── Accessibility ───────────────────────────────────────────────────

  it('has role="alert" for screen reader announcement', () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        statusCode: 404,
      },
    })

    const root = wrapper.find('.dashboard-error')
    expect(root.attributes('role')).toBe('alert')
  })

  it('uses aria-live="assertive" for immediate announcement', () => {
    const wrapper = mount(DashboardErrorBoundary, {
      props: {
        statusCode: 500,
      },
    })

    const root = wrapper.find('.dashboard-error')
    expect(root.attributes('aria-live')).toBe('assertive')
  })
})

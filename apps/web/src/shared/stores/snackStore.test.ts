/**
 * Snack Store tests — fetch envelope handling.
 *
 * Mirrors plateStore's GET envelope contract: GET /snacks returns
 * { data, total, page, limit } and the store exposes result.data as savedSnacks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Snack } from '@pakulab/shared'

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }))
vi.mock('@/shared/api/client.js', () => ({
  apiClient: {
    get: mockGet,
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

// Must import after mocks
import { useSnackStore } from './snackStore.js'

const apiSnack: Snack = {
  id: 'cksnackid0000000000000001',
  userId: 'u1',
  babyProfileId: null,
  name: 'Fruta picada',
  stageFor: 'TEN_TO_TWELVE_MONTHS',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
  items: [],
}

describe('snackStore — fetch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchSavedSnacks stores result.data from the paginated envelope', async () => {
    mockGet.mockResolvedValueOnce({ data: [apiSnack], total: 1, page: 1, limit: 20 })
    const store = useSnackStore()

    await store.fetchSavedSnacks()

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet.mock.calls[0][0]).toContain('/snacks?')
    expect(store.savedSnacks).toEqual([apiSnack])
  })

  it('forwards stageFor as a query param when provided', async () => {
    mockGet.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 20 })
    const store = useSnackStore()

    await store.fetchSavedSnacks('TEN_TO_TWELVE_MONTHS')

    expect(mockGet.mock.calls[0][0]).toContain('stageFor=TEN_TO_TWELVE_MONTHS')
  })

  it('sets an error message and leaves savedSnacks empty on API failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('boom'))
    const store = useSnackStore()

    await store.fetchSavedSnacks()

    expect(store.savedSnacks).toEqual([])
    expect(store.error).toBe('boom')
  })
})

/**
 * Snack Store tests — fetch envelope handling.
 *
 * Mirrors plateStore's GET envelope contract: GET /snacks returns
 * { data, total, page, limit } and the store exposes result.data as savedSnacks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Snack, CreateSnackInput } from '@pakulab/shared'

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}))
vi.mock('@/shared/api/client.js', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: vi.fn(),
    patch: vi.fn(),
    delete: mockDelete,
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

describe('snackStore — createSnack', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('POSTs to /snacks and returns { snack, warnings }', async () => {
    const newSnack: Snack = { ...apiSnack, id: 'new-snack', name: 'Manzana picada' }
    const warnings = ['Missing FRUIT group for age 15m']
    mockPost.mockResolvedValueOnce({ data: newSnack, warnings })
    const store = useSnackStore()

    const payload: CreateSnackInput = {
      name: 'Manzana picada',
      stageFor: 'TEN_TO_TWELVE_MONTHS',
      items: [{ foodId: 'food1', groupAssignment: 'HEALTHY_FAT' }],
    }
    const result = await store.createSnack(payload)

    expect(mockPost).toHaveBeenCalledWith('/snacks', payload)
    expect(result.snack).toEqual(newSnack)
    expect(result.warnings).toEqual(warnings)
  })

  it('unshifts the new snack to savedSnacks (optimistic top-of-list)', async () => {
    const existingSnack: Snack = { ...apiSnack, id: 'existing' }
    const newSnack: Snack = { ...apiSnack, id: 'new-snack', name: 'Nueva colación' }
    mockPost.mockResolvedValueOnce({ data: newSnack, warnings: [] })
    const store = useSnackStore()
    store.savedSnacks = [existingSnack]

    const payload: CreateSnackInput = { name: 'Nueva colación', items: [] }
    await store.createSnack(payload)

    expect(store.savedSnacks).toEqual([newSnack, existingSnack])
  })

  it('increments totalSnacks so pagination stays consistent after create', async () => {
    const newSnack: Snack = { ...apiSnack, id: 'new-snack' }
    mockPost.mockResolvedValueOnce({ data: newSnack, warnings: [] })
    const store = useSnackStore()
    store.totalSnacks = 5

    await store.createSnack({ name: 'Test', items: [] })

    expect(store.totalSnacks).toBe(6)
  })

  it('returns empty warnings array when response has no warnings', async () => {
    const newSnack: Snack = { ...apiSnack, id: 'new-snack' }
    mockPost.mockResolvedValueOnce({ data: newSnack })
    const store = useSnackStore()

    const payload: CreateSnackInput = { name: 'Test', items: [] }
    const result = await store.createSnack(payload)

    expect(result.warnings).toEqual([])
  })
})

describe('snackStore — deleteSnack', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('DELETEs /snacks/:id and removes snack from savedSnacks', async () => {
    mockDelete.mockResolvedValueOnce({})
    const snack1: Snack = { ...apiSnack, id: 'snack1', name: 'Snack 1' }
    const snack2: Snack = { ...apiSnack, id: 'snack2', name: 'Snack 2' }
    const store = useSnackStore()
    store.savedSnacks = [snack1, snack2]

    await store.deleteSnack('snack1')

    expect(mockDelete).toHaveBeenCalledWith('/snacks/snack1')
    expect(store.savedSnacks).toEqual([snack2])
  })

  it('re-throws on DELETE failure, leaves savedSnacks unchanged, and sets error', async () => {
    mockDelete.mockRejectedValueOnce(new Error('403 Forbidden'))
    const snack1: Snack = { ...apiSnack, id: 'snack1', name: 'Snack 1' }
    const store = useSnackStore()
    store.savedSnacks = [snack1]

    await expect(store.deleteSnack('snack1')).rejects.toThrow('403 Forbidden')
    expect(store.savedSnacks).toEqual([snack1]) // unchanged on failure
    expect(store.error).toBe('403 Forbidden') // observable error contract
  })
})

describe('snackStore — fetchMoreSnacks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches page 2 and appends results to savedSnacks', async () => {
    const snack1: Snack = { ...apiSnack, id: 'snack1' }
    const snack2: Snack = { ...apiSnack, id: 'snack2' }
    const snack3: Snack = { ...apiSnack, id: 'snack3' }
    mockGet.mockResolvedValueOnce({ data: [snack3], total: 3, page: 2, limit: 20 })
    const store = useSnackStore()
    store.savedSnacks = [snack1, snack2]
    store.currentPage = 1
    store.totalSnacks = 3

    await store.fetchMoreSnacks()

    expect(mockGet.mock.calls[0][0]).toContain('/snacks?')
    expect(mockGet.mock.calls[0][0]).toContain('page=2')
    expect(store.savedSnacks).toEqual([snack1, snack2, snack3])
    expect(store.currentPage).toBe(2)
  })

  it('does not fetch if hasMore is false', async () => {
    const store = useSnackStore()
    store.savedSnacks = [apiSnack]
    store.totalSnacks = 1

    await store.fetchMoreSnacks()

    expect(mockGet).not.toHaveBeenCalled()
  })

  it('does not fetch if already fetchMoreLoading', async () => {
    const store = useSnackStore()
    store.savedSnacks = []
    store.totalSnacks = 10
    store.fetchMoreLoading = true

    await store.fetchMoreSnacks()

    expect(mockGet).not.toHaveBeenCalled()
  })
})

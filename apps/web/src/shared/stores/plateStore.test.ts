/**
 * Plate Store tests — payload integrity for save/update.
 *
 * Regression guard: saveDraftAsPlate / updatePlate must forward stageFor
 * (and babyProfileId) to the API. A previous bug rebuilt the request body
 * by cherry-picking only name/groupCount/items, silently dropping stageFor —
 * so saved plates always had stageFor=null and never matched the stage filter
 * in "Mis Platos" (only appeared under "Todas las etapas").
 *
 * Offline path regression guard: when the API call fails because the device
 * is offline, the plate MUST be enqueued with its stageFor (and servingAmount)
 * preserved so the AppLayout flush posts the full payload on reconnect.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { CreatePlateInput } from '@pakulab/shared'

// Mock the api client
const { mockPost, mockPut } = vi.hoisted(() => ({ mockPost: vi.fn(), mockPut: vi.fn() }))
vi.mock('@/shared/api/client.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: mockPost,
    put: mockPut,
    patch: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, public status: number, public data: unknown) {
      super(message)
      this.name = 'ApiError'
    }
  },
  OfflineError: class OfflineError extends Error {
    constructor() {
      super('Sin conexión')
      this.name = 'OfflineError'
    }
  },
}))

// Mock the IndexedDB-backed sync queue so we can assert the enqueue payload
// without needing fake-indexeddb in the test harness.
const { mockEnqueue, mockGetPending } = vi.hoisted(() => ({
  mockEnqueue: vi.fn(),
  mockGetPending: vi.fn(),
}))
vi.mock('@/shared/services/syncQueue.js', () => ({
  enqueuePlate: mockEnqueue,
  getPendingPlates: mockGetPending,
  getPendingCount: vi.fn().mockResolvedValue(0),
  removeFromQueue: vi.fn().mockResolvedValue(undefined),
  clearQueue: vi.fn().mockResolvedValue(undefined),
}))

// Must import after mocks
import { usePlateStore } from './plateStore.js'
import { OfflineError } from '@/shared/api/client.js'

const draftPayload: CreatePlateInput = {
  name: 'Plato 10-12m',
  groupCount: 4,
  stageFor: 'TEN_TO_TWELVE_MONTHS',
  items: [{ foodId: 'ckfoodid00000000000000001', groupAssignment: 'FRUIT', servingAmount: '2' }],
}

const apiPlate = {
  id: 'ckplateid0000000000000001',
  userId: 'u1',
  name: 'Plato 10-12m',
  groupCount: 4,
  balanceScore: 0,
  astringentCount: 0,
  laxativeCount: 0,
  neutralCount: 0,
  babyProfileId: null,
  stageFor: 'TEN_TO_TWELVE_MONTHS',
  deletedAt: null,
  items: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('plateStore — payload integrity (stageFor regression)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('saveDraftAsPlate forwards stageFor to POST /plates', async () => {
    mockPost.mockResolvedValueOnce({ data: apiPlate })
    const store = usePlateStore()

    await store.saveDraftAsPlate(draftPayload)

    expect(mockPost).toHaveBeenCalledTimes(1)
    const [, body] = mockPost.mock.calls[0]
    expect(body.stageFor).toBe('TEN_TO_TWELVE_MONTHS')
  })

  it('saveDraftAsPlate forwards servingAmount on items to POST /plates', async () => {
    mockPost.mockResolvedValueOnce({ data: apiPlate })
    const store = usePlateStore()

    await store.saveDraftAsPlate(draftPayload)

    const [, body] = mockPost.mock.calls[0]
    expect(body.items[0].servingAmount).toBe('2')
  })

  it('updatePlate forwards stageFor to PUT /plates/:id', async () => {
    mockPut.mockResolvedValueOnce({ data: apiPlate })
    const store = usePlateStore()

    await store.updatePlate('ckplateid0000000000000001', draftPayload)

    expect(mockPut).toHaveBeenCalledTimes(1)
    const [, body] = mockPut.mock.calls[0]
    expect(body.stageFor).toBe('TEN_TO_TWELVE_MONTHS')
  })

  it('updatePlate forwards servingAmount on items to PUT /plates/:id', async () => {
    mockPut.mockResolvedValueOnce({ data: apiPlate })
    const store = usePlateStore()

    await store.updatePlate('ckplateid0000000000000001', draftPayload)

    const [, body] = mockPut.mock.calls[0]
    expect(body.items[0].servingAmount).toBe('2')
  })
})

describe('plateStore — offline enqueue preserves stageFor (regression: T-05-06 follow-up)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('enqueues with stageFor from the draft payload when POST /plates fails with OfflineError', async () => {
    mockPost.mockRejectedValueOnce(new OfflineError())
    mockEnqueue.mockResolvedValueOnce(undefined)
    const store = usePlateStore()

    await store.saveDraftAsPlate(draftPayload)

    expect(mockEnqueue).toHaveBeenCalledTimes(1)
    const queued = mockEnqueue.mock.calls[0]![0]
    expect(queued.stageFor).toBe('TEN_TO_TWELVE_MONTHS')
    expect(queued.name).toBe('Plato 10-12m')
    expect(queued.groupCount).toBe(4)
    expect(queued.items[0].servingAmount).toBe('2')
    expect(queued.items[0].foodId).toBe('ckfoodid00000000000000001')
  })

  it('enqueues with stageFor=null when the draft has no stage set', async () => {
    mockPost.mockRejectedValueOnce(new OfflineError())
    mockEnqueue.mockResolvedValueOnce(undefined)
    const store = usePlateStore()

    const payloadWithoutStage: CreatePlateInput = {
      ...draftPayload,
      stageFor: undefined,
    }
    await store.saveDraftAsPlate(payloadWithoutStage)

    const queued = mockEnqueue.mock.calls[0]![0]
    expect(queued.stageFor).toBeNull()
  })
})

/**
 * Behavior-sensitive regression tests for PlateBuilderDrawer.vue —
 * automatic stage inference from active baby age (REQ-C2, REQ-C4 lifecycle).
 *
 * These tests mount the REAL PlateBuilderDrawer with the REAL usePlateBuilder
 * composable. The only mock boundary is the persistence/API layer
 * (`apiClient.post`), so the assertions observe what would actually hit the
 * backend over the wire.
 *
 * Bugs covered:
 *   1. Original regression: drawer does not apply age-derived stage hint,
 *      so save payload omits stageFor → DB stores NULL.
 *   2. Stale-stage across drafts: `initDraft()` / `resetDraft()` retain
 *      `draftStageFor`, so after a save + profile switch the next save
 *      leaks the previous inferred stage instead of the new baby's stage.
 *      The composable's `applyStageHintIfUnset` is sticky-once-set, so
 *      without clearing `draftStageFor` on a new draft the hint is a no-op.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import type { Plate, BabyProfile } from '@pakulab/shared'
import PlateBuilderDrawer from '../PlateBuilderDrawer.vue'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'

// ─── API boundary mock ───────────────────────────────────────────────────────
// Only the apiClient is mocked — the composable, store, and component run real.
// `mockPost` captures the exact JSON body sent to POST /plates, which is the
// observable that proves "the inferred stageFor reaches the outbound request".
const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }))

vi.mock('@/shared/api/client.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: mockPost,
    put: vi.fn(),
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

vi.mock('@/shared/services/syncQueue.js', () => ({
  enqueuePlate: vi.fn().mockResolvedValue(undefined),
  getPendingPlates: vi.fn().mockResolvedValue([]),
  getPendingCount: vi.fn().mockResolvedValue(0),
  removeFromQueue: vi.fn().mockResolvedValue(undefined),
  clearQueue: vi.fn().mockResolvedValue(undefined),
}))

// Stub child components — they are not under test here.
vi.mock('@/modules/plates/components/PlateVisualization.vue', () => ({
  default: {
    name: 'PlateVisualization',
    template: '<div class="mock-plate-visualization"></div>',
    props: ['items', 'groupCount', 'timesOfferedByFoodId'],
    emits: ['remove-item', 'select-group'],
  },
}))

vi.mock('@/modules/plates/components/FoodSearchModal.vue', () => ({
  default: {
    name: 'FoodSearchModal',
    template: '<div class="mock-food-search-modal"></div>',
    emits: ['close', 'add-food', 'remove-food', 'search'],
  },
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

const apiPlate: Plate = {
  id: 'plate-1',
  userId: 'user-1',
  babyProfileId: null,
  name: 'Mi plato',
  groupCount: 4,
  balanceScore: 0,
  astringentCount: 0,
  laxativeCount: 0,
  neutralCount: 0,
  stageFor: 'TEN_TO_TWELVE_MONTHS',
  deletedAt: null,
  items: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const testFood = {
  id: 'food-1',
  name: 'Manzana',
  group: 'FRUIT',
  alClassification: 'NEUTRAL',
  alScore: 0,
  ageMonths: 6,
  isAllergen: false,
  allergenType: null,
  isIronRich: false,
  description: null,
  needsValidation: false,
  warningTags: [],
  createdAt: '',
  updatedAt: '',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let testPinia: Pinia

function mountDrawer() {
  return mount(PlateBuilderDrawer, {
    props: { visible: true },
    global: {
      plugins: [testPinia],
      stubs: {
        teleport: true,
        transition: false,
      },
    },
  })
}

function setupBaby(ageMonths: number) {
  const birthDate = new Date()
  birthDate.setMonth(birthDate.getMonth() - ageMonths)

  const profileStore = useProfileStore()
  profileStore.profiles = [
    {
      id: 'baby-1',
      userId: 'user-1',
      name: 'Mateo',
      birthDate: birthDate.toISOString(),
    } as BabyProfile,
  ]
}

async function addFoodAndSave(wrapper: ReturnType<typeof mountDrawer>) {
  // Drive the real composable through the drawer's @add-food event handler.
  // The FoodSearchModal stub is always rendered inside the Teleport; emitting
  // 'add-food' on it fires the drawer's `onModalAddFood`, which calls the real
  // builder.addFood.
  const modal = wrapper.findComponent({ name: 'FoodSearchModal' })
  modal.vm.$emit('add-food', testFood, 'FRUIT')
  await flushPromises()

  const saveBtn = wrapper.find('.drawer-btn--primary')
  await saveBtn.trigger('click')
  await flushPromises()
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('PlateBuilderDrawer — automatic stage inference (REQ-C2, REQ-C4 lifecycle)', () => {
  beforeEach(() => {
    testPinia = createPinia()
    setActivePinia(testPinia)

    // Authenticated PRO user — required so canSave (tier-limit check) is true.
    const authStore = useAuthStore()
    authStore.user = {
      id: 'user-1',
      email: 'ana@test.com',
      name: 'Ana',
      tier: 'PRO',
      emailVerified: true,
      subscriptionStatus: 'ACTIVE',
      trialEnd: null,
      createdAt: new Date().toISOString(),
      lastAcceptedDisclaimerVersion: null,
    }

    mockPost.mockReset()
    mockPost.mockResolvedValue({ data: apiPlate })
  })

  it('sends inferred stageFor=TEN_TO_TWELVE_MONTHS in POST /plates when active baby is 10 months', async () => {
    const wrapper = mountDrawer()
    await flushPromises()

    setupBaby(10)
    await flushPromises()

    await addFoodAndSave(wrapper)

    expect(mockPost).toHaveBeenCalledTimes(1)
    const [, body] = mockPost.mock.calls[0]
    expect(body.stageFor).toBe('TEN_TO_TWELVE_MONTHS')
  })

  it('sends inferred stageFor on initial mount when the active profile is already loaded (no watcher fires without immediate)', async () => {
    // REGRESSION: neither `watch(babyAgeMonths, ...)` nor
    // `watch(() => props.visible, ...)` has `immediate: true`, so when the
    // drawer mounts with `visible: true` AND the active profile is already
    // loaded, no watcher fires on mount. The first save would omit stageFor.
    //
    // The fix must ensure a stage hint is applied during initial mount
    // without re-introducing the prior sync/async fire-order race.

    // Pre-populate the active profile BEFORE mount.
    setupBaby(10)
    await flushPromises()

    const wrapper = mountDrawer()
    await flushPromises()

    await addFoodAndSave(wrapper)

    expect(mockPost).toHaveBeenCalledTimes(1)
    const [, body] = mockPost.mock.calls[0]
    expect(body.stageFor).toBe('TEN_TO_TWELVE_MONTHS')
  })

  it('re-derives fresh stageFor when the active baby changes between saves (no stale across drafts)', async () => {
    // REGRESSION: initDraft/resetDraft must clear draftStageFor so that the
    // sticky-once-set hint can re-apply for the new profile. Without the fix,
    // the second save leaks TEN_TO_TWELVE_MONTHS instead of FAMILY_TABLE.

    const wrapper = mountDrawer()
    await flushPromises()

    // ── First draft: 10m baby ──────────────────────────────────────────────
    setupBaby(10) // TEN_TO_TWELVE_MONTHS
    await flushPromises()

    await addFoodAndSave(wrapper)
    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(mockPost.mock.calls[0]![1].stageFor).toBe('TEN_TO_TWELVE_MONTHS')

    // The composable's onSaved fires `resetDraft` after a successful save.
    // With the lifecycle fix in place, draftStageFor is reset to null so the
    // next age hint can be applied cleanly.
    //
    // ── Second draft: switch to a 24m baby ─────────────────────────────────
    setupBaby(24) // FAMILY_TABLE
    await flushPromises()

    await addFoodAndSave(wrapper)

    expect(mockPost).toHaveBeenCalledTimes(2)
    const [, secondBody] = mockPost.mock.calls[1]!
    expect(secondBody.stageFor).toBe('FAMILY_TABLE')
    // Negative guard — the previous inferred stage must not leak.
    expect(secondBody.stageFor).not.toBe('TEN_TO_TWELVE_MONTHS')
  })

  it('re-derives fresh stageFor on a close + reopen cycle (no stale across drawer sessions)', async () => {
    // REGRESSION: the drawer's [visible, babyAgeMonths] watcher must re-apply
    // the hint on every open because the open handler calls `initDraft` which
    // resets draftStageFor. Without the open-reapply, reopening the drawer
    // without a save in between would persist stageFor=null even though the
    // active profile still has a known age.

    const wrapper = mountDrawer()
    await flushPromises()

    setupBaby(10) // TEN_TO_TWELVE_MONTHS
    await flushPromises()

    // First save establishes the inferred stage.
    await addFoodAndSave(wrapper)
    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(mockPost.mock.calls[0]![1].stageFor).toBe('TEN_TO_TWELVE_MONTHS')

    // Close → resetDraft clears draftStageFor.
    await wrapper.setProps({ visible: false })
    await flushPromises()

    // Reopen → initDraft resets + [visible, age] watcher reapplies the hint.
    await wrapper.setProps({ visible: true })
    await flushPromises()

    // After reopen, draftStageFor must be the fresh inferred value (not null,
    // not a stale previous value). Add an item and save to assert the outbound
    // payload.
    await addFoodAndSave(wrapper)

    expect(mockPost).toHaveBeenCalledTimes(2)
    const [, secondBody] = mockPost.mock.calls[1]!
    expect(secondBody.stageFor).toBe('TEN_TO_TWELVE_MONTHS')
    expect(secondBody.stageFor).not.toBeNull()
  })
})

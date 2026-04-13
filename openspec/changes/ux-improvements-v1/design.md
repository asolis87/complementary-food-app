# Design: UX Improvements v1

## Technical Approach

Six independent UX improvements targeting the Pakulab PWA's plate builder, menu week, and plate list modules. Each improvement is a surgical, isolated change — no shared dependencies between them — allowing parallel implementation and independent testing. All changes follow existing patterns in the codebase: Vue 3.5 Composition API with `<script setup>`, Pinia stores with `storeToRefs()`, scoped CSS with mobile-first `safe-area-inset-bottom`, and the established dialog/modal pattern in `MenuWeekPage.vue`.

## Architecture Decisions

### Decision: Reset draft unconditionally on mount (Improvement 1)

**Choice**: Call `plateStore.resetDraft()` as the very first line inside `onMounted`, before edit-mode checks.
**Alternatives considered**: (a) Add a route-level `beforeRouteEnter` guard; (b) Reset only when `!route.params.id`.
**Rationale**: The existing edit-mode branch (line 316-348) already calls `resetDraft()` inside the `if (plate.items?.length)` block before repopulating. Calling `resetDraft()` first makes the flow: always start clean → then conditionally load edit data. This is simpler, safer, and follows the existing code's own pattern. Route guards add complexity for no benefit since the reset is cheap and idempotent.

### Decision: No code change for sort order (Improvement 2)

**Choice**: Document and verify — no code change required.
**Alternatives considered**: Adding an explicit frontend sort.
**Rationale**: `plates.service.ts` line 56 already has `orderBy: { createdAt: 'desc' }`. The store's `savedPlates.unshift()` on new plate creation preserves front-of-list ordering client-side. The behavior is correct. Adding redundant frontend sorting would be wasteful and hide the source of truth.

### Decision: Move Camote in seed array (Improvement 3)

**Choice**: Move the Camote object from the `vegetables` array to the `cerealsTubers` array in `seed.ts`, changing `group: 'VEGETABLE'` to `group: 'CEREAL_TUBER'`.
**Alternatives considered**: (a) Database migration to update existing rows; (b) A separate fixup script.
**Rationale**: The seed uses `upsert` with `group` in the update payload (line ~1849), so re-running `pnpm prisma db seed` will update existing records. No migration needed. This is the simplest and most maintainable approach — the seed file IS the source of truth for food data.

### Decision: Clone reServeDialog pattern for first-serve confirmation (Improvement 4)

**Choice**: Create a `firstServeDialog` reactive ref mirroring the existing `reServeDialog` pattern, with its own open/close/confirm functions and Teleported dialog template.
**Alternatives considered**: (a) Extracting a generic ConfirmDialog component; (b) Using a shared composable.
**Rationale**: The existing `reServeDialog` is self-contained within `MenuWeekPage.vue` (~20 lines of state + ~40 lines of template). Cloning this pattern keeps the change minimal and consistent with what's already there. Extracting a generic component is a good future refactor but out of scope for this change — it would touch unrelated code paths.

### Decision: Sequential assignPlate loop for apply-all (Improvement 5)

**Choice**: After plate selection, show a dialog asking "this slot or all day?". On "all day", loop through `MEALS` array and call `menuStore.assignPlate()` sequentially with `await`.
**Alternatives considered**: (a) `Promise.all()` for parallel calls; (b) A dedicated backend endpoint for bulk assignment.
**Rationale**: Sequential `await` ensures consistent state updates in the Pinia store (each `assignPlate` triggers optimistic UI update). `Promise.all` could cause race conditions in the store's reactive state. A backend endpoint would be more efficient but is out of scope — this is a frontend-only improvement. Three sequential HTTP calls is acceptable for 3 meals.

### Decision: CSS-only fix for FAB overlap (Improvement 6)

**Choice**: Increase the FAB's `bottom` offset and add `padding-bottom` to the `.plate-grid` container.
**Alternatives considered**: (a) Absolute positioning inside the scroll container; (b) A scroll-aware show/hide FAB.
**Rationale**: The simplest fix that addresses the problem directly. The current FAB at `bottom: calc(4.5rem + env(safe-area-inset-bottom))` sits too close to the bottom nav bar, overlapping the last card. Increasing the offset and adding padding to the grid ensures the last card scrolls above the FAB. No JS required.

## Data Flow

### Improvement 1: New plate starts empty

```
User navigates to /plates/new
    │
    ▼
PlateBuilderPage.vue onMounted()
    │
    ├── plateStore.resetDraft()          ← NEW: always reset first
    │     draftItems = []
    │     draftName = 'Mi plato'
    │     draftGroupCount = 4
    │
    ├── foodStore.fetchFoods()           (if not cached)
    │
    └── if (route.params.id)            edit mode?
          ├── plateStore.loadPlate(id)
          ├── plateStore.resetDraft()    (existing code, now redundant but harmless)
          └── repopulate from plate.items
```

### Improvement 4: First-serve confirmation

```
User clicks "Se lo di" button
    │
    ▼
handleServeClick(dayKey, mealKey)
    │
    ├── servedAt exists?
    │     ├── YES → reServeDialog.open = true    (existing flow, unchanged)
    │     └── NO  → firstServeDialog.open = true  ← NEW
    │
    ▼
User confirms in firstServeDialog
    │
    ▼
confirmFirstServe()
    ├── serveMeal(dayKey, mealKey)
    └── closeFirstServeDialog()
```

### Improvement 5: Apply plate to all meals

```
User opens plate picker for a meal slot
    │
    ▼
User selects a plate
    │
    ▼
assignPlate(plate)  ← MODIFIED
    │
    ├── Save dayKey, mealKey, plate from picker
    ├── closePicker()
    ├── Open applyAllDialog: { plate, dayKey }
    │
    ▼
User chooses in dialog
    │
    ├── "Solo esta" → assignPlateToSlot(plate, dayKey, mealKey)    single assignment
    │
    └── "Todas"     → for (meal of MEALS)                          loop all meals
                        await assignPlateToSlot(plate, dayKey, meal.key)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/modules/plates/PlateBuilderPage.vue` | Modify | Add `plateStore.resetDraft()` as first line in `onMounted` (Improvement 1) |
| `prisma/seed.ts` | Modify | Move Camote from `vegetables` to `cerealsTubers` array, change `group` to `'CEREAL_TUBER'` (Improvement 3) |
| `apps/web/src/modules/menus/MenuWeekPage.vue` | Modify | Add `firstServeDialog` state + template + handlers (Improvement 4); Add `applyAllDialog` state + template + handlers, refactor `assignPlate` (Improvement 5) |
| `apps/web/src/modules/plates/PlateListPage.vue` | Modify | Adjust FAB `bottom` offset and `.plate-grid` bottom padding (Improvement 6) |

## Interfaces / Contracts

### New reactive state in MenuWeekPage.vue

```typescript
// Improvement 4: First-serve confirmation dialog
interface FirstServeDialogState {
  open: boolean
  dayKey: DayKey | null
  mealKey: MealKey | null
}

const firstServeDialog = ref<FirstServeDialogState>({
  open: false,
  dayKey: null,
  mealKey: null,
})
```

```typescript
// Improvement 5: Apply plate to all meals dialog
interface ApplyAllDialogState {
  open: boolean
  plate: Plate | null
  dayKey: DayKey | null
  mealKey: MealKey | null  // the originally selected slot
}

const applyAllDialog = ref<ApplyAllDialogState>({
  open: false,
  plate: null,
  dayKey: null,
  mealKey: null,
})
```

### Modified functions in MenuWeekPage.vue

```typescript
// Improvement 4: handleServeClick MODIFIED
function handleServeClick(dayKey: DayKey, mealKey: MealKey): void {
  const servedAt = menuStore.getServedAt(dayKey, mealKey)
  if (servedAt) {
    // Already served → re-serve flow (unchanged)
    reServeDialog.value = { open: true, dayKey, mealKey }
  } else {
    // Not served → NEW: show first-serve confirmation
    firstServeDialog.value = { open: true, dayKey, mealKey }
  }
}

// Improvement 4: NEW functions
function closeFirstServeDialog(): void {
  firstServeDialog.value = { open: false, dayKey: null, mealKey: null }
}

function confirmFirstServe(): void {
  if (firstServeDialog.value.dayKey && firstServeDialog.value.mealKey) {
    serveMeal(firstServeDialog.value.dayKey, firstServeDialog.value.mealKey)
  }
  closeFirstServeDialog()
}
```

```typescript
// Improvement 5: assignPlate MODIFIED
async function assignPlate(plate: Plate): Promise<void> {
  if (!picker.value.dayKey || !picker.value.mealKey) return
  const profileId = profileStore.activeProfile?.id
  if (!profileId) return

  const dayKey = picker.value.dayKey
  const mealKey = picker.value.mealKey
  closePicker()

  // Show apply-all dialog instead of assigning immediately
  applyAllDialog.value = { open: true, plate, dayKey, mealKey }
}

// Improvement 5: NEW functions
function closeApplyAllDialog(): void {
  applyAllDialog.value = { open: false, plate: null, dayKey: null, mealKey: null }
}

async function confirmApplySingle(): Promise<void> {
  const { plate, dayKey, mealKey } = applyAllDialog.value
  if (!plate || !dayKey || !mealKey) return
  closeApplyAllDialog()
  await assignPlateToSlot(plate, dayKey, mealKey)
}

async function confirmApplyAll(): Promise<void> {
  const { plate, dayKey } = applyAllDialog.value
  if (!plate || !dayKey) return
  closeApplyAllDialog()
  for (const meal of MEALS) {
    await assignPlateToSlot(plate, dayKey, meal.key)
  }
}

async function assignPlateToSlot(plate: Plate, dayKey: DayKey, mealKey: MealKey): Promise<void> {
  const profileId = profileStore.activeProfile?.id
  if (!profileId) return
  try {
    await menuStore.assignPlate(profileId, weekStartISO.value, dayKey, mealKey, plate)
  } catch (err) {
    console.error('Failed to assign plate:', err)
  }
}
```

### Seed data change (Improvement 3)

```typescript
// REMOVE from vegetables array (line ~454):
// {
//   name: 'Camote cocido',
//   group: 'VEGETABLE',
//   ...
// }

// ADD to cerealsTubers array (after line ~1201):
{
  name: 'Camote cocido',
  group: 'CEREAL_TUBER',
  alClassification: 'ASTRINGENT',
  alScore: -0.3,
  isAllergen: false,
  ageMonths: 6,
  description:
    'Dra. Trueba clasifica camote como astringente. Rico en betacaroteno, vitamina A y fibra. Textura suave y sabor dulce que los bebés aceptan bien. Cocer hasta muy blando. Sin cáscara.',
  needsValidation: false,
}
```

### CSS changes (Improvement 6)

```css
/* PlateListPage.vue — .plate-grid: add bottom padding */
.plate-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  padding-bottom: calc(6rem + env(safe-area-inset-bottom, 0px)); /* NEW */
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

/* PlateListPage.vue — .plate-list-fab: increase bottom offset */
.plate-list-fab {
  position: fixed;
  bottom: calc(6rem + env(safe-area-inset-bottom, 0px)); /* WAS 4.5rem */
  /* ... rest unchanged */
}
```

### Dialog templates (Improvements 4 & 5)

Both dialogs follow the existing `reServeDialog` pattern: `<Teleport to="body">` → `<Transition name="dialog-fade">` → `div.dialog-backdrop` → `div.dialog.dialog--confirm`. No new CSS classes needed — reuse existing `.dialog`, `.dialog__header`, `.dialog__body`, `.dialog__actions`, `.dialog__btn` classes.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `plateStore.resetDraft()` is called on mount | Mount `PlateBuilderPage` with no route params, assert `draftItems` is empty and `draftName` is `'Mi plato'` |
| Unit | `handleServeClick` shows firstServeDialog for unserved meals | Call `handleServeClick` with a dayKey/mealKey where `getServedAt` returns null, assert `firstServeDialog.value.open === true` |
| Unit | `confirmApplyAll` calls `assignPlate` for all 3 meals | Mock `menuStore.assignPlate`, call `confirmApplyAll`, assert 3 calls with correct dayKey and each mealKey |
| Seed | Camote has correct group after seed | Run `pnpm prisma db seed`, query for 'Camote cocido', assert `group === 'CEREAL_TUBER'` |
| Visual | FAB does not overlap last plate card | Manual check on mobile viewport (375×812); last card fully visible when scrolled to bottom |

## Migration / Rollout

**Camote reclassification**: Re-run `pnpm prisma db seed` after deployment. The seed uses `upsert` with `group` in the update payload, so existing `Camote cocido` records will be updated to `CEREAL_TUBER` automatically. No Prisma migration needed.

**All other changes**: Pure frontend — no data migration, no feature flags, no phased rollout. Deploy as a single release.

## Open Questions

- None. All 6 improvements have clear, bounded implementations with no blocking unknowns.

# Tasks: Integrar flujo de creación de plato en menú semanal

## Phase 1: Foundation — Composable & Store

- [x] 1.1 **[S]** Create `apps/web/src/shared/composables/usePlateBuilder.ts` — local `reactive` draft state per call-site. Returns `{ draftItems, draftName, draftGroupCount, balance, hasItems, canSave, addFood, removeFood, setGroupCount, resetDraft, clearItems, savePlate, loadPlateIntoDraft }`. Imports `calculateBalance` from `@pakulab/shared` and delegates `savePlate` to `plateStore.saveDraftPayload()`.

- [x] 1.2 **[S]** Modify `apps/web/src/shared/stores/plateStore.ts` — add `saveDraftPayload(payload: {name, groupCount, items})` action that POSTs to `/plates`, unshifts `savedPlates`, handles `OfflineError` with `enqueuePlate()`. Keep existing `saveDraftAsPlate()` as backward-compat wrapper calling `saveDraftPayload` with internal state.

- [x] 1.3 **[S]** Verify `usePlateBuilder` isolation — two independent instances must not share `draftItems`. Manual check: instantiate in two `<script setup>` blocks, mutate one, confirm the other is unaffected.

**Depends on**: nothing | **Parallelizable**: 1.1 and 1.2 can be done in parallel; 1.3 after both.

---

## Phase 2: New Components

- [x] 2.1 **[M]** Create `apps/web/src/shared/components/PlateBuilderDrawer.vue` — `<Teleport to="body">`, slide-from-right desktop (max-w 520px), near-fullscreen mobile. Props: `visible`, `mealContext?`. Emits: `plate-created(Plate)`, `close`, `update:visible`. Consumes `usePlateBuilder()`. Reuses: `PlateVisualization`, `FoodSearchModal` with `zIndexOffset=1000`. Z-index 1100 for drawer.

- [x] 2.2 **[S]** Create `apps/web/src/shared/components/MealSlotPicker.vue` — bottom-sheet with day × mealType grid. Props: `visible`, `plateId`, `plateName`. Emits: `assigned(dayOfWeek, mealType)`, `close`, `update:visible`, `skip`. Uses `menuStore.assignPlate()`. Z-index 1300.

- [x] 2.3 **[S]** Modify `apps/web/src/modules/plates/components/FoodSearchModal.vue` — add `zIndexOffset` prop (default 0). Backdrop inline style: `zIndex: 200 + zIndexOffset`. Sheet inline style: `zIndex: 201 + zIndexOffset`. Removed hardcoded CSS z-index values.

**Depends on**: Phase 1 (2.1 needs usePlateBuilder) | **Parallelizable**: 2.2 and 2.3 are independent of 2.1.

---

## Phase 3: Menu → Builder Integration

- [x] 3.1 **[M]** Modify `apps/web/src/modules/menus/MenuWeekPage.vue`:
  - Import `PlateBuilderDrawer`.
  - Add `drawerOpen` ref and `activeSlot` ref (`{dayKey, mealKey} | null`).
  - In plate picker, add "Crear plato nuevo" button that sets `activeSlot` + `drawerOpen = true` (closes picker first).
  - Add `onPlateCreated(plate)` handler: calls `menuStore.assignPlate(activeSlot.dayKey, activeSlot.mealKey, plate.id)`, closes drawer, refreshes picker list.
  - Mount `<PlateBuilderDrawer :isOpen="drawerOpen" @plate-created="onPlateCreated" @close="drawerOpen = false" />`.

**Depends on**: Phase 2 (needs PlateBuilderDrawer) | **Parallelizable**: no.

---

## Phase 4: Builder → Menu Integration

- [x] 4.1 **[L]** Refactor `apps/web/src/modules/plates/PlateBuilderPage.vue`:
  - Replace all `plateStore.draftItems / draftName / draftGroupCount` reads with `usePlateBuilder()` destructured state.
  - Replace `plateStore.addFoodToDraft / removeFoodFromDraft / setGroupCount / resetDraft / clearItems` with composable actions.
  - Replace `plateStore.saveDraftAsPlate()` with `composable.savePlate()`.
  - Add `showMealPicker` ref, `lastSavedPlate` ref. After save, set `showMealPicker = true`.
  - Mount `<MealSlotPicker :isOpen="showMealPicker" @select="onAssignSlot" @skip="onSkipAssignment" />`.
  - `onAssignSlot`: calls `menuStore.assignPlate(dayKey, mealKey, lastSavedPlate.id)`, shows toast, navigates to menu or stays.
  - Verify existing page behavior is identical (no regression).

**Depends on**: Phase 1 (composable) + Phase 2 (MealSlotPicker) | **Parallelizable**: no.

---

## Phase 5: Testing

- [ ] 5.1 **[S]** Write unit tests for `usePlateBuilder` — test isolation of drafts, `addFood`/`removeFood` mutation, `savePlate` delegation to mocked `plateStore.saveDraftPayload`. **BLOCKED**: `apps/web` has no vitest config. Tests can be written but cannot execute until test infra is added. File: `apps/web/src/shared/composables/__tests__/usePlateBuilder.test.ts`.

- [ ] 5.2 **[S]** Write unit tests for `MealSlotPicker` — emits `select` with correct `{dayKey, mealKey}` on click, emits `close` on cancel. **BLOCKED**: same vitest gap. File: `apps/web/src/modules/menus/components/__tests__/MealSlotPicker.test.ts`.

- [ ] 5.3 **[S]** Write unit tests for `plateStore.saveDraftPayload` — happy path POST, offline queue path. **NOT BLOCKED**: can use existing api vitest config if testing store in isolation, but requires Pinia mock setup. File: `apps/web/src/shared/stores/__tests__/plateStore.test.ts`.

**Depends on**: Phases 1–4 | **Parallelizable**: 5.1, 5.2, 5.3 are independent.

---

## Phase 6: Manual Verification

- [ ] 6.1 **Manual** — Menu→Drawer→Save→Auto-assign full flow. Verify: new plate appears in slot, picker closes, drawer closes, no console errors.

- [ ] 6.2 **Manual** — Builder→MealSlotPicker→Assign flow. Verify: picker appears after save, assignment succeeds, toast shows, menu reflects change.

- [ ] 6.3 **Manual** — Z-index layering: open drawer → open FoodSearchModal inside drawer → modal overlays drawer correctly on desktop + mobile.

- [ ] 6.4 **Manual** — Offline: disconnect network → create plate in drawer → verify optimistic plate appears in menu picker → reconnect → verify sync.

**Depends on**: Phases 1–4 | **Parallelizable**: all independent.

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1. Foundation | 3 | Composable + store refactor |
| 2. Components | 3 | Drawer, MealSlotPicker, FoodSearchModal |
| 3. Menu → Builder | 1 | MenuWeekPage integration |
| 4. Builder → Menu | 1 | PlateBuilderPage refactor |
| 5. Testing | 3 | Unit tests (2 blocked on vitest) |
| 6. Manual QA | 4 | E2E flows, z-index, offline |
| **Total** | **15** | |

**Recommended order**: Phase 1 → 2 → 3 → 4 → 5 (unblocked ones) + 6 in parallel.
**Critical path**: 1.1 → 2.1 → 3.1 → 4.1 (sequential).
**Parallel track**: 1.2 + 2.2 + 2.3 can run concurrently with critical path.

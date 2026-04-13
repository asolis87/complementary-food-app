# Tasks: ux-improvements-v1

## Phase 1: Improvement 1 — Reset new plate draft

- [ ] 1.1 Update `apps/web/src/modules/plates/PlateBuilderPage.vue` so `plateStore.resetDraft()` is the FIRST line in `onMounted`, before any edit-mode or fetch logic. Testability: mount `/plate/new` and verify the canvas/draft starts empty. Dependencies: none.

## Phase 2: Improvement 2 — Lock recent-first plate ordering

- [ ] 2.1 Verify `apps/api/src/modules/plates/plates.service.ts` keeps `orderBy: { createdAt: 'desc' }` and `apps/web/src/shared/stores/plateStore.ts` keeps `savedPlates.value.unshift(result.data)`; add a short contract comment in the verified source of truth, or add a computed desc sort in `plateStore.ts` only if verification fails. Testability: fetch list + create plate and confirm newest item renders first. Dependencies: none.

## Phase 3: Improvement 3 — Reclassify Camote seed data

- [ ] 3.1 Move the `'Camote cocido'` object in `prisma/seed.ts` from `vegetables` to `cerealsTubers` and change `group` to `'CEREAL_TUBER'`; leave `'Yuca cocida'` unchanged. Testability: run seed against a local DB and verify Camote persists with the new group. Dependencies: none.

## Phase 4: Improvement 4 — Confirm first serve in weekly menu

- [ ] 4.1 In `apps/web/src/modules/menus/MenuWeekPage.vue`, add `firstServeDialog` state plus `closeFirstServeDialog()` / `confirmFirstServe()` reusing the existing `dialog--confirm` pattern. Testability: with an unserved meal, trigger handlers and assert dialog open/close state plus `menuStore.serveMeal()` on confirm. Dependencies: none.
- [ ] 4.2 Update `handleServeClick` and the template in `apps/web/src/modules/menus/MenuWeekPage.vue` so unserved meals open the new dialog, while already-served meals keep the existing `reServeDialog` flow. Testability: verify both branches from the same button path. Dependencies: 4.1.

## Phase 5: Improvement 5 — Apply one plate to one meal or all day

- [ ] 5.1 In `apps/web/src/modules/menus/MenuWeekPage.vue`, add `applyAllDialog`, `pendingMealKey`, and import/reuse the meal source (`packages/shared/src/constants/mealType.ts` `ACTIVE_MEAL_KEYS`, or the existing local `MEALS` contract if that is the active UI source). Testability: selecting a plate captures day/meal context without assigning yet. Dependencies: none.
- [ ] 5.2 Refactor `assignPlate` in `apps/web/src/modules/menus/MenuWeekPage.vue` to close the picker and open the apply-all dialog after plate selection instead of assigning immediately. Testability: picker closes and the follow-up dialog opens with the selected plate/day. Dependencies: 5.1.
- [ ] 5.3 Add `confirmApplySingle()` and `confirmApplyAll()` in `apps/web/src/modules/menus/MenuWeekPage.vue`; single assigns only `pendingMealKey`, all-day loops sequentially through the meal constant and calls `menuStore.assignPlate(...)` for each slot. Testability: mock the store and assert 1 call vs N ordered calls. Dependencies: 5.2.
- [ ] 5.4 Add the apply-all confirmation template in `apps/web/src/modules/menus/MenuWeekPage.vue` with “Solo esta comida” and “Aplicar a todas”, reusing `dialog--confirm` styles. Testability: click each CTA and verify the correct handler path fires. Dependencies: 5.3.

## Phase 6: Improvement 6 — Prevent mobile FAB overlap

- [ ] 6.1 Update `apps/web/src/modules/plates/PlateListPage.vue` styles so `.plate-list-fab` uses `bottom: calc(8rem + env(safe-area-inset-bottom))` and the list container adds matching bottom padding. Testability: mobile viewport scroll to bottom and confirm the last card stays fully visible above the FAB. Dependencies: none.

## Phase 7: Improvement 7 — Fix plate title invisible on desktop

- [ ] 7.1 In `apps/web/src/modules/plates/PlateListPage.vue`, fix `.desktop-only` display rule for the `<h3 class="card-name desktop-only">` element. The global `.desktop-only` media query sets `display: flex` which collapses block-level text. Fix: change the media query rule to `display: block` (or add `.card-name.desktop-only { display: block }` scoped override) so the plate title renders correctly on viewports ≥768px. Testability: open the plate list on desktop (≥768px) and verify each plate card shows its name. Dependencies: none.

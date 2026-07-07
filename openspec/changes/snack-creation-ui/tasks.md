# Tasks: Snack Creation UI (Mis Colaciones)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | PR-1: ~280 lines, PR-2: ~550 lines, PR-3: ~350 lines (total ~1180 lines) |
| 400-line budget risk | High — PR-2 likely exceeds 400 individually |
| Chained PRs recommended | Yes |
| Suggested split | PR-1 (shared + store + composable) → PR-2 (builder + viz) → PR-3 (tab + list) |
| Delivery strategy | feature-branch-chain on `feat/snack-creation-ui` tracker branch |
| Chain strategy | feature-branch-chain: PR-1 → `feat/snack-creation-ui-pr1`, PR-2 → `feat/snack-creation-ui-pr2` (targets PR-1 branch), PR-3 → `feat/snack-creation-ui-pr3` (targets PR-2 branch) |
| **PR-2 size recommendation** | **size:exception** — `SnackBuilderDrawer` + `SnackVisualization` are cohesive, splitting into 2a/2b would leave a half-functional drawer (no viz) that can't be manually tested. Accept ~550 lines as an exception for UI component cohesion. |
| **Delete confirmation decision** | **Reuse existing pattern** — PlateDetailPage uses inline modal overlay (v-if + modal-overlay + modal role). Mirror the same HTML structure + CSS in SnackListSection for consistency. NO new shared modal component (YAGNI). |

Decision needed before apply: No (size:exception approved)
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | SNACK_LIMITS constant + snackStore create/delete/fetchMore + useSnackBuilder composable | PR-1 | Base: `feat/snack-creation-ui` tracker branch; autonomous logic, zero UI change; ~280 lines |
| 2 | SnackBuilderDrawer + SnackVisualization components | PR-2 | Base: PR-1's branch `feat/snack-creation-ui-pr1`; depends on PR-1 composable/store; size:exception (~550 lines); cohesive slice |
| 3 | PlateListPage tab + SnackListSection (list + empty-state + delete) | PR-3 | Base: PR-2's branch `feat/snack-creation-ui-pr2`; depends on PR-2 drawer; ~350 lines |

---

## PR-1: Shared + Store + Composable (autonomous logic, no UI)

### Phase 1: Shared SNACK_LIMITS Constant (RED → GREEN)

- [x] 1.1 **TEST**: Write `packages/shared/src/constants/__tests__/tiers.test.ts` addition — test `SNACK_LIMITS` shape: `{ FREE: 0, PRO: Infinity }`, assert FREE lockout mirrors PLATE_LIMITS (trial-first model). Run `pnpm --filter @pakulab/shared test` → RED. Covers REQ-SC6.
- [x] 1.2 **CONSTANT**: Modify `packages/shared/src/constants/tiers.ts` — add `export const SNACK_LIMITS: Record<UserTier, number> = { FREE: 0, PRO: Infinity }` (mirrors PLATE_LIMITS trial-first lockout, NOT literal max-5). → GREEN. Satisfies REQ-SC6.
- [x] 1.3 **BARREL**: Modify `packages/shared/src/index.ts` — export `SNACK_LIMITS`. → GREEN.
- [x] 1.4 **REBUILD**: Run `pnpm --filter @pakulab/shared build`. Confirm test green with `pnpm --filter @pakulab/shared test`.

### Phase 2: snackStore Actions (RED → GREEN → REFACTOR)

- [x] 2.1 **TEST**: Write `apps/web/src/shared/stores/__tests__/snackStore.test.ts` additions — test `createSnack` returns `{snack, warnings}`, unshifts to `savedSnacks`, respects `savedSnacks` reactivity; test `deleteSnack` filters out item, respects reactivity; test `fetchMoreSnacks` appends page 2 items. Mock `apiClient.post` → `{data: {...}, warnings: [...]}` shape. Run `pnpm --filter web test:run` → RED. Covers REQ-SC3, REQ-SC4, REQ-SC5.
- [x] 2.2 **STORE**: Modify `apps/web/src/shared/stores/snackStore.ts` — add `async createSnack(payload: CreateSnackInput): Promise<{snack: Snack, warnings: string[]}>` (POST `/api/snacks` → `{data, warnings?}`, unshift `data` to `savedSnacks`, return `{snack: data, warnings: warnings ?? []}`); add `async deleteSnack(snackId: string): Promise<void>` (DELETE `/api/snacks/:id`, filter out from `savedSnacks`); add `async fetchMoreSnacks()` action (mirror `plateStore.fetchMorePlates` pagination pattern). → GREEN. Satisfies REQ-SC3, REQ-SC4, REQ-SC5.
- [x] 2.3 **REFACTOR**: Extract any duplicated pagination logic if shared with plateStore. Run `pnpm --filter web test:run` → all GREEN.

### Phase 3: useSnackBuilder Composable (RED → GREEN → REFACTOR)

- [x] 3.1 **TEST**: Write `apps/web/src/shared/composables/__tests__/useSnackBuilder.test.ts` — test `addFood` replaces per-zone (HEALTHY_FAT accepts one, CEREAL_TUBER accepts one, FRUIT accepts one), `removeFood` by localId, `isValid` (hasItems && name.trim()), `canSave` (authed && savedSnacks.length < SNACK_LIMITS[tier]), `suggestedGroups` (11m → [HEALTHY_FAT, CEREAL_TUBER], 15m → [HEALTHY_FAT, CEREAL_TUBER, FRUIT], 8m → []), `isSuggested(group)` true for suggested groups, `saveSnack` calls `snackStore.createSnack` and returns `{snack, warnings}`, `resetDraft` clears items/name. Mock `snackStore.createSnack`, `authStore`, `profileStore.activeProfile.birthDate` → getAgeMonths. Run `pnpm --filter web test:run` → RED. Covers REQ-SC3, REQ-SC4, REQ-SC6.
- [x] 3.2 **COMPOSABLE**: Create `apps/web/src/shared/composables/useSnackBuilder.ts` — return `{ draftName, draftItems, draftStageFor, saving, lastWarnings, suggestedGroups, isSuggested, isValid, canSave, addFood, removeFood, clear, resetDraft, saveSnack }`. `suggestedGroups` = computed from `getSnackGroupsForAge(ageMonths)` (shared helper from menu-snacks). `addFood` replaces per-zone (filter out same `groupAssignment`, push new). `canSave` checks `authStore.isAuthenticated && snackStore.savedSnacks.length < SNACK_LIMITS[authStore.tier]`. `saveSnack` builds `CreateSnackInput`, calls `snackStore.createSnack`, stores `lastWarnings` ref, invokes `options?.onSaved`, returns `{snack, warnings}`. Options: `{ ageMonths: Ref<number>|(()=>number), onSaved?: (snack) => void }`. → GREEN. Satisfies REQ-SC3, REQ-SC4, REQ-SC6.
- [x] 3.3 **REFACTOR**: Extract any duplicated draft-state patterns from usePlateBuilder if applicable. Run `pnpm --filter web test:run` → all GREEN.

### Phase 4: Hygiene + PR-1 Verification

- [ ] 4.1 **TYPECHECK**: Rebuild shared (`pnpm --filter @pakulab/shared build`), then typecheck: `pnpm typecheck` → no errors.
- [ ] 4.2 **ALL TESTS GREEN**: Run `pnpm --filter @pakulab/shared test`, `pnpm --filter web test:run` → all suites green (api unchanged in PR-1).
- [ ] 4.3 **GIT STAGING**: Stage with explicit paths: `git add packages/shared/ apps/web/src/shared/` (avoids `.atl/skill-registry.md`).
- [ ] 4.4 **COMMIT**: Conventional commit `feat(snacks): SNACK_LIMITS + store create/delete + useSnackBuilder (PR-1)`. No AI attribution.
- [ ] 4.5 **BRANCH + PR**: Push to `feat/snack-creation-ui-pr1` branch. Open PR-1 targeting `feat/snack-creation-ui` tracker branch (feature-branch-chain strategy). Title: `feat: snack creation logic (PR-1)`. Description: REQ-SC3, REQ-SC4, REQ-SC5, REQ-SC6 logic satisfied; autonomous composable/store contract; zero user-visible change.

**PR-1 Finish**: Shared constant + store actions + composable are stable, testable in isolation, zero UI change. Rollback = revert PR-1 branch.

---

## PR-2: SnackBuilderDrawer + SnackVisualization (depends on PR-1)

### Phase 5: SnackVisualization Component (RED → GREEN → REFACTOR)

- [x] 5.1 **TEST**: Write `apps/web/src/modules/snacks/components/__tests__/SnackVisualization.test.ts` — test renders 3 zones (HEALTHY_FAT, CEREAL_TUBER, FRUIT), displays food name per zone, empty zone shows empty-state, NO A/L balance indicator anywhere. Mount with mock `draftItems` fixture. Run `pnpm --filter web test:run` → RED. Covers REQ-SC7.
- [x] 5.2 **COMPONENT**: Create `apps/web/src/modules/snacks/components/SnackVisualization.vue` — accept `items: PlateItemDraft[]`, `suggestedGroups: FoodGroup[]`, render 3-zone circular layout (HEALTHY_FAT left, CEREAL_TUBER top, FRUIT right), show food.name or empty placeholder per zone, NO balance bar, NO A/L indicator. Styled for 3 groups (not 4/5 like PlateVisualization). Suggested zones emphasized with visual border + "Sugerido" badge. → GREEN. Satisfies REQ-SC7.
- [x] 5.3 **REFACTOR**: No duplicated zone-rendering patterns extracted (3 zones vs 4/5 zones are structurally different). Run `pnpm --filter web test:run` → GREEN.

### Phase 6: SnackBuilderDrawer Component (RED → GREEN → REFACTOR)

- [x] 6.1 **TEST**: Write `apps/web/src/shared/components/__tests__/SnackBuilderDrawer.test.ts` — test opens/closes drawer, displays 3 zones with suggested emphasis (11m baby → HEALTHY_FAT + CEREAL_TUBER emphasized, FRUIT not), name input required for save, save disabled when name empty, save button disabled when `!canSave` (tier limit), on-save warnings surfaced via toast (mock `useSnackBuilder.saveSnack` returns `{snack, warnings: ['Missing fruit group']}`), Guardar triggers `saveSnack`, Limpiar triggers `clear`, hosts FoodSearchModal per group. Mock useSnackBuilder with per-test customization. Run `pnpm --filter web test:run` → RED. Covers REQ-SC3, REQ-SC4, REQ-SC6.
- [x] 6.2 **COMPONENT**: Create `apps/web/src/shared/components/SnackBuilderDrawer.vue` — accept `visible`, `ageMonths` props, emit `close`, `snack-created`, use `useSnackBuilder({ ageMonths: () => ageMonths, onSaved: (snack) => emit('snack-created', snack) })`, render right drawer (mirror PlateBuilderDrawer layout), name input (v-model `draftName`), 3 build zones via `<SnackVisualization :items="draftItems" :suggested-groups="suggestedGroups" @select-group="onGroupSelect" />`, warnings surfaced via `uiStore.addToast(warning, 'warning')` after save, tier lockout upsell when `!canSave`, save button (:disabled="`!isValid || saving || !canSave`", @click="`handleSave`"), clear button (@click="`clear`"), hosts `<FoodSearchModal>` per group. `handleSave` async: calls `saveSnack()`, shows warnings via toast if any, emits 'snack-created' (via onSaved callback), closes drawer. → GREEN. Satisfies REQ-SC3, REQ-SC4, REQ-SC6.
- [x] 6.3 **REFACTOR**: No significant drawer layout/styles extraction needed (PlateBuilderDrawer and SnackBuilderDrawer share CSS tokens but differ structurally: no groupCount toggle, no balance bar in snack drawer). Run `pnpm --filter web test:run` → all GREEN.

### Phase 7: Hygiene + PR-2 Verification

- [x] 7.1 **TYPECHECK**: Typecheck web: `pnpm --filter web typecheck` → no errors.
- [x] 7.2 **ALL TESTS GREEN**: Run `pnpm --filter web test:run` → all suites green (37 test files, 356 tests passed; added 2 test files with 14 tests for SnackVisualization + SnackBuilderDrawer).
- [ ] 7.3 **GIT STAGING**: Stage with explicit paths: `git add apps/web/src/modules/snacks/ apps/web/src/shared/components/SnackBuilderDrawer.vue apps/web/src/shared/components/__tests__/SnackBuilderDrawer.test.ts openspec/changes/snack-creation-ui/tasks.md` (avoids `.atl/skill-registry.md`).
- [ ] 7.4 **COMMIT**: Conventional commit `feat(snacks): SnackBuilderDrawer + SnackVisualization (PR-2)`. No AI attribution.
- [ ] 7.5 **BRANCH + PR**: Push to `feat/snack-creation-ui-pr2` branch. Open PR-2 targeting `feat/snack-creation-ui-pr1` branch (feature-branch-chain: child targets previous PR branch). Title: `feat: snack builder drawer + viz (PR-2 — size:exception)`. Description: REQ-SC3, REQ-SC4, REQ-SC7 UI satisfied; depends on PR-1 composable/store; size:exception (~550 lines) approved for cohesive UI slice; no route/tab yet (drawer not user-accessible until PR-3).

**PR-2 Finish**: SnackBuilderDrawer + SnackVisualization fully implemented and tested in isolation. No user-facing route yet. Rollback = revert PR-2 branch (PR-1 remains stable).

---

## PR-3: PlateListPage Tab + SnackListSection (depends on PR-2)

### Phase 8: SnackListSection Component (RED → GREEN → REFACTOR)

- [ ] 8.1 **TEST**: Write `apps/web/src/modules/plates/components/__tests__/SnackListSection.test.ts` — test renders snack grid (name + item summary "3 alimentos"), empty-state when zero snacks ("No tienes colaciones guardadas todavía" + tier hint "Crea hasta 5 colaciones en el plan gratuito"), delete button opens inline confirmation modal (mirror PlateDetailPage modal-overlay + modal role), confirm delete calls `snackStore.deleteSnack`, cancel closes modal, delete last snack shows empty-state, tier upsell banner when `savedSnacks.length >= SNACK_LIMITS[tier] && tier === FREE`, load-more button when `hasMore`, drawer opens on create click. Mock `snackStore.savedSnacks`, `authStore.tier`. Run `pnpm --filter web test:run` → RED. Covers REQ-SC2, REQ-SC5, REQ-SC6.
- [ ] 8.2 **COMPONENT**: Create `apps/web/src/modules/plates/components/SnackListSection.vue` — render snack grid (v-for `snackStore.savedSnacks`), card shows snack.name + summary (e.g. `${snack.items.length} alimentos`), delete button per card opens inline confirmation modal (v-if `showDeleteModal` + `deleteTargetId`, HTML structure mirrors PlateDetailPage: `<div class="modal-overlay" @click.self> → <div class="modal" role="dialog"> → modal-title/modal-body/modal-actions → btn-cancel + btn-confirm-delete`), confirm calls `snackStore.deleteSnack(deleteTargetId)`, empty-state (v-if `savedSnacks.length === 0`: icon + "No tienes colaciones guardadas todavía" + tier hint "Crea hasta 5 colaciones en el plan gratuito" + create button opens drawer), tier upsell banner (v-if `savedSnacks.length >= SNACK_LIMITS[authStore.tier] && authStore.tier === 'FREE'`: "Alcanzaste el límite de colaciones del plan gratuito. Actualiza a Pro para crear colaciones ilimitadas."), load-more button (v-if `snackStore.hasMore`, @click `snackStore.fetchMoreSnacks`), drawer host (`<SnackBuilderDrawer :visible="showDrawer" :baby-age="babyAge" @saved @close>`). → GREEN. Satisfies REQ-SC2, REQ-SC5, REQ-SC6.
- [ ] 8.3 **REFACTOR**: Extract any duplicated grid/empty-state/modal styles if shared with PlateListPage (likely modal-overlay/modal classes). Run `pnpm --filter web test:run` → GREEN.

### Phase 9: PlateListPage Tab Integration (RED → GREEN → REFACTOR)

- [ ] 9.1 **TEST**: Write `apps/web/src/modules/plates/__tests__/PlateListPage.test.ts` additions — test "Colaciones" tab renders when `?tab=snacks` in URL, tab switch via click updates URL query param (router.replace), default tab is "Platos" when no query param, `<SnackListSection>` mounted when active tab is "Colaciones", `<plate-grid>` mounted when active tab is "Platos". Mock router, snackStore. Run `pnpm --filter web test:run` → RED. Covers REQ-SC1.
- [ ] 9.2 **PAGE**: Modify `apps/web/src/modules/plates/PlateListPage.vue` — add tab bar (2 tabs: "Platos" | "Colaciones"), derive `activeTab = route.query.tab === 'snacks' ? 'snacks' : 'platos'`, switch tabs via `router.replace({ query: { tab: newTab } })`, render `<SnackListSection v-if="activeTab === 'snacks'" />`, render existing `<ul class="plate-grid" v-else-if="activeTab === 'platos'">` (wrap existing plate-grid in v-else-if). Compute `babyAge` from `profileStore.activeProfile?.birthDate` → `getAgeMonths` (reuse pattern from MenuWeekPage L937). Pass `babyAge` to SnackListSection. → GREEN. Satisfies REQ-SC1.
- [ ] 9.3 **REFACTOR**: Extract tab-bar component if reusable elsewhere (unlikely — single use). Run `pnpm --filter web test:run` → all GREEN.

### Phase 10: Hygiene + PR-3 Verification

- [ ] 10.1 **TYPECHECK**: Typecheck web: `pnpm --filter web typecheck` → no errors.
- [ ] 10.2 **ALL TESTS GREEN**: Run `pnpm --filter web test:run` → all suites green (shared/api unchanged in PR-3).
- [ ] 10.3 **GIT STAGING**: Stage with explicit paths: `git add apps/web/src/modules/plates/` (avoids `.atl/skill-registry.md`).
- [ ] 10.4 **COMMIT**: Conventional commit `feat(snacks): PlateListPage Colaciones tab + SnackListSection (PR-3)`. No AI attribution.
- [ ] 10.5 **BRANCH + PR**: Push to `feat/snack-creation-ui-pr3` branch. Open PR-3 targeting `feat/snack-creation-ui-pr2` branch (feature-branch-chain: child targets previous PR branch). Title: `feat: Colaciones tab + snack list UI (PR-3)`. Description: REQ-SC1, REQ-SC2, REQ-SC5, REQ-SC6 UI satisfied; depends on PR-2 drawer; user-visible feature; end-to-end snack creation flow complete.

**PR-3 Finish**: Colaciones tab visible, user can create/delete snacks, tier gate enforced, MenuWeekPage picker sees new snacks via shared `snackStore.savedSnacks`. Rollback = revert PR-3 branch (PR-1 + PR-2 remain stable).

---

## Phase 11: Tracker PR + Merge to Release

- [ ] 11.1 **MERGE CHAIN**: After PR-1, PR-2, PR-3 are merged sequentially (PR-3 → PR-2, PR-2 → PR-1, PR-1 → tracker), open a final PR from `feat/snack-creation-ui` → `release/etapa-10-23-meses`. Title: `feat: snack creation UI (Mis Colaciones)`. Description: REQ-SC1..SC7 satisfied; links to PR-1 + PR-2 + PR-3.
- [ ] 11.2 **FINAL VERIFICATION**: CI green on tracker PR, manual QA: navigate to `/plates?tab=snacks`, create a snack (2-group for 11m baby), verify warnings display after save, delete snack with confirmation, verify tier gate blocks FREE user, verify new snack appears in MenuWeekPage snack picker.
- [ ] 11.3 **MERGE TRACKER**: Merge `feat/snack-creation-ui` → `release/etapa-10-23-meses`. All changes now in release branch.

---

## Summary

**Total tasks**: 33 across 11 phases
**Delivery**: Feature-branch-chain (PR-1 → PR-2 → PR-3 → tracker PR)
**TDD**: Every implementation task follows RED → GREEN → REFACTOR
**Test coverage**: 7 test files created/modified across shared/web
**Requirements satisfied**:
- REQ-SC1 (tab via ?tab=snacks), REQ-SC2 (list display), REQ-SC3 (create snack), REQ-SC4 (age-suggested + warnings), REQ-SC5 (delete with confirm), REQ-SC6 (tier gate), REQ-SC7 (no A/L balance)

**Open questions resolved**:
- PR-2 size: size:exception approved — cohesive UI slice (drawer + viz) keeps builder testable/shippable as a unit (~550 lines).
- Delete confirmation: reuse PlateDetailPage inline modal pattern (modal-overlay + modal role + btn-confirm-delete) for consistency.

**Next step**: Ready for `sdd-apply` (auto-chain mode: orchestrator will implement PR-1 first).

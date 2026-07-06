# Tasks: Menu Snacks (Colaciones)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | PR-1a: ~550 lines, PR-1b: ~350 lines (total ~900 lines) |
| 400-line budget risk | High — each slice may approach/exceed 400 individually |
| Chained PRs recommended | Yes |
| Suggested split | PR-1a (schema + backend + shared) → PR-1b (menu un-hide + assignment) |
| Delivery strategy | stacked PRs with feature-branch-chain |
| Chain strategy | feature-branch-chain: tracker branch accumulates integration; PR-1a targets tracker, PR-1b targets PR-1a's branch |

Decision needed before apply: No (auto-chain active)
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema + backend snack CRUD + shared types/constants | PR-1a | Base: `feat/menu-snacks` tracker branch; autonomous catalog contract behind hidden UI; ~550 lines |
| 2 | Menu un-hide + snack assignment path | PR-1b | Base: PR-1a's branch `feat/menu-snacks-pr1a`; depends on PR-1a schema/types; ~350 lines |

---

## PR-1a: Schema + Backend + Shared (autonomous catalog contract)

### Phase 1: Schema Foundation (RED → GREEN)

- [ ] 1.1 **TEST**: Write `apps/api/src/modules/snacks/__tests__/snack-group-sync.test.ts` — assert `SNACK_GROUPS` subset of Prisma `FoodGroup` enum (mirrors `plate-stage-sync.test.ts`). Run `pnpm --filter api test` → RED.
- [ ] 1.2 **SCHEMA**: Add `Snack` and `SnackItem` models to `prisma/schema.prisma` (see design §Interfaces). Add `MenuMeal.snackId String?` FK + `snack Snack? @relation(onDelete: SetNull)`. Add reverse relations on `User`/`BabyProfile`/`Food`. Run `pnpm --filter api db:push` + `pnpm --filter api db:generate`.
- [ ] 1.3 **SHARED CONSTANTS**: Create `packages/shared/src/constants/snack.ts` — export `SNACK_GROUPS = ['HEALTHY_FAT','CEREAL_TUBER','FRUIT'] as const`, `getSnackGroupsForAge(months): FoodGroup[]`, `getMissingSnackGroups(items, months)`. Satisfies REQ-SM4.
- [ ] 1.4 **REBUILD**: Run `pnpm --filter @pakulab/shared build` → sync test now GREEN. Confirm with `pnpm --filter api test snack-group-sync`.

### Phase 2: Shared Types (RED → GREEN)

- [ ] 2.1 **TEST**: Write `packages/shared/src/constants/__tests__/snack.test.ts` — test `getSnackGroupsForAge(11) → [FAT,CEREAL]`, `(15) → [FAT,CEREAL,FRUIT]`, `(8) → []`, `getMissingSnackGroups`. Run `pnpm --filter @pakulab/shared test` → RED.
- [ ] 2.2 **TYPES**: Create `packages/shared/src/types/snack.ts` — export `Snack`, `SnackItem`, `SnackItemSummary`, `CreateSnackInput`. Satisfies REQ-SM1 type contract.
- [ ] 2.3 **MENU TYPES**: Modify `packages/shared/src/types/menu.ts` — add `snackId?: string | null` + `snack?: Snack` to `MenuMealResponse`; add `snackId?: string | null` to `MealSlotPatch`. Satisfies REQ-WM1 shared contract.
- [ ] 2.4 **BARREL**: Modify `packages/shared/src/index.ts` — export snack types + constants.
- [ ] 2.5 **REBUILD + GREEN**: Run `pnpm --filter @pakulab/shared build`, then `pnpm --filter @pakulab/shared test` → GREEN.

### Phase 3: Backend Snack Module (RED → GREEN → REFACTOR)

- [ ] 3.1 **TEST**: Write `apps/api/src/modules/snacks/__tests__/snack.service.test.ts` — test `createSnack` (2-group, 3-group, invalid group), `getUserSnacks` (filter by babyProfileId/stageFor), `getSnackById`, soft-delete behavior. Run `pnpm --filter api test snack.service` → RED. Covers REQ-SM2, REQ-SM3.
- [ ] 3.2 **SERVICE**: Create `apps/api/src/modules/snacks/snack.service.ts` — implement `createSnack`, `getUserSnacks`, `getSnackById`, `deleteSnack` (soft). Reuse `requireTier('FREE')` posture. → GREEN.
- [ ] 3.3 **SCHEMA**: Create `apps/api/src/modules/snacks/snack.schemas.ts` — Zod: `createSnackSchema` (validate groupAssignment ∈ SNACK_GROUPS), `listSnacksSchema`, `getSnackSchema`. Reject `PROTEINS|VEGETABLES|DAIRY`. Satisfies REQ-SM2/SM3 validation.
- [ ] 3.4 **ROUTES**: Create `apps/api/src/modules/snacks/snack.routes.ts` — `POST /` (create), `GET /` (list), `GET /:id`, `DELETE /:id`. Wire to service under `requireAuth` + `requireTier`.
- [ ] 3.5 **APP REGISTER**: Modify `apps/api/src/app.ts` — `register(snackRoutes, { prefix: '/api/snacks' })`.
- [ ] 3.6 **REFACTOR**: Extract any shared ownership-check helpers if duplicated from plates module. Run `pnpm --filter api test` → all GREEN.

### Phase 4: Hygiene + PR-1a Verification

- [ ] 4.1 **TYPECHECK**: Rebuild shared (`pnpm --filter @pakulab/shared build`), then typecheck api + web: `pnpm --filter api typecheck`, `pnpm --filter web typecheck` → no errors.
- [ ] 4.2 **ALL TESTS GREEN**: Run `pnpm --filter @pakulab/shared test`, `pnpm --filter api test`, `pnpm --filter web test:run` → all suites green.
- [ ] 4.3 **GIT STAGING**: Stage with explicit paths: `git add prisma/ packages/shared/ apps/api/` (avoids `.atl/skill-registry.md`).
- [ ] 4.4 **COMMIT**: Conventional commit `feat(snacks): schema + backend catalog CRUD (PR-1a)`. No AI attribution.
- [ ] 4.5 **BRANCH + PR**: Push to `feat/menu-snacks-pr1a` branch. Open PR-1a targeting `feat/menu-snacks` tracker branch (feature-branch-chain strategy). Title: `feat: snacks schema + backend catalog (PR-1a)`. Description: REQ-SM1, REQ-SM2, REQ-SM3 satisfied; autonomous catalog contract; no UI changes.

**PR-1a Finish**: Schema + backend CRUD + shared types are stable, testable via API, zero user-visible change. Rollback = revert PR-1a branch.

---

## PR-1b: Menu Un-hide + Snack Assignment (depends on PR-1a)

### Phase 5: Shared MealType Relaxation (RED → GREEN)

- [ ] 5.1 **TEST**: Modify `packages/shared/src/constants/__tests__/mealType.test.ts` — relax "exactly 3" assertion → accept all 6 `MealKey` values (or age-driven subset). Run `pnpm --filter @pakulab/shared test` → RED.
- [ ] 5.2 **RELAX**: Modify `packages/shared/src/constants/mealType.ts` — keep `ACTIVE_MEAL_KEYS` export but deprecate as filter; document it as "legacy, use `getMealSlotsForAge`". → GREEN. Satisfies REQ-WM2 shared contract.
- [ ] 5.3 **REBUILD**: `pnpm --filter @pakulab/shared build`.

### Phase 6: Backend Meal-Slot Upsert Widening (RED → GREEN → REFACTOR)

- [ ] 6.1 **TEST**: Write additions to `apps/api/src/modules/menus/__tests__/menus.service.test.ts` — test snack assignment (SNACK_1 + snackId → snackId set, plateId cleared), plate-on-snack-slot rejection, snack-on-meal-slot rejection, both-IDs-set rejection. Run `pnpm --filter api test menus.service` → RED. Covers REQ-WM3, REQ-WM4, REQ-WM5.
- [ ] 6.2 **SCHEMA**: Modify `apps/api/src/modules/menus/menus.schemas.ts` — `patchMealSchema` accepts `snackId?: string | null`. Add mutual-exclusion validation (if snack mealType, reject plateId; if meal mealType, reject snackId). → GREEN.
- [ ] 6.3 **SERVICE**: Modify `apps/api/src/modules/menus/menus.service.ts` — `upsertMealSlot` handles snack path: if `snackId` provided, set `snackId`, clear `plateId: null`; if `plateId` provided, clear `snackId: null`. Add snack ownership check (mirror plate's `requireTier`). Include snack relation in response serialization. → GREEN. Satisfies REQ-WM3, REQ-WM5.
- [ ] 6.4 **REFACTOR**: Extract slot-type-to-FK mapping helper if logic is duplicated. Run `pnpm --filter api test` → all GREEN.

### Phase 7: Web Store + Page Un-hide (RED → GREEN → REFACTOR)

- [ ] 7.1 **TEST**: Write `apps/web/src/shared/stores/__tests__/menuStore.test.ts` additions — test `assignSnack` action, `snackMap` population, `ACTIVE_MEAL_KEYS` no longer filters snack slots. Run `pnpm --filter web test:run` → RED. Covers REQ-WM2, REQ-WM6.
- [ ] 7.2 **STORE**: Modify `apps/web/src/shared/stores/menuStore.ts` — remove `ACTIVE_MEAL_KEYS` filter from `menuMap` init (lines 99, 113); add `snackMap` (mirror `plateMap`), `getSnack`, `assignSnack` actions. → GREEN. Satisfies REQ-WM2.
- [ ] 7.3 **TEST**: Write `apps/web/src/modules/menus/__tests__/MenuWeekPage.test.ts` additions — test snack columns render for 11m (SNACK_1) and 15m (SNACK_1+SNACK_2), no snack columns for 8m, empty-state affordance for unassigned SNACK slot. Run `pnpm --filter web test:run` → RED. Covers REQ-WM6.
- [ ] 7.4 **PAGE**: Modify `apps/web/src/modules/menus/MenuWeekPage.vue` — widen `MealKey` type to include `snack1|snack2`; route snack slots to snack picker/assign (empty-state affordance if no snack; show snack name if assigned). Defer full picker UI (PR-1b provides minimal affordance only). → GREEN. Satisfies REQ-WM6.
- [ ] 7.5 **REFACTOR**: Extract any duplicated slot-rendering logic into a helper. Run `pnpm --filter web test:run` → all GREEN.

### Phase 8: Hygiene + PR-1b Verification

- [ ] 8.1 **TYPECHECK**: Rebuild shared (`pnpm --filter @pakulab/shared build`), then typecheck api + web: `pnpm --filter api typecheck`, `pnpm --filter web typecheck` → no errors.
- [ ] 8.2 **ALL TESTS GREEN**: Run `pnpm --filter @pakulab/shared test`, `pnpm --filter api test`, `pnpm --filter web test:run` → all suites green.
- [ ] 8.3 **WEEKSTATS FIX** (design open question): Confirm `weekStats.TOTAL_SLOTS` derives from visible meal count (7 * getMealSlotsForAge.length) not hard `7*3`. Add test if logic modified.
- [ ] 8.4 **GIT STAGING**: Stage with explicit paths: `git add packages/shared/ apps/api/ apps/web/` (avoids `.atl/skill-registry.md`).
- [ ] 8.5 **COMMIT**: Conventional commit `feat(menus): un-hide snack columns + assignment (PR-1b)`. No AI attribution.
- [ ] 8.6 **BRANCH + PR**: Push to `feat/menu-snacks-pr1b` branch. Open PR-1b targeting `feat/menu-snacks-pr1a` branch (feature-branch-chain: child targets previous PR branch). Title: `feat: snack slots visible + assignable (PR-1b)`. Description: REQ-WM2, REQ-WM3, REQ-WM5, REQ-WM6 satisfied; depends on PR-1a's schema/types; snack columns now visible per age; minimal empty-state affordance (full picker UI deferred).

**PR-1b Finish**: Snack columns visible, snack assignment works end-to-end, existing plate flow unaffected. Rollback = revert PR-1b branch (PR-1a remains stable).

---

## Phase 9: Tracker PR + Merge to Release

- [ ] 9.1 **TRACKER PR**: After PR-1a and PR-1b are merged to `feat/menu-snacks`, open a final PR from `feat/menu-snacks` → `release/etapa-10-23-meses`. Title: `feat: menu snacks (colaciones) — catalog + assignment`. Description: all REQ-SM* + REQ-WM* satisfied; links to PR-1a + PR-1b.
- [ ] 9.2 **FINAL VERIFICATION**: CI green on tracker PR, manual QA: create a snack via API, assign to SNACK_1 slot in weekly grid for 11m baby, verify snack columns visible.
- [ ] 9.3 **MERGE TRACKER**: Merge `feat/menu-snacks` → `release/etapa-10-23-meses`. All changes now in release branch.

---

## Summary

**Total tasks**: 39 across 9 phases
**Delivery**: Feature-branch-chain (PR-1a → PR-1b → tracker PR)
**TDD**: Every implementation task follows RED → GREEN → REFACTOR
**Test coverage**: 7 test files created/modified across shared/api/web
**Requirements satisfied**:
- REQ-SM1 (schema), REQ-SM2 (create), REQ-SM3 (list), REQ-SM4 (age-suggested), REQ-SM5 (no A/L)
- REQ-WM1 (snackId FK), REQ-WM2 (un-hide), REQ-WM3 (assign), REQ-WM4 (plate preserved), REQ-WM5 (mutual exclusion), REQ-WM6 (empty-state), REQ-WM7 (remove snack)

**Open questions resolved as tasks**:
- 1.1–1.4: schema + sync test (mutual-exclusion via upsert guard, not DB CHECK)
- 8.3: `weekStats` fix for TOTAL_SLOTS (age-driven count)
- 7.4: empty-state affordance for unassigned SNACK slots (minimal, full picker UI deferred)

**Next step**: Ready for `sdd-apply` (auto-chain mode: orchestrator will implement PR-1a first).

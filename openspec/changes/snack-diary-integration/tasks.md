# Tasks: Snack Diary Integration (Serve a Snack from the Menu)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | PR-1: ~260 lines (schema + backend + tests), PR-2: ~90 lines (frontend + tests) |
| 400-line budget risk | Low — both PRs comfortably under 400 |
| Chained PRs recommended | Yes |
| Suggested split | PR-1 (backend) → PR-2 (frontend) |
| Delivery strategy | feature-branch-chain on `feat/snack-diary-integration` tracker branch (off `release/etapa-10-23-meses`) |
| Chain strategy | feature-branch-chain: PR-1 → `feat/snack-diary-integration-pr1` (targets tracker), PR-2 → `feat/snack-diary-integration-pr2` (targets PR-1 branch) |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | FoodLog.snackId schema + db push + serveMeal snack branch + backend tests | PR-1 | Base: `feat/snack-diary-integration` tracker branch; autonomous backend logic; ~260 lines |
| 2 | MenuWeekPage snack serve button + component tests + diary regression test | PR-2 | Base: PR-1's branch `feat/snack-diary-integration-pr1`; depends on PR-1 schema/backend; ~90 lines |

---

## PR-1: Backend (FoodLog.snackId + serveMeal Snack Branch)

### Phase 1: FoodLog.snackId Schema (RED → GREEN)

- [x] 1.1 **TEST**: Write `apps/api/src/modules/menus/__tests__/foodLogSchema.test.ts` (or extend schema validation test) — test FoodLog shape includes nullable `snackId` field (if not covered by Prisma-generated types). Minimal/optional: Prisma-generated client already enforces shape at compile-time. Skip if no explicit runtime schema validation. Covers REQ-SD1 (schema).
- [x] 1.2 **SCHEMA**: Modify `prisma/schema.prisma` — in FoodLog model (~L287), add `snackId String?` after plateId line, add `snack Snack? @relation(fields: [snackId], references: [id], onDelete: SetNull)` after plate relation line, add `@@index([snackId])` in indexes block. In Snack model (~L247), add back-relation `foodLogs FoodLog[]`. → GREEN. Satisfies REQ-SD1.
- [x] 1.3 **MIGRATION**: Run `prisma db push` (repo convention — NOT migrate dev; menu-snacks Snack/MenuMeal.snackId have no migration file) to apply schema. Then run `prisma generate` to regenerate Prisma client. **GOTCHA**: This change MUST use db push, NOT migrate dev. Verify `.gitignore` excludes `prisma/migrations/` if any stray migration files appear (they should not). Satisfies REQ-SD1.
- [x] 1.4 **REBUILD SHARED**: If shared types import FoodLog shape (check `packages/shared/src/types/diary.ts` MealLog), rebuild: `pnpm --filter @pakulab/shared build`. Confirm `MealLog` does NOT expose snackId (per design AD5: persistence-only). → GREEN.

### Phase 2: serveMeal Snack Branch (RED → GREEN → REFACTOR)

- [x] 2.1 **TEST**: Write backend integration tests in `apps/api/src/modules/menus/menus.routes.test.ts` additions (mirror existing createMockPrisma pattern from L194-217) — **Snack serve scenarios**: (a) Serve 2-item snack → 2 FoodLog entries created (snackId set, plateBalanceLabel null, entriesCount=2), (b) Serve 3-item snack → 3 FoodLog entries (entriesCount=3), (c) Empty snack (items=[]) → 400 Bad Request "La colación no tiene alimentos asignados", (d) Re-serve without force → 409 AlreadyServedError, (e) Re-serve with force → replaces prior logs (replacedCount > 0), (f) Neither plateId nor snackId assigned → NotFoundError "No hay plato ni colación asignada a esta comida", (g) Snack.userId !== userId → ForbiddenError. **Plate-path REGRESSION scenario**: (h) Serve plate slot with snackId=null → plateId set, snackId null, plateBalanceLabel set (byte-for-byte existing behavior, confirm snack branch never entered). Mock `createMockPrisma` to return menuMeal with `snackId` + `snack.items[]` + `snack.userId` for snack tests. Run `pnpm --filter api test` → RED. Covers REQ-SD2, REQ-SD3, REQ-SD4, REQ-SD5.
- [x] 2.2 **IMPL**: Modify `apps/api/src/modules/menus/menus.service.ts` serveMeal function (~L654-776) — extend `menuDay.findFirst` include block (L678-687) to add `snack: { include: { items: { include: { food: { select: { id, name, group, alClassification, isAllergen, ageMonths, allergenType, warningTags } } } } } }` (mirror plate.items.food select). Replace L700 plate-only guard with source-resolution branch:
  ```ts
  // Resolve meal source (plate or snack)
  let source: { kind: 'plate' | 'snack', items: any[], plateId: string | null, snackId: string | null, label: string | null }
  
  if (menuMeal.snackId && menuMeal.snack) {
    // Snack ownership check (snacks are user-scoped via Snack.userId)
    if (menuMeal.snack.userId !== userId) {
      throw new ForbiddenError('No tienes permiso para servir esta colación')
    }
    source = {
      kind: 'snack',
      items: menuMeal.snack.items,
      plateId: null,
      snackId: menuMeal.snack.id,
      label: null,
    }
  } else if (menuMeal.plateId && menuMeal.plate) {
    source = {
      kind: 'plate',
      items: menuMeal.plate.items,
      plateId: menuMeal.plate.id,
      snackId: null,
      label: null, // will compute later
    }
  } else {
    throw new NotFoundError('No hay plato ni colación asignada a esta comida')
  }
  ```
  Inside $transaction (L715-769), replace L734-741 plate-only empty check + balanceLabel derivation with generic:
  ```ts
  if (!source.items || source.items.length === 0) {
    if (source.kind === 'plate') {
      throw new EmptyPlateError()
    } else {
      throw new BadRequestError('La colación no tiene alimentos asignados')
    }
  }
  
  // Compute label only for plates
  const plateBalanceLabel = source.kind === 'plate' 
    ? derivePlateBalanceLabel((menuMeal.plate as any).balanceScore)
    : null
  ```
  Replace L743-752 foodLogData map with generic over source.items:
  ```ts
  const foodLogData = source.items.map((item) => ({
    userId,
    babyProfileId: payload.babyProfileId,
    foodId: item.foodId,
    date: serveDate,
    mealType: payload.mealType,
    plateId: source.plateId,
    snackId: source.snackId,
    plateBalanceLabel,
  }))
  ```
  → GREEN. Satisfies REQ-SD2, REQ-SD3, REQ-SD4, REQ-SD5.
- [x] 2.3 **REFACTOR**: Extract `type ServeSource = {kind: 'plate', items, plateId: string, snackId: null, label: string | null} | {kind: 'snack', items, plateId: null, snackId: string, label: null}` as internal type at top of menus.service.ts for readability. Run `pnpm --filter api test` → all GREEN.

### Phase 3: Hygiene + PR-1 Verification

- [x] 3.1 **TYPECHECK**: Rebuild shared if touched (`pnpm --filter @pakulab/shared build`), then typecheck: `pnpm typecheck` → no errors.
- [x] 3.2 **ALL TESTS GREEN**: Run `pnpm --filter api test` → all suites green (web unchanged in PR-1).
- [ ] 3.3 **GIT STAGING**: Stage with explicit paths: `git add prisma/ apps/api/ openspec/changes/snack-diary-integration/tasks.md` (avoids `.atl/skill-registry.md`, `docker-compose.yml`). NEVER use `git add -A`.
- [ ] 3.4 **COMMIT**: Conventional commit `feat(diary): serve snack from menu → FoodLog.snackId (PR-1)`. No AI attribution.
- [ ] 3.5 **BRANCH + PR**: Push to `feat/snack-diary-integration-pr1` branch. Open PR-1 targeting `feat/snack-diary-integration` tracker branch (feature-branch-chain strategy). Title: `feat: serve snack from menu (backend — PR-1)`. Description: REQ-SD1, REQ-SD2, REQ-SD3, REQ-SD4, REQ-SD5 backend satisfied; FoodLog.snackId schema + serveMeal snack branch; plate-path regression verified; no user-visible UI change.

**PR-1 Finish**: Backend snack-serve logic complete, db schema extended, zero frontend change. Rollback = revert PR-1 branch.

---

## PR-2: Frontend (MenuWeekPage Serve Button + Diary Regression Test)

### Phase 4: MenuWeekPage Snack Serve Button (RED → GREEN → REFACTOR)

- [ ] 4.1 **TEST**: Write frontend component tests in `apps/web/src/modules/menus/__tests__/MenuWeekPage.test.ts` additions (or `MenuWeekPage.desktop.test.ts` / `MenuWeekPage.mobile.test.ts` if split) — test (a) serve button renders on assigned snack slot (desktop block ~L107-121, mobile block ~L348-358), (b) served snack shows "Servido ✓" / "Se lo di ✓" (mirroring plate served state), (c) empty snack slot has no serve button, (d) serve button click calls `menuStore.serveMeal(profileId, dayKey, mealKey)` with correct args, (e) button disabled during loading (`menuStore.isServeLoading(day.key, meal.key)`). Mock menuStore with `getAssignedSnack`, `serveMeal`, `isServeLoading`, `getServedAt`. Run `pnpm --filter web test:run` → RED. Covers REQ-SD6.
- [ ] 4.2 **COMPONENT**: Modify `apps/web/src/modules/menus/MenuWeekPage.vue` — in desktop snack-chip block (L107-121), add serve button + served state AFTER snack name line, BEFORE remove button. Mirror plate-chip serve button structure (L156-168):
  ```vue
  <div class="snack-chip__actions">
    <button
      class="snack-chip__serve"
      :class="{ 'snack-chip__serve--served': menuStore.getServedAt(day.key, meal.key) }"
      :title="menuStore.getServedAt(day.key, meal.key) ? 'Servido ✓' : 'Registrar colación'"
      :disabled="menuStore.isServeLoading(day.key, meal.key)"
      @click.stop="handleServeClick(day.key, meal.key)"
    >
      <span v-if="menuStore.isServeLoading(day.key, meal.key)" class="snack-chip__serve-spinner" />
      <span v-else class="material-symbols-outlined" aria-hidden="true">
        {{ menuStore.getServedAt(day.key, meal.key) ? 'check_circle' : 'restaurant' }}
      </span>
    </button>
    <button
      class="plate-chip__remove"
      :aria-label="`Quitar ${getAssignedSnack(day.key, meal.key)!.name}`"
      @click.stop="removeSnack(day.key, meal.key)"
    >
      <span class="material-symbols-outlined" aria-hidden="true">close</span>
    </button>
  </div>
  ```
  Repeat for mobile snack-chip block (L348-358). Reuse existing `handleServeClick` (already slot-generic). Add CSS classes `.snack-chip__actions`, `.snack-chip__serve`, `.snack-chip__serve--served`, `.snack-chip__serve-spinner` mirroring `.plate-chip__serve` styles. → GREEN. Satisfies REQ-SD6.
- [ ] 4.3 **REFACTOR**: No significant refactoring needed (handleServeClick is already generic over dayKey + mealKey). Run `pnpm --filter web test:run` → all GREEN.

### Phase 5: Diary Regression Test (SD8 — Manual Snack Logging)

- [ ] 5.1 **TEST**: Write diary unit test in `apps/web/src/modules/diary/__tests__/mealTypeOptions.test.ts` additions — test `getMealTypeOptions` exposes SNACK_1 for 11m baby (stage four), exposes SNACK_1 + SNACK_2 for 15m baby (stage five), does NOT expose any snack options for 8m baby (stage three). Assert returned `MealTypeOption[]` values include `MealType.SNACK_1` / `MealType.SNACK_2` where expected. Run `pnpm --filter web test:run` → RED (may already be GREEN if prior tests cover this; if so, add explicit scenario). Covers REQ-SD8 (regression test only — no code change expected; getMealTypeOptions already uses getMealSlotsForAge from shared).
- [ ] 5.2 **VERIFY**: Confirm `getMealTypeOptions` implementation (mealTypeOptions.ts L61-63) already delegates to `getMealSlotsForAge(ageMonths)` → test should pass (GREEN). If test is RED, investigate (should NOT be; menu-snacks already shipped SNACK_1/SNACK_2 support). Satisfies REQ-SD8.

### Phase 6: Hygiene + PR-2 Verification

- [ ] 6.1 **TYPECHECK**: Typecheck web: `pnpm --filter web typecheck` → no errors.
- [ ] 6.2 **ALL TESTS GREEN**: Run `pnpm --filter web test:run` → all suites green (shared/api unchanged in PR-2).
- [ ] 6.3 **GIT STAGING**: Stage with explicit paths: `git add apps/web/src/modules/menus/ apps/web/src/modules/diary/ openspec/changes/snack-diary-integration/tasks.md` (avoids `.atl/skill-registry.md`).
- [ ] 6.4 **COMMIT**: Conventional commit `feat(diary): snack serve button + diary snack regression test (PR-2)`. No AI attribution.
- [ ] 6.5 **BRANCH + PR**: Push to `feat/snack-diary-integration-pr2` branch. Open PR-2 targeting `feat/snack-diary-integration-pr1` branch (feature-branch-chain: child targets previous PR branch). Title: `feat: snack serve button + diary regression (PR-2)`. Description: REQ-SD6, REQ-SD8 satisfied; depends on PR-1 backend; user-visible snack serve flow complete.

**PR-2 Finish**: Snack serve button visible on menu, served snacks appear in diary/dashboard via existing getTodayLogs. Rollback = revert PR-2 branch (PR-1 remains stable).

---

## Phase 7: Tracker PR + Merge to Release

- [ ] 7.1 **MERGE CHAIN**: After PR-1, PR-2 are merged sequentially (PR-2 → PR-1, PR-1 → tracker), open a final PR from `feat/snack-diary-integration` → `release/etapa-10-23-meses`. Title: `feat: snack diary integration (serve snack from menu)`. Description: REQ-SD1..SD8 satisfied; links to PR-1 + PR-2. Includes REQ-SD7 note: served snacks appear in dashboard/bitácora without code change (getTodayLogs is mealType-agnostic).
- [ ] 7.2 **FINAL VERIFICATION**: CI green on tracker PR, manual QA: (a) Navigate to weekly menu for a baby ≥10m, (b) Build + assign a 2-item snack to a SNACK_1 slot, (c) Click serve button → verify FoodLog entries created with snackId in DB, (d) Navigate to bitácora → verify served snack appears for that date, (e) Navigate to dashboard today → verify served snack appears in today's summary, (f) Test re-serve without force → verify 409 conflict, (g) Test re-serve with force → verify replaces prior logs, (h) Verify empty snack → 400 error, (i) Test plate serve → verify plateId set, snackId null (plate-path regression). Covers all REQ-SD scenarios.
- [ ] 7.3 **MERGE TRACKER**: Merge `feat/snack-diary-integration` → `release/etapa-10-23-meses`. All changes now in release branch.

---

## Summary

**Total tasks**: 23 across 7 phases
**Delivery**: Feature-branch-chain (PR-1 → PR-2 → tracker PR)
**TDD**: Every implementation task follows RED → GREEN → REFACTOR
**Test coverage**: 2 test files modified (menus.routes.test.ts + MenuWeekPage.test.ts), 1 regression test (mealTypeOptions.test.ts)
**Requirements satisfied**:
- REQ-SD1 (FoodLog.snackId FK), REQ-SD2 (serveMeal snack branch), REQ-SD3 (replace + force), REQ-SD4 (empty snack error), REQ-SD5 (plate-path regression), REQ-SD6 (snack serve button), REQ-SD7 (served snacks in diary/dashboard — no code change), REQ-SD8 (manual snack logging regression test)

**Open questions resolved**:
- Migration strategy: db push (NOT migrate dev) mirrors menu-snacks convention.
- Combined error copy: "No hay plato ni colación asignada a esta comida" (neither-assigned), "La colación no tiene alimentos asignados" (empty snack 400).
- Shared snackId exposure: persistence-only, NOT added to MealLog DTO (design AD5).

**Next step**: Ready for `sdd-apply` (auto-chain mode: orchestrator will implement PR-1 first).

# Apply Progress: etapa-10-23-meses

## TDD Cycle Evidence

### T-00-01: `getMealSlotsForAge()` + `AgeStage` type ✅

| Phase | Evidence |
|-------|----------|
| **RED** | 9 new tests in `packages/shared/src/constants/dashboard.test.ts` (boundaries: 0, 9, 10, 12, 13, 23; order; label "Comida"; negative). Initial run: 12 LSP errors (`getMealSlotsForAge` not exported) + 2 test suite ReferenceErrors → RED confirmed. |
| **GREEN** | Implemented `getMealSlotsForAge`, `SLOTS_3_MEALS`, `SLOTS_4_MEALS`, `SLOTS_5_MEALS` in `packages/shared/src/constants/dashboard.ts`. Added `AgeStage` type to `packages/shared/src/types/diary.ts`. Changed `import type { MealType }` → `import { MealType }` (used as value now). |
| **TRIANGULATE** | Test cases cover: newborn (0m), just-below-10m (9m), 10m cross, 12m last-of-window, 13m cross, 23m end, negative number fallback, chronological order of SNACK_1. |
| **REFACTOR** | Marked constant arrays as `readonly` and `as const`; added JSDoc with the clinical guide reference; kept `ponytail:` comments short (one line each) naming only the non-obvious choices. |
| **Validation** | `pnpm --filter @pakulab/shared test` → 122/122 passed (was 75; +47 unlocked by the test suites that previously failed to import). `pnpm --filter @pakulab/shared typecheck` → clean. |

### T-00-04: DashboardPage consumes `getMealSlotsForAge` ✅

| Phase | Evidence |
|-------|----------|
| **RED** | No new test (web has no vitest harness — legacy `.test.ts` files exist but aren't wired). Verification by typecheck + manual QA checklist. |
| **GREEN** | `DashboardPage.vue`: replaced `DASHBOARD_MEAL_SLOTS` import with `getMealSlotsForAge`; `todayMealSlots` computed now reads `dashboardData.baby.ageInMonths` and maps `getMealSlotsForAge(age)`. |
| **REFACTOR** | `TodayLogsCard.vue`: removed the static `DASHBOARD_MEAL_SLOTS` fallback merge. The card now renders the parent's `mealSlots` prop directly. Added `ponytail:` comment explaining why the static merge is gone. `MealSlotIcon.vue`: added `SNACK_1`/`SNACK_2` mappings to `PhCookie`. |
| **Validation** | `pnpm typecheck` → all 3 packages green. `pnpm --filter @pakulab/shared test` → 122/122 still passing. |
| **Scope** | 4 files changed, ~12 LOC net. |

### T-00-05: MenuWeekPage `MEALS` age-aware — DEFERRED to Bloque 4

The menu's data model uses its own lowercase keys (`'desayuno' | 'comida' | 'cena'`) and `menuStore.getPlate()` doesn't support `SNACK_1`/`SNACK_2`. Adding snack menu slots requires new menu store handlers, picker dialog updates, and export logic — that's a Bloque 4 scope, not Bloque 0. See tasks.md for the full deferral note. New task `T-04-MENU-SNACKS` will be created when Bloque 4 starts.

### T-00-06: DiaryPage timeline order — already correct

`DiaryPage.vue` already has `MEAL_TYPE_ORDER` with `SNACK_1: 2, SNACK_2: 4`, so a 10-23m baby's SNACK_1 log renders in chronological position 2. The "Sin registro" placeholder for missing slots is a separate UI addition, tracked as `T-04-DIARY-GAPS`.

## Files changed (cumulative)

| File | Change | LOC |
|------|--------|----:|
| `packages/shared/src/constants/dashboard.ts` | Added `getMealSlotsForAge`, `SLOTS_3_MEALS`, `SLOTS_4_MEALS`, `SLOTS_5_MEALS` | +35 |
| `packages/shared/src/types/diary.ts` | Added `AgeStage` type union | +6 |
| `packages/shared/src/constants/dashboard.test.ts` | Added 9 tests for `getMealSlotsForAge` | +75 |
| `packages/shared/src/index.ts` | Re-export `getMealSlotsForAge` from constants/dashboard | +1 |
| `apps/web/src/modules/dashboard/DashboardPage.vue` | Replaced `DASHBOARD_MEAL_SLOTS` with `getMealSlotsForAge(ageInMonths)` | +5 / -3 |
| `apps/web/src/modules/dashboard/components/TodayLogsCard.vue` | Removed static merge; card renders parent `mealSlots` prop directly | +3 / -10 |
| `apps/web/src/shared/components/MealSlotIcon.vue` | Added `SNACK_1`/`SNACK_2` icon mappings | +2 |
| `openspec/changes/etapa-10-23-meses/tasks.md` | T-00-01, T-00-04 marked `- [x]`; T-00-05 deferred; T-00-06 noted as already correct | — |
| `openspec/changes/etapa-10-23-meses/apply-progress.md` | This file | — |

## Remaining tasks (PR-1 status)

PR-1 work-unit: T-00-01 ✅ + T-00-04 ✅ + T-00-06 ✅ (no change needed) = 3/3 core tasks done. T-00-05 deferred (menu snack support is Bloque 4 work).

PR-1 is ready to merge after manual QA. Estimated total LOC: ~50 net. Well under the 400-line review budget.

Manual QA checklist for PR-1:

- [ ] Bebé de 8 meses en dashboard ve 3 cards (Desayuno, Comida, Cena)
- [ ] Bebé de 10 meses en dashboard ve 4 cards (Desayuno, Comida, Cena, Colación)
- [ ] Bebé de 14 meses en dashboard ve 5 cards (Desayuno, Colación 1, Comida, Colación 2, Cena)
- [ ] Bitácora de bebé 11m con SNACK_1 log lo muestra en posición 2
- [ ] LUNCH label dice "Comida" (no "Almuerzo")

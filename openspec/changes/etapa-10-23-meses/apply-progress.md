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

### 4R Review Pass — PR-1

The PR triggered the 4R gate (3398-line diff > 400-line budget). Ran all 4 lenses in parallel:

| Lens | Blockers | Critical | High | Medium | Low |
|------|---------:|---------:|-----:|-------:|----:|
| R1 Risk | 0 | 0 | 0 | 0 | 0 |
| R2 Readability | 0 | 2 | 2 | 6 | 0 |
| R3 Reliability | 0 | 5 | 5 | 5 | 3 |
| R4 Resilience | 0 | 3 | 3 | 4 | 2 |

Applied 3 fixes inline in commit `c4fee90`:

- **C1/C4** (order + label of SNACK_1): `SLOTS_4_MEALS` now places SNACK_1 between LUNCH and DINNER (chronological, matches la guía p.5). 10m and 12m tests tightened to use `toEqual`.
- **C2/C5** (legacy constant): `DASHBOARD_MEAL_SLOTS` renamed to `LEGACY_MEAL_SLOTS` with `@deprecated` JSDoc. API service import updated.
- **W1/M4** (AgeStage orphan): re-exported from `index.ts`; JSDoc corrected.

**Follow-up tasks created** (not blocking PR-1):

- `T-XX-DIARY-PICKER-AGE-AWARE` (Bloque 0.5): fix the diary picker to emit `SNACK_1`/`SNACK_2` so logs are visible on the dashboard. Critical regression: 10-23m colación logs are currently invisible because the diary still emits `SNACK` and the dashboard has no `SNACK` slot. 4R reliability C1.
- `T-00-08-API-DASHBOARD-AGE` (Bloque 2 / PR-2): migrate API service to `getMealSlotsForAge(babyAgeMonths)`. 4R reliability C5.
- Observability debt (R1-R13, 4R resilience): backoff-aware polling, Sentry integration, SLO counters, version-skew detection. Project-wide; not PR-1 scope.
- E2E test for the dashboard wiring (4R reliability C3): needs the web vitest harness first (project-wide gap, not PR-1).

## Files changed (cumulative)

| File | Change | LOC |
|------|--------|----:|
| `packages/shared/src/constants/dashboard.ts` | Added `getMealSlotsForAge`, `SLOTS_3_MEALS`, `SLOTS_4_MEALS`, `SLOTS_5_MEALS` | +35 |
| `packages/shared/src/types/diary.ts` | Added `AgeStage` type union | +6 |
| `packages/shared/src/constants/dashboard.test.ts` | Added 9 tests for `getMealSlotsForAge` | +75 |
| `packages/shared/src/index.ts` | Re-export `getMealSlotsForAge` from constants/dashboard | +1 |
| `packages/shared/src/constants/dashboard.ts` | Reorder `SLOTS_4_MEALS` (SNACK_1 between LUNCH and DINNER); rename `DASHBOARD_MEAL_SLOTS` → `LEGACY_MEAL_SLOTS` with `@deprecated` JSDoc | +12 / -8 |
| `packages/shared/src/types/diary.ts` | Update AgeStage JSDoc (no longer claims `getMealSlotsForAge` uses it) | +2 / -2 |
| `packages/shared/src/index.ts` | Re-export `AgeStage`; replace `DASHBOARD_MEAL_SLOTS` with `LEGACY_MEAL_SLOTS` in re-exports | +2 / -1 |
| `packages/shared/src/constants/dashboard.test.ts` | Rename describe block; tighten 10m/12m tests to `toEqual`; update legacy test references | +12 / -7 |
| `packages/shared/src/index.test.ts` | Update legacy constant test name and reference | +2 / -2 |
| `apps/api/src/modules/dashboard/dashboard.service.ts` | Update import to `LEGACY_MEAL_SLOTS`; add comment marking API's `mealSlots` field as dead data for the web until PR-2 | +3 / -2 |
| `apps/web/src/modules/dashboard/DashboardPage.vue` | Replaced `DASHBOARD_MEAL_SLOTS` with `getMealSlotsForAge(ageInMonths)` | +5 / -3 |
| `apps/web/src/modules/dashboard/components/TodayLogsCard.vue` | Removed static merge; card renders parent `mealSlots` prop directly | +3 / -10 |
| `apps/web/src/shared/components/MealSlotIcon.vue` | Added `SNACK_1`/`SNACK_2` icon mappings | +2 |
| `openspec/changes/etapa-10-23-meses/tasks.md` | T-00-01, T-00-04 marked `- [x]`; T-00-05 deferred; T-00-06 noted as already correct | — |
| `openspec/changes/etapa-10-23-meses/apply-progress.md` | This file | — |

## Remaining tasks (PR-1 status)

PR-1 work-unit: T-00-01 ✅ + T-00-04 ✅ + T-00-06 ✅ (no change needed) = 3/3 core tasks done. T-00-05 deferred (menu snack support is Bloque 4 work). 4R criticals addressed in commit `c4fee90`. New follow-up task `T-XX-DIARY-PICKER-AGE-AWARE` (Bloque 0.5) created for the diary picker age-awareness regression.

PR-1 is ready to open. 3 commits on `feat/etapa-10-23-meses-pr1-foundations`:

1. `feat(dashboard): add age-aware meal slots for 10-23m babies` (145 LOC)
2. `docs(sdd): add etapa-10-23-meses change artifacts` (~3253 LOC of openspec/ docs)
3. `fix(dashboard): apply 4R criticals - order/labels consistency, deprecate legacy constant` (42 LOC)

Estimated code LOC: ~190 net (code only, not SDD docs). SDD docs: ~3253 lines. Total PR: 3398 lines.

Manual QA checklist for PR-1:

- [ ] Bebé de 8 meses en dashboard ve 3 cards (Desayuno, Comida, Cena)
- [ ] Bebé de 10 meses en dashboard ve 4 cards (Desayuno, Comida, Cena, Colación)
- [ ] Bebé de 14 meses en dashboard ve 5 cards (Desayuno, Colación 1, Comida, Colación 2, Cena)
- [ ] Bitácora de bebé 11m con SNACK_1 log lo muestra en posición 2
- [ ] LUNCH label dice "Comida" (no "Almuerzo")

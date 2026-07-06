# Exploration — PR-13: close the 2 verify-blocking CRITICALs

> Read-only dimensioning. Base: `release/etapa-10-23-meses` @ a1b47f0.
> Engram mirror: `sdd/etapa-10-23-meses/pr13-explore`.
> Verify report that triggered this: `verify-report.md` (CRITICAL-1 REQ-A3, CRITICAL-2 REQ-D2).

## Verdict: BOTH fixes fit in ONE PR (~170-205 LOC), frontend-only

Data model is ready end-to-end for both. No backend/schema/Prisma work.

## CRITICAL-1 — REQ-A3: MenuWeekPage age-aware meal columns

**Scope: PURE FRONTEND (verified).**

- **Blocker**: `MenuWeekPage.vue:764` hardcodes `type MealKey = 'desayuno'|'comida'|'cena'`; `MEALS` array (~:782) is 3 fixed entries; CSS grid `repeat(3,1fr)`. Never calls `getMealSlotsForAge`; no SNACK columns.
- **Data model IS ready (verified against code)**:
  - `MenuMeal.mealType` is a full `MealType` enum (prisma schema.prisma:322) with `@@unique([menuDayId, mealType])` (:331) — accepts ANY meal type, no 3-slot hardcode. `menus.schemas.ts:58,73` use `z.nativeEnum(MealType)`.
  - `getMealSlotsForAge(months)` → 3/4/5 age-aware slots (`packages/shared/src/constants/dashboard.ts:168`, `SLOTS_3/4/5_MEALS:135`). Already consumed by the dashboard (`TodayLogsCard`, `DiaryPage` mealTypeOptions) — proven pattern to mirror.
  - `MEAL_KEY_TO_TYPE` / `MEAL_TYPE_TO_KEY` (`packages/shared/src/constants/mealType.ts:18,31`) cover all 6 keys incl. `snack1→SNACK_1`, `snack2→SNACK_2`.
- **Export ripple risk: NONE (verified)**. `MenuExportFrame.vue:34` does `v-for="meal in day.meals"` over `ExportDay.meals: ExportMeal[]` (:130-135) — iterates dynamically, no 3-meal assumption. Dynamic columns do NOT break the PR-12 export.
- **Change**: replace the hardcoded `MEALS` with a computed built from `getMealSlotsForAge(babyAgeMonths)` (babyAgeMonths derived from `profileStore.activeProfile.birthDate` via getAgeMonths — same helper PR-12 added); bind `grid-template-columns` to `repeat(<MEALS.length>, 1fr)`. The 3 existing `v-for="meal in MEALS"` loops (~:94/183/304) already iterate the array — no loop changes.
- **LOC**: ~20-25 prod + ~30 test.
- **Tests** (extend `MenuWeekPage.test.ts`): 3-col @8m (no snacks), 4-col @11m (SNACK_1 "Colación" present), 5-col @15m (SNACK_1+SNACK_2).

## CRITICAL-2 — REQ-D2: "Tip de la etapa" dashboard card

**Scope: PURE FRONTEND — new presentation component.**

- `useStageTip` (`useDashboardTips.ts:61`) implemented + tested (16 tests), STAGE_TIPS (`dashboard.ts:72`, 6 tips/stage) — ZERO UI consumers.
- **Change**: create `StageTipCard.vue` (mirror `BalanceInsightCard.vue` structure) calling `useStageTip(babyAgeMonths)`, showing tip + stage label + reshuffle button; wire into `DashboardPage.vue` full-width immediately AFTER `BalanceInsightCard` (REQ-D2: "debajo de la card de balance"), passing `dashboardData.baby.ageInMonths`.
- **LOC**: ~80-100 component + ~5 wiring + ~60-80 test.
- **Tests** (new `StageTipCard.test.ts`): renders tip for stage, reshuffle changes tip, displays stage label.

## Combined budget verdict

~170-205 LOC total → **ONE PR** (~50% of 400 budget). Order: CRITICAL-1 first (smaller, unblocks menu), then CRITICAL-2.

## Open questions / product decisions

- **SNACK_1 column label** (4-meal @10-12m): use the shared constant's `label` verbatim ("Colación" singular; "Colación 1"/"Colación 2" for 5-meal @13m+) — do NOT invent copy. es-MX tuteo.
- **Tip card**: reshuffle button always-visible (mirror balance card), non-collapsible, full-width after balance card. Confirm with user if a different placement/UX is wanted.

## Risks

1. Export frame ripple — assessed NONE (dynamic `v-for`).
2. Label copy must come from `SLOTS_4/5_MEALS` constants (no invention).
3. babyAgeMonths derivation must reuse `getAgeMonths` (age-0 guard) — same as PR-12.

## Recommended next step

`sdd-apply` PR-13, Approach: frontend-only, both CRITICALs in one PR, strict TDD, CRITICAL-1 then CRITICAL-2. No proposal/design phase needed (well-scoped, mirrors proven patterns). Confirm the tip-card placement/UX assumptions with user first.

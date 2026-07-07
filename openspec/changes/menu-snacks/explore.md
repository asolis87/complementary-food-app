# Exploration — menu-snacks

> Read-only investigation to prepare the proposal. Base: `release/etapa-10-23-meses`.
> Prior domain analysis: engram `architecture/snack-colaci-n-support-domain-analysis-design-tension-pre-sdd`.

## Established facts (recap)

- **Clinical (PDF p.5)**: main meal 10-23m = 4 groups (Cereal+Fruta+Verdura+Proteína); **colación 10-12m = 2 groups (Grasa+Cereal)**; **colación 13-23m (2 colaciones) = 3 groups each (Grasa+Cereal+Fruta)**.
- **Plate** = reusable 4-5 group "plato del buen comer" with A/L balance, `groupCount` (4|5), `stageFor?`. NO meal-type field.
- **USER DECISION**: a snack is a SIMPLE SEPARATE ENTITY, not a Plate.
- **ROOT CAUSE snacks unassignable**: `MenuWeekPage.vue:~113` filters the grid by `ACTIVE_MEAL_KEYS = ['desayuno','comida','cena']` (`mealType.ts:71`), hiding snack columns — which CONTRADICTS PR-13's age-aware `MEALS` computed (`getMealSlotsForAge` already returns SNACK_1 @10-12m, SNACK_1+SNACK_2 @13m+).

## Current schema (verified)

`MenuMeal` (schema.prisma:319-332): `mealType` (MealType enum: BREAKFAST|LUNCH|DINNER|SNACK_1|SNACK_2|SNACK), `plateId String?` → `plate Plate? @relation(...onDelete: SetNull)`, `notes`, `servedAt`, `@@unique([menuDayId, mealType])`. **No inline items — only a nullable plateId FK.**

## Reusable vs Ephemeral (the pivotal schema decision — DEFERRED to propose)

### Option A — Reusable `Snack` entity
New `Snack` table (savable, "Mis Colaciones") + `MenuMeal.snackId String?` FK.
- Shape: `Snack { id, userId, babyProfileId?, name, stageFor?, items: SnackItem[] }`, `SnackItem { snackId, foodId, groupAssignment (HEALTHY_FAT|CEREAL_TUBER|FRUIT) }`.
- **Pros**: mirrors Plate infra (list/reuse/edit), a "Mis Colaciones" catalog, clean relation.
- **Cons**: new table(s), more surface; a `MenuMeal` slot could now carry BOTH plateId AND snackId — need a rule/constraint (a SNACK slot uses snackId, a meal slot uses plateId; enforce so they don't coexist).
- Migration: additive db-push (new tables + nullable FK). Low risk.

### Option B — Ephemeral inline items
Snack foods stored directly on the SNACK-type `MenuMeal`.
- `MenuMeal` today has NO items table → needs a new `MenuMealItem { menuMealId, foodId, groupAssignment }` join table anyway.
- **Pros**: no reusable-catalog bloat; snack lives only where it's used.
- **Cons**: no reuse (re-pick every week); still adds a table; `@@unique([menuDayId, mealType])` stays but items hang off the meal — larger change to the meal-slot upsert.

> Both options require a new table. Reusable adds reuse value for a similar cost. **Product decides in propose.**

## Snack composition — can existing logic drive it?

- `getSnackSuggestions` (apps/api dashboard.service.ts:218-291, PR-9) suggests **5 individual foods** for the dashboard — it is NOT a multi-group composer and does NOT build a snack. Reusable as a *food-picking helper* at best; the age→(grasa/cereal/fruta) composition rule would be NEW logic (likely shared).
- **FoodGroup "grasa" = `HEALTHY_FAT`.** Catalog counts (verified): **HEALTHY_FAT: 20, CEREAL_TUBER: 33, FRUIT: 32** — more than enough to populate 2-3 group snacks.
- Age→composition rules do NOT exist in code yet (getMealSlotsForAge only returns meal SLOTS, not their internal group composition). New shared helper needed, e.g. `getSnackGroupsForAge(months): FoodGroup[]` → `[HEALTHY_FAT, CEREAL_TUBER]` (<13m) / `[HEALTHY_FAT, CEREAL_TUBER, FRUIT]` (≥13m).

## Menu UI un-hide + assignment

- `ACTIVE_MEAL_KEYS` is referenced in 4 files: `mealType.ts` (def + export via `index.ts`), `mealType.test.ts`, and `menuStore.ts`. Un-hiding = the reconciliation point with PR-13. Cleanest path: drive the grid columns off the age-aware `getMealSlotsForAge` (already present) and retire/relax the `ACTIVE_MEAL_KEYS` hard filter — but must check `menuStore.ts` usage before removing.
- Assignment: today `openPicker`→PlateBuilderDrawer→`menuStore.assignPlate`→api meal-slot upsert (takes `plateId`). A snack needs EITHER a different build UI (2-3 group composer) OR reuse of a lightweight food picker; the meal-slot upsert must accept `snackId` (Option A) or items (Option B).

## Blast radius (files) + tests

- **Reusable (A)**: prisma/schema.prisma (Snack + SnackItem + MenuMeal.snackId), packages/shared (Snack types + getSnackGroupsForAge), apps/api (snack service/routes/schemas + meal-slot upsert widening + prisma↔shared sync test), apps/web (snack store/composable + build UI + MenuWeekPage un-hide + optional "Mis Colaciones" page), tests (~12 files incl. menus.service.test.ts, MenuWeekPage.test.ts, menuStore.test.ts + new snack tests).
- **Ephemeral (B)**: similar minus the catalog page, ~10-12 files.

## Open product questions for propose

1. **Reusable vs Ephemeral** (defines the schema).
2. Build UX: auto-compose the snack from suggestions (1 grasa + 1 cereal [+ fruta]) vs manual pick per group?
3. On a SNACK slot, is it plateId-or-snackId (mutually exclusive) — and can a user still drop a full plate on a snack slot, or is it snack-only?
4. Reconcile ACTIVE_MEAL_KEYS vs PR-13 age-aware columns (retire the filter?).
5. Relationship to getSnackSuggestions (PR-9) — reuse or leave as dashboard-only?
6. Does the snack validate composition (enforce grasa+cereal[+fruta] by age) or just suggest it?

## Recommended next step

`sdd-propose` with a product-question round to lock: reusable-vs-ephemeral, build UX, composition-enforcement, and the ACTIVE_MEAL_KEYS reconciliation. Then spec → design → tasks.

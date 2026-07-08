# Proposal: Snack Diary Integration (Serve a Snack from the Menu)

## Intent

The archived **menu-snacks** and **snack-creation-ui** changes closed the *build* and *assign* sides of colaciones: users can create reusable `Snack` entities and assign them to `SNACK_1` / `SNACK_2` slots in the weekly menu. But the loop stops there. A snack sitting in a menu slot cannot be **served**, so it never reaches the bitácora (food diary) from the menu — unlike plates, which have a full plan→serve→track loop.

This is a real, verified gap. `serveMeal` (`apps/api/src/modules/menus/menus.service.ts` ~line 700) reads only `menuMeal.plateId` / `menuMeal.plate` and throws `NotFoundError('No hay plato asignado a esta comida')` when a snack slot is passed. The serve button in `MenuWeekPage.vue` is rendered *inside the assigned-plate block only*, so snack slots show no way to serve. The net effect: you can assign a snack to the plan, but tapping through to "I gave it to my baby" is impossible.

Clinically, colaciones are part of the 10-23m feeding routine and should be logged like any other meal. This change closes the "serve a snack from the menu" gap so a planned snack lands in the diary exactly the way a planned plate does.

Why now: the assignment side already shipped and is on `main`. The serve gap is the single missing link that makes menu snacks actually usable end-to-end. Manual diary logging of snacks and the dashboard display of served-snack logs **already work today** (verified — see Scope Out), so this change is a narrow, high-value delta.

## Scope

### In Scope
- **`FoodLog.snackId String?`** — a nullable FK to `Snack`, mirroring the existing `plateId String?`, with an index. Additive, non-breaking migration. Gives traceability (which snack was served) and distinguishes menu-served snacks from manually-logged loose foods.
- **`serveMeal` snack branch** — extend the *existing* service (`apps/api/src/modules/menus/menus.service.ts#serveMeal`) with a conditional branch: if the slot has `snackId`, fetch `snack.items` and create one `FoodLog` per item with `snackId` set and `plateBalanceLabel` omitted (snacks carry no A/L balance). The `plateId` path is unchanged. If neither is present, throw a clear error covering both cases ("No hay plato ni colación asignada a esta comida").
- **Menu serve button on snack slots** — render the serve button on snack slots in `MenuWeekPage.vue` (desktop + mobile), reusing the already-generic `menuStore.serveMeal` (it takes `dayKey`/`mealKey`, no plate/snack-specific args). Same button copy as plates ("Se lo di ✓" / served state); the slot label already distinguishes the slot type.
- **Diary regression test** — one test that pins the *already-working* behavior: `AddMealModal` exposes `SNACK_1` / `SNACK_2` options for a ≥10m baby, so a future refactor cannot silently drop manual snack logging.

### Out of Scope (deferred / non-goals)
- **Manual diary snack logging.** Already works and is verified: `AddMealModal.vue` uses `getMealTypeOptions(ageInMonths)` (returns `SNACK_1` / `SNACK_2` for ≥10m babies) and the diary API `POST /api/diary` accepts any `MealType`. No UI or API change here — only the regression test above.
- **Dashboard served-snack display.** Already works: `getTodayLogs` does not filter by `mealType`, so served-snack logs appear in `TodayLogsCard` once they can be created. No dashboard change.
- **A dedicated "snacks served today" dashboard card** — future enhancement.
- **Snack-specific analytics** (frequency, acceptance trends beyond the generic diary entry) — future enhancement.
- **Snack reactions / acceptance UX** beyond what the existing generic diary entry already supports.

## Capabilities

### Modified Capabilities
- `weekly-menu` (serve flow): `serveMeal` gains a snack branch so a `SNACK_1` / `SNACK_2` slot with an assigned snack can be served, creating diary entries.
- `food-diary` (data model): `FoodLog` gains an optional `snackId` link so entries created from a menu-served snack are traceable back to their source `Snack`.

## Approach

**Extend, don't fork.** We add a conditional branch to the existing `serveMeal` rather than a separate serve-snack endpoint. The serve flow, permissions, and the generic `menuStore.serveMeal` call stay single-sourced; plates and snacks share one path with one divergence point (which items to fetch, and whether to attach `plateBalanceLabel`). This keeps the well-tested plate path untouched while reusing everything already proven.

**Additive schema.** `FoodLog.snackId String?` mirrors `plateId String?` exactly — nullable, indexed, one migration, no backfill. Existing rows and the plate path are unaffected. The mutual exclusion already enforced on `MenuMeal` (a slot has at most one of `plateId` / `snackId`) guarantees the serve branch is unambiguous.

**Reuse the generic serve button.** `menuStore.serveMeal(dayKey, mealKey)` is already slot-based and plate/snack-agnostic, so the frontend work is purely template: render the same serve button on snack slots. Same copy, same served state — the slot label distinguishes plate vs colación.

**Delivery = 2 chained PRs** on a tracker branch (mirroring menu-snacks / snack-creation-ui), base `release/etapa-10-23-meses`:
- **PR-1 — backend** (~260 lines): `FoodLog.snackId` schema + migration, `serveMeal` snack branch, backend service tests (serve a snack → one FoodLog per item with `snackId`; neither-assigned → clear error; plate path regression-guarded).
- **PR-2 — frontend** (~90 lines): serve button on snack slots in `MenuWeekPage.vue` (desktop + mobile) + component tests, plus the diary `AddMealModal` regression test. Depends on PR-1.

Each PR is autonomous, testable, and independently reversible.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` (`FoodLog`) | Modified | Add `snackId String?` FK to `Snack` + index, mirroring `plateId` |
| `prisma/migrations/*` | New | Additive migration for `FoodLog.snackId` (nullable, no backfill) |
| `apps/api/src/modules/menus/menus.service.ts` (`serveMeal`) | Modified | Add snack branch: fetch `snack.items`, create one `FoodLog` per item with `snackId`, omit `plateBalanceLabel`; clarify the no-assignment error |
| `apps/api/src/modules/menus/*` tests | New/Modified | Serve-a-snack test, neither-assigned error test, plate-path regression guard |
| `apps/web/src/modules/menus/MenuWeekPage.vue` | Modified | Render serve button on snack slots (desktop + mobile), wired to `menuStore.serveMeal` |
| `apps/web/src/modules/menus/*` tests | New/Modified | Snack slot renders serve button + serving a snack calls `serveMeal` |
| `apps/web/src/modules/diary` (`AddMealModal`) | Test only | Regression test: `SNACK_1` / `SNACK_2` options exposed for ≥10m baby |
| `packages/shared` FoodLog response type | Modified (if needed) | Add `snackId` to the diary/FoodLog response type if the shared contract needs it |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Touching the well-tested `serveMeal` regresses the plate serve path | Med | Snack logic is a conditional branch that leaves the plate path byte-for-byte unchanged; add an explicit plate-path regression test in PR-1 alongside the new snack test |
| Migration on `FoodLog` (a hot table) causes issues | Low | Additive nullable column + index only; no backfill, no data rewrite; non-breaking |
| Ambiguity if a slot somehow had both `plateId` and `snackId` | Low | `MenuMeal` mutual exclusion (`upsertMealSlot`) already guarantees at most one; the branch checks `snackId` first, then `plateId`, else clear error |
| `plateBalanceLabel` semantics leak into snack entries | Low | Snack branch omits `plateBalanceLabel` (already nullable); balance is a plate-only concept |
| Shared FoodLog response type drifts from the new column | Low | Add `snackId` to the shared response type in PR-1 if the frontend/type contract reads it |

## Rollback Plan

Revert per PR. PR-2 (frontend) is a template-only, additive change — reverting removes the serve button from snack slots with zero backend impact. PR-1 (backend) reverts the `serveMeal` branch and the `FoodLog.snackId` column via a down-migration; because the column is nullable and additive with no backfill, dropping it is safe (any snack-served rows lose only the traceability link, and the entries themselves — being plain FoodLogs — remain valid). Reverting the tracker branch removes the entire feature with no impact on plate serving or the existing menu snack picker.

## Dependencies

- The archived **menu-snacks** change (backend `Snack` CRUD, shared types/constants, `MenuMeal.snackId`, menu snack picker) — shipped and on `main`.
- The archived **snack-creation-ui** change (create/delete snack UI) — shipped, so a catalog of snacks exists to assign and now serve.
- The existing plate serve flow (`serveMeal`, `menuStore.serveMeal`, the FoodLog `plateId` pattern) — the template this change mirrors.

## Success Criteria

- [ ] From a snack slot in the weekly menu, tapping the serve button creates `FoodLog` entries (one per snack item, each with `snackId` set) for that day + `mealType`.
- [ ] The served state renders on the snack slot (same "Se lo di ✓" affordance as plates).
- [ ] The created entries appear in the bitácora and in the dashboard "today" view (no dashboard/diary code change required).
- [ ] Serving a slot with neither a plate nor a snack assigned returns a clear error ("No hay plato ni colación asignada a esta comida").
- [ ] The existing plate serve path is unaffected (regression test passes).
- [ ] Manual diary snack logging remains available for ≥10m babies (`AddMealModal` regression test passes).

## Future Enhancements (explicit non-goals for this change)

- **"Snacks served today" dashboard card** — a dedicated surface for served colaciones, distinct from `SnackSuggestionCard` (suggestions) and the generic today-logs list.
- **Snack-specific analytics** — served-snack frequency, acceptance trends, and reporting.
- **Snack reactions / acceptance UX** — richer per-snack feedback beyond the generic diary entry.

## Open Questions (for spec/design)

- Confirm whether the shared FoodLog/diary response type must expose `snackId`, or whether it stays a persistence-only column (frontend never reads it in this change).
- Confirm the exact copy for the combined no-assignment error message ("No hay plato ni colación asignada a esta comida" is the working proposal).

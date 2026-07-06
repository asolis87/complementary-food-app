# Proposal: Menu Snacks (Colaciones)

## Intent

Colaciones are clinically required for 10-23m (PDF p.5) but today they can be neither created nor assigned. Two causes: (1) `ACTIVE_MEAL_KEYS` (`mealType.ts:71`) hard-filters the weekly grid to `desayuno/comida/cena`, hiding the snack columns that PR-13's age-aware `getMealSlotsForAge` already emits; (2) `MenuMeal` only links a `plateId` — the plate model (4-5 groups + A/L balance) does not match a snack (2-3 groups, no A/L). We need a first-class, reusable snack.

## Scope

### In Scope (PR-1)
- New reusable `Snack` entity + `SnackItem` (group-tagged foods: HEALTHY_FAT / CEREAL_TUBER / FRUIT) — "Mis Colaciones" catalog data.
- Additive schema: `MenuMeal.snackId?` FK (nullable, `SetNull`) alongside existing `plateId?`.
- Backend: create/list snack, assign snack to a SNACK slot; meal-slot upsert widened to accept `snackId`.
- Slot-type rule: a SNACK slot carries only `snackId`; a meal slot only `plateId` — never both on one slot (enforced in the upsert).
- Un-hide snack columns: drive the grid off `getMealSlotsForAge`, retire/relax `ACTIVE_MEAL_KEYS` so snack slots are assignable.
- Shared helper `getSnackGroupsForAge(months)` → `[HEALTHY_FAT, CEREAL_TUBER]` (<13m) / `+FRUIT` (≥13m).

### Out of Scope (deferred / non-goals)
- "Mis Colaciones" tab UI + snack build-UX polish (later PR — a TAB inside Mis Platos, not a route).
- Composition ENFORCEMENT/blocking (suggest missing groups, allow save anyway — mirrors non-blocking A/L).
- A/L balance or nutrition scoring for snacks; auto-composition; migrating existing data; reworking `getSnackSuggestions` (PR-9, stays dashboard-only).

## Capabilities

### New Capabilities
- `snack-management`: reusable Snack entity, per-group manual build, age-suggested composition, catalog list/create.

### Modified Capabilities
- `weekly-menu-plate-builder`: snack-only slot assignment, un-hidden age-aware snack columns, `snackId` upsert path.

## Approach

Reusable `Snack` (Option A from explore) mirrors Plate infra for reuse. Additive `db-push` (new tables + nullable FK). Composition is per-group manual, suggested-not-enforced. Slots stay `@@unique([menuDayId, mealType])`; the SNACK vs meal distinction gates which FK is set.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `Snack`, `SnackItem`, `MenuMeal.snackId?` |
| `packages/shared` | Modified | Snack types + `getSnackGroupsForAge`; relax `ACTIVE_MEAL_KEYS` |
| `apps/api` | Modified | Snack service/routes/schemas; meal-slot upsert widening; prisma↔shared sync test |
| `apps/web` | Modified | `MenuWeekPage` un-hide + snack assignment path |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `ACTIVE_MEAL_KEYS` removal breaks `menuStore.ts`/tests (4 refs) | Med | Relax, don't delete; update 4 call sites + tests |
| PR-1 exceeds 400-line budget | Med | Forecast in sdd-tasks; split assignment UI to a stacked PR if needed |
| Slot carrying both `plateId` + `snackId` | Low | Enforce mutual exclusion in upsert |

## Rollback Plan

Revert the branch. Schema is additive (nullable FK, new tables) — no destructive `db-push`; dropping the columns/tables is non-breaking to existing plates.

## Dependencies

- Base branch `release/etapa-10-23-meses` (PR-13 age-aware `getMealSlotsForAge` present).

## Success Criteria

- [ ] A user can create a snack (grasa+cereal[+fruta]) and assign it to a SNACK slot in the weekly grid.
- [ ] Snack columns are visible/assignable per age; SNACK slots reject plates and vice versa.
- [ ] Schema change is additive; existing plate assignment is unaffected.

## Open Questions (for spec/design)

- Exact `snackId`-vs-`plateId` mutual-exclusion mechanism (upsert guard vs DB constraint).
- Do SNACK_1 and SNACK_2 both reference the same `Snack` entity type? (Assumed yes.)
- What an un-hidden SNACK slot renders with no snack assigned yet (empty-state affordance).

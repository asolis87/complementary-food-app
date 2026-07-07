# Specification Index — Menu Snacks (Colaciones)

> **Change**: `menu-snacks`  
> **Project**: complementary-food-app (Pakulab monorepo)  
> **Base Branch**: `release/etapa-10-23-meses` (PR-13 merged)  
> **Artifact Store**: openspec  
> **Status**: Approved for design/tasks

---

## Executive Summary

This change introduces **snack (colación) support** for 10-23m babies, addressing a clinical gap. Today, snacks cannot be created or assigned because (1) the weekly grid hard-filters to meal types only, hiding snack columns; (2) the Plate model (4-5 groups + A/L balance) does not match snack composition (2-3 groups, no A/L).

The solution: a new reusable `Snack` entity with per-group manual build (HEALTHY_FAT, CEREAL_TUBER, FRUIT) and an additive `MenuMeal.snackId?` FK. Snack slots (SNACK_1 @ 10-12m; SNACK_1 + SNACK_2 @ 13-23m) are un-hidden in the weekly grid and enforce snack-only assignment (meal slots reject snacks, snack slots reject plates).

**PR-1 Slice**: schema + backend (create/list snack, assign to slot) + un-hide snack slots. Catalog tab UI ("Mis Colaciones") and snack build polish are deferred.

---

## Capabilities Modified

| Capability ID | Name | Type | PR-1 | Spec |
|---------------|------|------|------|------|
| `snack-management` | Snack Management | NEW | ✅ Backend only | [snack-management.md](./snack-management.md) |
| `weekly-menu-plate-builder` | Weekly Menu Plate Builder (Snack Support) | MODIFIED | ✅ Slot un-hide + assignment | [weekly-menu-plate-builder.md](./weekly-menu-plate-builder.md) |

---

## Clinical Rules (Source: PDF p.5)

| Age Range | Main Meal Groups | Colación 1 (Snack 1) | Colación 2 (Snack 2) |
|-----------|------------------|----------------------|----------------------|
| 6-9m | 4 (Cereal+Fruta+Verdura+Proteína) | — | — |
| 10-12m | 4 | Grasa + Cereal (2 groups) | — |
| 13-23m | 5 (adds Grasa) | Grasa + Cereal + Fruta (3 groups) | Grasa + Cereal + Fruta (3 groups) |

**Shared Helper**: `getSnackGroupsForAge(months)` → `[HEALTHY_FAT, CEREAL_TUBER]` (<13m) / `[HEALTHY_FAT, CEREAL_TUBER, FRUIT]` (≥13m).

---

## Schema Changes (Additive)

### New Tables

- **`Snack`**:
  - `id`, `userId`, `babyProfileId?`, `name`, `stageFor?`, `createdAt`, `updatedAt`
  - Relations: `items: SnackItem[]`, `menuMeals: MenuMeal[]`

- **`SnackItem`**:
  - `id`, `snackId`, `foodId`, `groupAssignment` (enum: `HEALTHY_FAT` | `CEREAL_TUBER` | `FRUIT`)

### Modified Tables

- **`MenuMeal`**:
  - Add: `snackId String?` (nullable FK → Snack, `onDelete: SetNull`)
  - Existing: `plateId String?` remains unchanged
  - Constraint: `@@unique([menuDayId, mealType])` unchanged

---

## Key Requirements Summary

### Snack Management (NEW)

| Req ID | Description | PR-1 |
|--------|-------------|------|
| REQ-SM1 | Snack entity shape (`Snack` + `SnackItem`) | ✅ |
| REQ-SM2 | Create snack via manual per-group selection | ✅ |
| REQ-SM3 | List snacks ("Mis Colaciones") with filters | ✅ |
| REQ-SM4 | Age-suggested composition (non-blocking warnings) | ✅ |
| REQ-SM5 | No A/L balance for snacks | ✅ |

### Weekly Menu Plate Builder (MODIFIED)

| Req ID | Description | PR-1 |
|--------|-------------|------|
| REQ-WM1 | Add `MenuMeal.snackId?` FK (additive schema) | ✅ |
| REQ-WM2 | Un-hide snack slots (SNACK_1 @ 10-12m, +SNACK_2 @ 13m+) | ✅ |
| REQ-WM3 | Assign snack to SNACK slot | ✅ |
| REQ-WM4 | Assign plate to meal slot (existing behavior preserved) | ✅ |
| REQ-WM5 | Snack-only slot rule (mutual exclusion: plateId ⊕ snackId) | ✅ |
| REQ-WM6 | Empty-state affordance for unassigned SNACK slots | ✅ |
| REQ-WM7 | Remove/clear snack from slot | ✅ |

---

## Acceptance Scenarios (Representative Examples)

### Scenario: Create and assign a 2-group snack for 11-month-old

- **GIVEN** baby "Tomás" (11 months)
- **WHEN** user creates a snack "Colación Mañana" with items:
  - `{ foodId: "aguacate-123", groupAssignment: "HEALTHY_FAT" }`
  - `{ foodId: "avena-456", groupAssignment: "CEREAL_TUBER" }`
- **AND** assigns it to `SNACK_1` on menu day "2026-07-07"
- **THEN** the snack is saved with `id`, `name`, `userId`, `babyProfileId`, and 2 `SnackItem` records
- **AND** `MenuMeal` for day "2026-07-07" has `mealType = SNACK_1`, `snackId = snack-id`, `plateId = null`
- **AND** the weekly grid displays "Colación Mañana" in the SNACK_1 column for that day

### Scenario: SNACK slot rejects a Plate assignment

- **GIVEN** menu day "2026-07-07" for baby "Ana" (15 months)
- **WHEN** user attempts to assign a `Plate` (plateId: "plate-456") to `SNACK_1`
- **THEN** the API returns `400 Bad Request` with error: "SNACK_1 slot cannot accept a Plate; use a Snack instead"
- **AND** the `MenuMeal` is NOT created/updated

### Scenario: Meal slot rejects a Snack assignment

- **GIVEN** menu day "2026-07-07"
- **WHEN** user attempts to assign a `Snack` (snackId: "snack-789") to `LUNCH`
- **THEN** the API returns `400 Bad Request` with error: "LUNCH slot cannot accept a Snack; use a Plate instead"

### Scenario: Baby 8 months sees no snack columns

- **GIVEN** baby "Luis" (8 months)
- **WHEN** the weekly menu grid renders
- **THEN** only BREAKFAST, LUNCH, DINNER columns are visible
- **AND** no snack columns appear (per clinical rules: snacks start at 10m)

### Scenario: Snack with missing suggested group saves with warning

- **GIVEN** baby "Tomás" (11 months) → suggested groups: `[HEALTHY_FAT, CEREAL_TUBER]`
- **WHEN** user creates a snack with only `[{ groupAssignment: "HEALTHY_FAT" }]` (missing CEREAL_TUBER)
- **THEN** the snack is saved successfully
- **AND** API response includes: `warnings: ["Suggested group CEREAL_TUBER is missing"]`
- **AND** save is NOT blocked

---

## Locked Decisions (From Proposal)

1. **Reusable `Snack` entity** (Option A) over ephemeral inline items — mirrors Plate infra for reuse.
2. **Manual per-group build** — user picks each group's food (grasa, cereal, fruta); no auto-composition.
3. **Composition SUGGESTED not ENFORCED** — recommend age-appropriate groups, warn if missing, allow save anyway.
4. **Snack-only slots** — SNACK slot accepts only a Snack; meal slot only a Plate. Never both on one slot.
5. **No A/L balance for snacks** — only group composition matters; no nutrition scoring.
6. **"Mis Colaciones" = TAB inside Mis Platos** — not a separate route (deferred to later PR).
7. **PR-1 slice** = schema + backend (create/list snack, assign to slot) + un-hide snack slots. Catalog tab UI + build polish deferred.

---

## Out of Scope (Deferred / Non-Goals)

### Deferred to Later PRs

- **"Mis Colaciones" Tab UI**: the catalog tab inside "Mis Platos" to browse/manage snacks
- **Snack Build UX Polish**: per-group food picker with composition suggestion badges
- **Snack Picker Drawer**: the UI to select an existing snack when assigning to a slot
- **Drag-and-Drop**: dragging snacks from catalog to grid
- **Bulk Assignment**: assigning the same snack to multiple days/slots

### Non-Goals (Not Planned)

- **Composition Enforcement**: blocking save if groups don't match suggested composition
- **A/L Balance or Nutrition Scoring**: snacks have no `balanceScore` or macro tracking
- **Auto-Composition**: system does NOT auto-fill snack items from suggestions
- **Migrating Existing Data**: no backfill of historical menu data
- **Reworking `getSnackSuggestions`**: PR-9's dashboard-only helper stays unchanged

---

## Risk and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `ACTIVE_MEAL_KEYS` removal breaks `menuStore.ts`/tests | Med | Low | Relax, don't delete; update 4 call sites + tests in same PR |
| Slot carrying both `plateId` + `snackId` | Low | Med | Enforce mutual exclusion in API upsert validation |
| PR-1 exceeds 400-line budget | Med | Low | Forecast in sdd-tasks; split assignment UI to stacked PR if needed |

---

## Dependencies

- **Base Branch**: `release/etapa-10-23-meses` (requires PR-13's `getMealSlotsForAge`)
- **External**: None (no new third-party libraries)

---

## Success Criteria

- [ ] A user can create a snack (grasa+cereal[+fruta]) via API and it saves to "Mis Colaciones"
- [ ] Snack columns (SNACK_1 @ 10-12m; +SNACK_2 @ 13m+) are visible in the weekly grid per baby's age
- [ ] A snack can be assigned to a SNACK slot via API; a plate can be assigned to a meal slot
- [ ] SNACK slots reject plates; meal slots reject snacks (mutual exclusion enforced)
- [ ] Schema change is additive; existing plate assignment is unaffected
- [ ] `getSnackGroupsForAge` returns correct groups for 8m, 11m, 15m test cases
- [ ] Snack with missing/extra groups saves with warnings (non-blocking)

---

## Related Files

- **Proposal**: [`openspec/changes/menu-snacks/proposal.md`](../proposal.md)
- **Exploration**: [`openspec/changes/menu-snacks/explore.md`](../explore.md)
- **Specs**:
  - [snack-management.md](./snack-management.md) — Snack entity, create, list, age-suggested composition
  - [weekly-menu-plate-builder.md](./weekly-menu-plate-builder.md) — Slot un-hide, assignment, mutual exclusion

---

## Next Steps

1. **Design Phase** (`sdd-design`): file structure, API routes/schemas, shared helpers, test strategy
2. **Tasks Phase** (`sdd-tasks`): break down into work units (schema, backend, frontend, tests)
3. **Apply Phase** (`sdd-apply`): implement in PR-1 (backend + schema + un-hide)
4. **Verify Phase** (`sdd-verify`): validate against these specs

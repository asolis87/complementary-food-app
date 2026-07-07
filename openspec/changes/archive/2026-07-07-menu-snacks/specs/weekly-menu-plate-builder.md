# Spec: Weekly Menu Plate Builder — Snack Support (MODIFIED Capability)

> **Why**: `MenuWeekPage` today hard-filters the weekly grid to `['desayuno','comida','cena']` (via `ACTIVE_MEAL_KEYS`), hiding snack columns that `getMealSlotsForAge` already emits. This delta spec un-hides snack slots and allows assignment of `Snack` entities to them.
>
> **Scope**: PR-1. Reconciles the `ACTIVE_MEAL_KEYS` filter with PR-13's age-aware slot logic; adds `MenuMeal.snackId?` FK; enforces snack-only slot rules.
>
> **Source**: `proposal.md` §In Scope + locked decisions.

---

## Capability: Weekly Menu Plate Builder (MODIFIED)

The weekly menu grid displays meal slots based on the baby's age (via `getMealSlotsForAge`). This change un-hides snack slots (SNACK_1 for 10-12m; SNACK_1 + SNACK_2 for 13-23m) and enables assignment of `Snack` entities to them. A slot SHALL carry either a `plateId` (meal slots) OR a `snackId` (snack slots), never both.

---

## REQ-WM1: MenuMeal.snackId FK (Schema Addition)

The system SHALL add a nullable `snackId` foreign key to the `MenuMeal` table:

- `MenuMeal`:
  - `snackId: String?` (nullable FK → Snack, `onDelete: SetNull`)
  - Existing: `plateId: String?` (nullable FK → Plate, `onDelete: SetNull`)

The schema SHALL maintain the existing `@@unique([menuDayId, mealType])` constraint.

### Scenario: Schema migration is additive

- GIVEN existing `MenuMeal` table with `plateId?` FK
- WHEN `snackId?` FK is added via `db push`
- THEN the migration is additive (no data loss)
- AND existing meal slots with `plateId` are unaffected
- AND new slots can use `snackId` going forward

---

## REQ-WM2: Snack Slots Visible and Assignable

The system SHALL display snack slots in the weekly menu grid based on the baby's age, using the existing `getMealSlotsForAge` logic.

**Age-Aware Slot Logic (already exists in `getMealSlotsForAge`):**
- Age < 10m: no snack slots
- Age 10-12m: `SNACK_1` slot visible
- Age ≥ 13m: `SNACK_1` and `SNACK_2` slots visible

The UI SHALL retire or relax the `ACTIVE_MEAL_KEYS = ['desayuno','comida','cena']` hard filter in `MenuWeekPage.vue` so that snack columns are rendered.

### Scenario: Baby 11 months sees SNACK_1 column

- GIVEN baby profile "Tomás" (11 months)
- WHEN `MenuWeekPage` renders the weekly grid
- THEN the grid includes columns: BREAKFAST, SNACK_1, LUNCH, DINNER
- AND `SNACK_1` column is visible and assignable

### Scenario: Baby 15 months sees SNACK_1 and SNACK_2 columns

- GIVEN baby profile "Ana" (15 months)
- WHEN the weekly grid renders
- THEN the grid includes: BREAKFAST, SNACK_1, LUNCH, SNACK_2, DINNER
- AND both snack columns are visible

### Scenario: Baby 8 months sees no snack columns

- GIVEN baby profile "Luis" (8 months)
- WHEN the weekly grid renders
- THEN the grid includes: BREAKFAST, LUNCH, DINNER
- AND no snack columns are visible (per clinical rules)

---

## REQ-WM3: Assign Snack to SNACK Slot

The system SHALL allow a user to assign a `Snack` entity to a SNACK slot in the weekly menu.

**API Contract (Modified Meal Slot Upsert):**
- `POST /api/menu-days/:menuDayId/meals` (or equivalent upsert endpoint)
- Request body (for snack assignment):
  ```json
  {
    "mealType": "SNACK_1",
    "snackId": "snack-789",
    "plateId": null
  }
  ```
- Response: `200 OK` with updated `MenuMeal` (including `snackId`)

The API SHALL accept **either** `plateId` **or** `snackId`, never both on the same slot.

### Scenario: Assign a snack to SNACK_1 slot

- GIVEN menu day "2026-07-07" for baby "Tomás" (11 months)
- WHEN the user assigns snack "Colación Mañana" (snack-789) to `SNACK_1`
- THEN the API creates/updates `MenuMeal` with:
  - `menuDayId`: "day-123"
  - `mealType`: `SNACK_1`
  - `snackId`: "snack-789"
  - `plateId`: `null`
- AND the response returns `200 OK` with the updated `MenuMeal`

### Scenario: Assign a snack to SNACK_2 slot (13-23m baby)

- GIVEN baby "Ana" (15 months) with menu day "2026-07-07"
- WHEN the user assigns snack "Colación Tarde" to `SNACK_2`
- THEN the API creates/updates `MenuMeal` with `mealType = SNACK_2`, `snackId` set, `plateId = null`

---

## REQ-WM4: Assign Plate to Meal Slot (Existing Behavior Preserved)

The system SHALL continue to allow assignment of `Plate` entities to meal slots (BREAKFAST, LUNCH, DINNER).

**API Contract (Unchanged):**
- Request body (for meal assignment):
  ```json
  {
    "mealType": "LUNCH",
    "plateId": "plate-456",
    "snackId": null
  }
  ```

### Scenario: Assign a plate to LUNCH slot

- GIVEN menu day "2026-07-07"
- WHEN the user assigns plate "Pollo con Arroz" (plate-456) to `LUNCH`
- THEN the API updates `MenuMeal` with:
  - `mealType`: `LUNCH`
  - `plateId`: "plate-456"
  - `snackId`: `null`
- AND existing plate assignment behavior is unaffected

---

## REQ-WM5: Snack-Only Slot Rule (Mutual Exclusion)

The system SHALL enforce that a SNACK slot (SNACK_1, SNACK_2) can ONLY carry a `snackId`, and a meal slot (BREAKFAST, LUNCH, DINNER) can ONLY carry a `plateId`. A slot SHALL NOT have both `plateId` and `snackId` set simultaneously.

**Validation Logic:**
- If `mealType` is `SNACK_1` or `SNACK_2`:
  - `snackId` MAY be set
  - `plateId` MUST be `null`
  - If `plateId` is provided, return `400 Bad Request`
- If `mealType` is `BREAKFAST`, `LUNCH`, or `DINNER`:
  - `plateId` MAY be set
  - `snackId` MUST be `null`
  - If `snackId` is provided, return `400 Bad Request`

### Scenario: SNACK slot rejects a Plate assignment

- GIVEN menu day "2026-07-07" for baby "Tomás" (11 months)
- WHEN the user attempts to assign a `Plate` (plateId: "plate-456") to `SNACK_1`
- THEN the API returns `400 Bad Request` with error: "SNACK_1 slot cannot accept a Plate; use a Snack instead"
- AND the `MenuMeal` is NOT created/updated

### Scenario: Meal slot rejects a Snack assignment

- GIVEN menu day "2026-07-07"
- WHEN the user attempts to assign a `Snack` (snackId: "snack-789") to `LUNCH`
- THEN the API returns `400 Bad Request` with error: "LUNCH slot cannot accept a Snack; use a Plate instead"
- AND the `MenuMeal` is NOT updated

### Scenario: SNACK slot with both plateId and snackId fails validation

- GIVEN a malformed request with `mealType: "SNACK_1"`, `plateId: "plate-123"`, `snackId: "snack-456"`
- WHEN the API validates the request
- THEN it returns `400 Bad Request` with error: "A slot cannot have both plateId and snackId"
- AND neither FK is saved

---

## REQ-WM6: Empty-State Affordance for Unassigned SNACK Slots

The system SHALL render an empty-state affordance (e.g., "+ Agregar Colación" button or placeholder) for SNACK slots that are visible but have no snack assigned.

### Scenario: Unassigned SNACK_1 slot shows affordance

- GIVEN baby "Tomás" (11 months) with menu day "2026-07-07"
- AND `SNACK_1` slot exists but `snackId = null`
- WHEN `MenuWeekPage` renders
- THEN the `SNACK_1` cell displays an empty-state affordance (e.g., "+ Agregar Colación" button)
- AND clicking it opens a snack picker/builder (UI deferred, but affordance is present)

### Scenario: Assigned SNACK slot displays snack name

- GIVEN `SNACK_1` slot with `snackId = "snack-789"` (name: "Colación Mañana")
- WHEN the grid renders
- THEN the `SNACK_1` cell displays "Colación Mañana"
- AND clicking it allows editing/removing the snack

---

## REQ-WM7: Remove/Clear Snack from Slot

The system SHALL allow a user to remove an assigned snack from a SNACK slot.

**API Contract:**
- `DELETE /api/menu-days/:menuDayId/meals?mealType=SNACK_1` (or equivalent)
- OR: `POST /api/menu-days/:menuDayId/meals` with `{ mealType: "SNACK_1", snackId: null, plateId: null }`

### Scenario: Remove snack from SNACK_1 slot

- GIVEN `MenuMeal` with `mealType = SNACK_1`, `snackId = "snack-789"`
- WHEN the user removes the snack
- THEN the API sets `snackId = null`
- AND the slot becomes empty (shows empty-state affordance again)

---

## Out of Scope — Weekly Menu Plate Builder (Deferred)

- **Snack Picker UI**: the drawer/modal to browse and select snacks from "Mis Colaciones" — PR-1 provides backend only
- **Snack Builder Integration**: the UI to create a new snack inline while assigning to a slot — deferred
- **Drag-and-Drop**: dragging a snack from the catalog to a slot — deferred
- **Bulk Assignment**: assigning the same snack to multiple days/slots at once
- **Slot Notes for Snacks**: `MenuMeal.notes` field works today; no new behavior needed (out of scope means no new spec requirement)
- **Snack Swap**: swapping SNACK_1 ↔ SNACK_2 directly in the grid — deferred
- **Mobile Responsive Grid**: snack column display on mobile — deferred (assumes desktop-first per existing UI)

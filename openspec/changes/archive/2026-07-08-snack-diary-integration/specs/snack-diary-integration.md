# Spec: Snack Diary Integration (MODIFIED Capabilities)

> **Why**: menu-snacks and snack-creation-ui shipped the build + assign loop for snacks, but the serve path stops at plates. `serveMeal` errors on snack slots ("No hay plato asignado..."), and the menu serve button is template-guarded to plate slots only. This delta closes the "serve a snack from the menu" gap so planned snacks reach the bitácora like planned plates do.
>
> **Scope**: Extend existing `serveMeal` service (conditional snack branch), add `FoodLog.snackId` FK, render serve button on snack slots. Manual diary snack logging + dashboard display already work (regression-tested only).
>
> **Source**: `proposal.md` §In Scope + LOCKED decisions + verified exploration (id 2250).

---

## Capability: Food Diary (MODIFIED)

Delta adds `FoodLog.snackId` FK to mirror the existing `plateId` pattern, enabling traceability for menu-served snacks distinct from manually-logged loose foods.

---

## Capability: Weekly Menu (MODIFIED — Serve Flow)

Delta extends the existing `serveMeal` service with a conditional snack branch so a SNACK_1 / SNACK_2 slot with an assigned snack can be served, creating diary entries (one `FoodLog` per snack item, each with `snackId` set).

---

## ADDED Requirements

### REQ-SD1: FoodLog.snackId FK (Schema Addition)

The system SHALL add a nullable `snackId` foreign key to the `FoodLog` table:

- `FoodLog`:
  - `snackId: String?` (nullable FK → Snack, `onDelete: SetNull`)
  - `@@index([snackId])`
  - Existing: `plateId: String?` (nullable FK → Plate, `onDelete: SetNull`)

The schema SHALL maintain all existing constraints. The migration is additive and non-breaking (nullable column, no backfill).

#### Scenario: Schema migration is additive

- GIVEN existing `FoodLog` table with `plateId?` FK
- WHEN `snackId?` FK is added via migration
- THEN the migration is additive (no data loss, no backfill)
- AND existing rows with `plateId` are unaffected
- AND new rows can use `snackId` going forward

#### Scenario: FoodLog can have EITHER plateId OR snackId, not both

- GIVEN a FoodLog entry being created
- WHEN `plateId` is set
- THEN `snackId` MUST be `null`
- WHEN `snackId` is set
- THEN `plateId` MUST be `null`
- AND a FoodLog with both non-null SHALL NOT be created by the system

---

### REQ-SD2: Serve Snack from Menu Slot (Backend — serveMeal Extension)

The system SHALL extend the existing `serveMeal` service (`apps/api/src/modules/menus/menus.service.ts#serveMeal`) to handle snack slots.

**Extended Service Logic:**
- If `menuMeal.snackId` is non-null:
  - Fetch `snack.items` (including `snack.items.food`)
  - For each `SnackItem`, create one `FoodLog` with:
    - `foodId` = item's foodId
    - `mealType` = slot's mealType (SNACK_1 or SNACK_2)
    - `snackId` = menuMeal's snackId
    - `plateId` = `null`
    - `plateBalanceLabel` = `null` (snacks have no A/L balance)
  - Set `MenuMeal.servedAt` = now
  - Soft-delete prior FoodLog entries for that date + mealType (replace pattern, same as plates)
- If `menuMeal.plateId` is non-null:
  - Existing plate logic unchanged (fetch `plate.items`, create FoodLog with `plateId`, set `plateBalanceLabel`)
- If BOTH `snackId` and `plateId` are null:
  - Throw `NotFoundError("No hay plato ni colación asignada a esta comida")`

**Ownership + Force Re-Serve:**
- Snack ownership: `snack.userId` MUST match the requesting user (mirror plate ownership check)
- Already-served behavior: if `MenuMeal.servedAt` is non-null AND `force` param is false → return `409 Conflict`
- Force re-serve: if `force` param is true → replace prior logs (same as plate path)

#### Scenario: Serve a 2-item snack creates 2 FoodLog entries

- GIVEN menu day "2026-07-07" for baby "Tomás" (11 months)
- AND SNACK_1 slot has `snackId = "snack-123"` (Snack with 2 items: Aguacate, Avena)
- WHEN the user serves SNACK_1
- THEN `serveMeal` fetches `snack-123.items`
- AND creates 2 FoodLog entries:
  - Entry 1: `foodId = "aguacate-food-id"`, `mealType = SNACK_1`, `snackId = "snack-123"`, `plateId = null`, `plateBalanceLabel = null`
  - Entry 2: `foodId = "avena-food-id"`, `mealType = SNACK_1`, `snackId = "snack-123"`, `plateId = null`, `plateBalanceLabel = null`
- AND sets `MenuMeal.servedAt` to current timestamp
- AND returns `200 OK` with the updated `MenuMeal`

#### Scenario: Serve a 3-item snack creates 3 FoodLog entries

- GIVEN SNACK_2 slot has `snackId = "snack-456"` (Snack with 3 items: Aguacate, Avena, Manzana)
- WHEN the user serves SNACK_2
- THEN 3 FoodLog entries are created (one per item)
- AND each has `snackId = "snack-456"`, `plateId = null`, `plateBalanceLabel = null`

#### Scenario: Serve snack with neither plate nor snack assigned returns clear error

- GIVEN menu day "2026-07-07" SNACK_1 slot with `plateId = null` AND `snackId = null`
- WHEN the user attempts to serve SNACK_1
- THEN the API returns `404 Not Found` with error: "No hay plato ni colación asignada a esta comida"
- AND no FoodLog entries are created

#### Scenario: Serve snack with invalid ownership fails

- GIVEN SNACK_1 slot with `snackId = "snack-789"` owned by user "user-A"
- WHEN user "user-B" attempts to serve the slot
- THEN the API returns `403 Forbidden` with error: "Snack does not belong to the requesting user"
- AND no FoodLog entries are created

---

### REQ-SD3: Serve Replace + Force Re-Serve for Snacks

The system SHALL apply the same replace-and-force logic for snack serves as for plate serves.

**Replace Pattern:**
- Before creating new FoodLog entries, soft-delete (or hard-delete) any existing FoodLog entries for the same date + mealType
- This ensures re-serving a slot replaces prior logs (not duplicates)

**Force Re-Serve:**
- If `MenuMeal.servedAt` is non-null AND `force` param is false → return `409 Conflict` with message "Esta comida ya fue servida. Usa force=true para reemplazar."
- If `force` param is true → proceed with replace pattern (clear prior logs, create new ones, update `servedAt`)

#### Scenario: Re-serve snack without force returns conflict

- GIVEN SNACK_1 slot has `snackId = "snack-123"` and `servedAt = 2026-07-07T08:00:00Z`
- WHEN the user attempts to serve SNACK_1 again without `force=true`
- THEN the API returns `409 Conflict` with error: "Esta comida ya fue servida. Usa force=true para reemplazar."
- AND no new FoodLog entries are created

#### Scenario: Re-serve snack with force replaces prior logs

- GIVEN SNACK_1 slot served at 08:00 with 2 FoodLog entries (Aguacate, Avena)
- WHEN the user re-serves SNACK_1 with `force=true` and the snack now has 3 items (Aguacate, Avena, Plátano)
- THEN the 2 prior FoodLog entries are soft-deleted
- AND 3 new FoodLog entries are created (Aguacate, Avena, Plátano)
- AND `MenuMeal.servedAt` is updated to the new timestamp

---

### REQ-SD4: Empty Snack (Zero Items) Behavior

The system SHALL mirror the empty-plate behavior for snacks with zero items.

**Logic:**
- If a snack has zero items (`snack.items.length === 0`), the serve action SHALL either:
  - Return an error ("La colación no tiene alimentos asignados"), OR
  - Succeed as a no-op (set `servedAt` but create no FoodLog entries)
- **Decision (locked per proposal):** Return an error (mirror empty-plate rule in existing `serveMeal`)

#### Scenario: Serve empty snack returns error

- GIVEN SNACK_1 slot has `snackId = "snack-empty"` (Snack with 0 items)
- WHEN the user attempts to serve SNACK_1
- THEN the API returns `400 Bad Request` with error: "La colación no tiene alimentos asignados"
- AND no FoodLog entries are created
- AND `MenuMeal.servedAt` remains null

---

### REQ-SD5: Plate Serve Path Unchanged (Regression)

The system SHALL preserve the existing plate serve logic byte-for-byte in `serveMeal`.

**Regression Guard:**
- If `menuMeal.plateId` is non-null, the snack logic SHALL NOT execute
- Plate serves SHALL create FoodLog entries with `plateId` set, `snackId = null`, `plateBalanceLabel` set (as before)
- The conditional snack branch SHALL NOT affect plate serving in any way

#### Scenario: Serve plate slot behaves exactly as before

- GIVEN LUNCH slot has `plateId = "plate-456"` (Plate with 5 items + balanceScore)
- WHEN the user serves LUNCH
- THEN `serveMeal` fetches `plate-456.items`
- AND creates 5 FoodLog entries, each with `plateId = "plate-456"`, `snackId = null`, `plateBalanceLabel = "ALMUERZO_1"` (example)
- AND sets `MenuMeal.servedAt`
- AND existing plate serve behavior is unaffected

#### Scenario: Snack logic does not execute on plate slots

- GIVEN LUNCH slot has `plateId = "plate-456"`, `snackId = null`
- WHEN the user serves LUNCH
- THEN the code path checks `menuMeal.plateId` first
- AND the snack branch (`if (menuMeal.snackId)`) is never entered
- AND plate logic executes as normal

---

### REQ-SD6: Serve Button on Snack Slots (Frontend)

The system SHALL render a serve button on snack slots in the weekly menu (`MenuWeekPage.vue`), reusing the existing `menuStore.serveMeal(dayKey, mealKey)` call.

**UI Contract:**
- The serve button SHALL be rendered on SNACK_1 and SNACK_2 slots when a snack is assigned (desktop + mobile)
- Button text: "Se lo di" (or existing serve button copy — match plate slots)
- Served state: same visual affordance as plates ("Se lo di ✓" or equivalent)
- The button calls `menuStore.serveMeal(dayKey, mealKey)`, which is already slot-based and plate/snack-agnostic

#### Scenario: Assigned snack slot renders serve button

- GIVEN SNACK_1 slot has `snackId = "snack-123"` (name: "Colación Mañana")
- AND the slot is NOT yet served (`servedAt = null`)
- WHEN `MenuWeekPage` renders
- THEN the SNACK_1 cell displays the snack name "Colación Mañana"
- AND a "Se lo di" button is visible (desktop + mobile)
- AND clicking the button calls `menuStore.serveMeal(dayKey, 'snack_1')`

#### Scenario: Served snack slot shows served state

- GIVEN SNACK_1 slot has `snackId = "snack-123"` and `servedAt = 2026-07-07T08:00:00Z`
- WHEN `MenuWeekPage` renders
- THEN the SNACK_1 cell displays "Se lo di ✓" (or equivalent served affordance)
- AND the serve button is either disabled, hidden, or styled as served (match plate behavior)

#### Scenario: Empty snack slot shows no serve button

- GIVEN SNACK_1 slot has `snackId = null`
- WHEN `MenuWeekPage` renders
- THEN no serve button is visible (only the empty-state affordance "+ Agregar Colación")

#### Scenario: Serve button triggers serve API call

- GIVEN SNACK_1 slot has `snackId = "snack-123"` and `servedAt = null`
- WHEN the user clicks the "Se lo di" button
- THEN `menuStore.serveMeal(dayKey, 'snack_1')` is called
- AND the API `POST /api/menus/:menuId/meals/serve` is invoked with `{ dayKey, mealType: 'snack_1' }`
- AND on success, the slot updates to served state

---

### REQ-SD7: Served Snack Appears in Bitácora + Dashboard

The system SHALL surface served-snack FoodLog entries in the diary and dashboard via the existing `getTodayLogs` query (no new query needed).

**Wiring Contract:**
- The diary `DiarySummary` and `AddMealModal` SHALL NOT filter by `mealType`, so SNACK_1 / SNACK_2 entries appear naturally
- The dashboard `getTodayLogs` service (already does NOT filter by `mealType`) returns snack entries in `todayLogs`
- The dashboard `TodayLogsCard` SHALL render served-snack entries (grouped by `mealType`)

#### Scenario: Served snack appears in diary for that day

- GIVEN user served SNACK_1 on 2026-07-07 with 2 foods (Aguacate, Avena)
- WHEN the user views the diary for 2026-07-07
- THEN the diary displays 2 entries under SNACK_1 (or "Colación 1" label):
  - Entry 1: Aguacate
  - Entry 2: Avena
- AND each entry shows `snackId` link (if the UI reads it) or just the food name

#### Scenario: Served snack appears in dashboard today view

- GIVEN user served SNACK_1 today with 2 foods
- WHEN the user views the dashboard
- THEN `getTodayLogs` returns the 2 FoodLog entries with `mealType = SNACK_1`
- AND `TodayLogsCard` displays them under the SNACK_1 slot
- AND they appear alongside breakfast/lunch/dinner entries (no special handling)

#### Scenario: getTodayLogs includes snack entries without code change

- GIVEN the existing `getTodayLogs` query does NOT filter by `mealType`
- WHEN a FoodLog entry is created with `mealType = SNACK_1`
- THEN `getTodayLogs` returns it in the `todayLogs` array
- AND no query modification is required for this change

---

## MODIFIED Requirements

### REQ-SD8: Manual Diary Snack Logging (Regression Test)

The system SHALL continue to expose `SNACK_1` and `SNACK_2` options in the diary `AddMealModal` for babies ≥10 months, so manual snack logging remains available.

**Regression Guard:**
- The `AddMealModal` uses `getMealTypeOptions(ageInMonths)`, which returns age-aware slots
- For babies ≥10m, `getMealTypeOptions` SHALL include `SNACK_1` and `SNACK_2` (or `SNACK_1` only for 10-12m)
- The diary API `POST /api/diary` SHALL accept `mealType: SNACK_1 | SNACK_2` (unchanged)

This requirement is MODIFIED (confirmed / regression-tested) rather than ADDED because the functionality already exists and MUST NOT regress.

#### Scenario: AddMealModal exposes SNACK_1 for 11-month-old baby

- GIVEN baby profile "Tomás" (11 months)
- WHEN the user opens `AddMealModal` to log a meal manually
- THEN `getMealTypeOptions(11)` returns options including `SNACK_1`
- AND the user can select `SNACK_1` from the "Tipo de comida" dropdown

#### Scenario: AddMealModal exposes SNACK_1 and SNACK_2 for 15-month-old baby

- GIVEN baby profile "Ana" (15 months)
- WHEN the user opens `AddMealModal`
- THEN `getMealTypeOptions(15)` returns options including `SNACK_1` and `SNACK_2`
- AND both are selectable

#### Scenario: AddMealModal does NOT expose snack options for 8-month-old baby

- GIVEN baby profile "Luis" (8 months)
- WHEN the user opens `AddMealModal`
- THEN `getMealTypeOptions(8)` does NOT include `SNACK_1` or `SNACK_2`
- AND only BREAKFAST, LUNCH, DINNER are available

#### Scenario: Manual snack logging via diary API succeeds

- GIVEN a user manually logs a snack via `POST /api/diary`
- WHEN the request body includes `{ mealType: "SNACK_1", foodId: "aguacate-123", ... }`
- THEN the API creates a FoodLog entry with `mealType = SNACK_1`, `snackId = null`, `plateId = null`
- AND the entry appears in the diary and dashboard (manual log, not menu-served)

---

## REMOVED Requirements

_None. This is an additive + extension change._

---

## RENAMED Requirements

_None._

---

## Out of Scope (Explicit Non-Goals)

- **Dedicated dashboard served-snack card**: A separate "Snacks served today" card distinct from `SnackSuggestionCard` (suggestions) and the generic `TodayLogsCard` — future enhancement.
- **Snack-specific analytics**: Served-snack frequency, acceptance trends, and reporting beyond the generic diary entry.
- **Snack reactions / acceptance UX**: Richer per-snack feedback beyond what the existing generic diary entry already supports.
- **Backend changes to GET /api/snacks or diary response types**: The `FoodLog` response type MAY expose `snackId` if the frontend needs it, but reading `snackId` from the frontend is optional in this change (traceability only).
- **Snack editing after served**: Once served, the FoodLog entries are immutable (same as plate serves).
- **Snack serve history / audit trail**: No dedicated "what snacks were served this week" query beyond the existing diary queries.

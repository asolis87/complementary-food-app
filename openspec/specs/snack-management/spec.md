# Spec: Snack Management (NEW Capability)

> **Why**: Colaciones are clinically required for 10-23m (PDF p.5) but cannot be created or assigned today. This capability introduces a reusable `Snack` entity with per-group manual build and age-suggested composition.
>
> **Scope**: PR-1 (backend + schema). Catalog tab UI deferred to later PR.
>
> **Source**: `proposal.md` §Scope + locked decisions from orchestrator.

---

## Capability: Snack Management (NEW)

A snack is a reusable entity similar to a Plate, but with different composition rules: 2-3 food groups (HEALTHY_FAT, CEREAL_TUBER, FRUIT) instead of 4-5 groups, and no A/L balance scoring. Snacks are manually built per group and stored in "Mis Colaciones" for reuse across menu weeks.

---

## REQ-SM1: Snack Entity Shape

The system SHALL define a `Snack` entity with the following schema:

- `Snack`:
  - `id: String` (PK)
  - `userId: String` (FK → User)
  - `babyProfileId: String?` (nullable FK → BabyProfile)
  - `name: String` (user-defined name for the snack)
  - `stageFor: PlateStage?` (nullable enum: `SIX_TO_NINE_MONTHS` | `TEN_TO_TWELVE_MONTHS` | `THIRTEEN_TO_TWENTY_THREE_MONTHS` | `FAMILY_TABLE`)
  - `createdAt: DateTime`
  - `updatedAt: DateTime`
  - `items: SnackItem[]` (one-to-many relation)

- `SnackItem`:
  - `id: String` (PK)
  - `snackId: String` (FK → Snack)
  - `foodId: String` (FK → Food)
  - `groupAssignment: FoodGroup` (enum limited to: `HEALTHY_FAT` | `CEREAL_TUBER` | `FRUIT`)

### Scenario: Snack schema is additive to existing Plate infra

- GIVEN `prisma/schema.prisma` with existing `Plate`, `PlateItem`, `MenuMeal.plateId?`
- WHEN `Snack` and `SnackItem` tables are added
- THEN the migration is additive (no destructive changes)
- AND existing `Plate` and `MenuMeal` functionality is unaffected

### Scenario: SnackItem.groupAssignment is limited to snack-valid groups

- GIVEN a new `SnackItem` being created
- WHEN `groupAssignment` is set
- THEN it MUST be one of: `HEALTHY_FAT`, `CEREAL_TUBER`, `FRUIT`
- AND attempting to assign `PROTEINS`, `VEGETABLES`, or `DAIRY` SHALL fail validation

---

## REQ-SM2: Create Snack via Manual Per-Group Selection

The system SHALL provide an API endpoint to create a snack by manually selecting foods for each required group.

**API Contract:**
- `POST /api/snacks`
- Request body:
  ```json
  {
    "name": "Colación Mañana",
    "babyProfileId": "profile-123",
    "stageFor": "TEN_TO_TWELVE_MONTHS" | null,
    "items": [
      { "foodId": "food-456", "groupAssignment": "HEALTHY_FAT" },
      { "foodId": "food-789", "groupAssignment": "CEREAL_TUBER" }
    ]
  }
  ```
- Response: `201 Created` with the created `Snack` object (including `id` and `createdAt`)

### Scenario: Create a 2-group snack (10-12m typical)

- GIVEN baby profile "Tomás" (11 months)
- WHEN the user creates a snack with:
  - name: "Colación Mañana"
  - items: [{ foodId: "aguacate-123", groupAssignment: "HEALTHY_FAT" }, { foodId: "avena-456", groupAssignment: "CEREAL_TUBER" }]
- THEN the snack is saved with `id`, `userId`, `babyProfileId`, `name`, and 2 `SnackItem` records
- AND the API returns `201 Created` with the full `Snack` object

### Scenario: Create a 3-group snack (13-23m typical)

- GIVEN baby profile "Ana" (15 months)
- WHEN the user creates a snack with:
  - items: [{ "HEALTHY_FAT" }, { "CEREAL_TUBER" }, { "FRUIT" }]
- THEN the snack is saved with 3 `SnackItem` records
- AND each item has the correct `groupAssignment`

### Scenario: Create a snack without babyProfileId

- GIVEN a user with no baby profile selected
- WHEN the user creates a snack with `babyProfileId: null`
- THEN the snack is saved with `babyProfileId = null` (user-wide snack)
- AND it can be assigned to any baby profile the user owns

### Scenario: Create a snack with invalid groupAssignment fails

- GIVEN a snack creation request with an item having `groupAssignment: "PROTEINS"`
- WHEN the API validates the request
- THEN it returns `400 Bad Request` with error: "PROTEINS is not a valid snack group"
- AND the snack is NOT created

---

## REQ-SM3: List Snacks ("Mis Colaciones")

The system SHALL provide an API endpoint to list all snacks for the current user, filterable by `babyProfileId` and `stageFor`.

**API Contract:**
- `GET /api/snacks?babyProfileId={id}&stageFor={stage}`
- Query params:
  - `babyProfileId` (optional): filter by baby profile
  - `stageFor` (optional): filter by stage enum value
- Response: `200 OK` with array of `Snack` objects (including `items[]`)

### Scenario: List all snacks for a baby profile

- GIVEN user has 5 snacks: 3 for "Tomás" (profile-123), 2 without profile
- WHEN the API is called with `?babyProfileId=profile-123`
- THEN it returns the 3 snacks linked to "Tomás"
- AND snacks without profile are NOT included

### Scenario: List all snacks without filtering

- GIVEN user has 5 snacks total
- WHEN the API is called with no query params
- THEN it returns all 5 snacks for the current user
- AND each snack includes its `items[]` relation

### Scenario: Filter by stageFor

- GIVEN user has snacks with stages: 2 × `TEN_TO_TWELVE_MONTHS`, 1 × `THIRTEEN_TO_TWENTY_THREE_MONTHS`, 1 × `null`
- WHEN the API is called with `?stageFor=TEN_TO_TWELVE_MONTHS`
- THEN it returns only the 2 snacks with `stageFor = 'TEN_TO_TWELVE_MONTHS'`
- AND snacks with `null` or other stages are excluded

---

## REQ-SM4: Age-Suggested Snack Composition (Non-Blocking)

The system SHALL provide a shared helper `getSnackGroupsForAge(ageMonths: number): FoodGroup[]` that returns the clinically suggested food groups for a snack based on the baby's age.

**Logic (per PDF p.5):**
- Age < 10m: `[]` (no snacks)
- Age 10-12m: `[HEALTHY_FAT, CEREAL_TUBER]` (2 groups)
- Age ≥ 13m: `[HEALTHY_FAT, CEREAL_TUBER, FRUIT]` (3 groups)

This helper is ADVISORY only — the system SHALL NOT enforce exact group composition. A snack with missing or extra groups SHALL still be savable.

### Scenario: getSnackGroupsForAge returns correct groups for 11-month-old

- GIVEN `getSnackGroupsForAge(11)`
- WHEN the function is called
- THEN it returns `[HEALTHY_FAT, CEREAL_TUBER]`

### Scenario: getSnackGroupsForAge returns correct groups for 15-month-old

- GIVEN `getSnackGroupsForAge(15)`
- WHEN the function is called
- THEN it returns `[HEALTHY_FAT, CEREAL_TUBER, FRUIT]`

### Scenario: getSnackGroupsForAge returns empty array for 8-month-old

- GIVEN `getSnackGroupsForAge(8)`
- WHEN the function is called
- THEN it returns `[]` (no snacks clinically required at this age)

### Scenario: Snack with missing suggested group saves with warning

- GIVEN baby profile "Ana" (11 months) → suggested groups are `[HEALTHY_FAT, CEREAL_TUBER]`
- WHEN the user creates a snack with only `[{ groupAssignment: "HEALTHY_FAT" }]` (missing CEREAL_TUBER)
- THEN the API saves the snack successfully
- AND the API response includes a `warnings` field: `["Suggested group CEREAL_TUBER is missing"]`
- AND the snack is NOT blocked from saving

### Scenario: Snack with extra group (beyond suggested) saves with warning

- GIVEN baby profile "Tomás" (10 months) → suggested groups are `[HEALTHY_FAT, CEREAL_TUBER]`
- WHEN the user creates a snack with `[{ "HEALTHY_FAT" }, { "CEREAL_TUBER" }, { "FRUIT" }]`
- THEN the snack is saved successfully
- AND the API response includes: `warnings: ["FRUIT is not typically suggested for 10 months"]`

---

## REQ-SM5: No A/L Balance for Snacks

The system SHALL NOT compute an `originBalance` (A vs L) score for snacks. The `Snack` entity SHALL NOT have a `balanceScore` field.

### Scenario: Snack has no balanceScore field

- GIVEN a snack with 2 items (one A, one L)
- WHEN the snack is retrieved via API
- THEN the response SHALL NOT include a `balanceScore` field
- AND no A/L balance calculation is performed

### Scenario: Plate has balanceScore but Snack does not

- GIVEN `Plate` entity with `balanceScore: number?`
- AND `Snack` entity without `balanceScore`
- WHEN both are retrieved
- THEN `Plate` includes `balanceScore`, `Snack` does NOT

---

## Snack Creation UI (Frontend Capability — Added by snack-creation-ui change)

The frontend UI for creating, listing, and deleting snacks from "Mis Colaciones" tab. Complements the backend CRUD provided by REQ-SM1..SM5.

---

### REQ-SC1: Colaciones Tab in PlateListPage

The system SHALL display a "Colaciones" tab alongside "Platos" inside `PlateListPage.vue`, selected via a `?tab=snacks` URL parameter.

**Tab Behavior:**
- URL with `?tab=snacks` → Colaciones tab active and visible
- URL with `?tab=plates` OR no tab param → Platos tab active (default)
- Tab state MUST be reflected in the URL for shareability and back-button support
- Switching tabs MUST update the URL param without full page reload

#### Scenario: Navigate to Colaciones tab via URL param

- GIVEN user is on `/plates` (Platos tab active)
- WHEN the user clicks the "Colaciones" tab
- THEN the URL updates to `/plates?tab=snacks`
- AND the Colaciones tab becomes active
- AND the snack list is displayed

#### Scenario: Direct link to Colaciones tab

- GIVEN a shared URL `/plates?tab=snacks`
- WHEN the user opens the link
- THEN the Colaciones tab is active on page load
- AND the snack list is visible

#### Scenario: Back button returns to Platos tab

- GIVEN user navigated from Platos tab to Colaciones tab
- WHEN the user presses the browser back button
- THEN the URL returns to `/plates` (or `/plates?tab=plates`)
- AND the Platos tab becomes active

#### Scenario: Default tab is Platos when no param

- GIVEN URL `/plates` (no `?tab` param)
- WHEN the page loads
- THEN the Platos tab is active
- AND the plate list is displayed

---

### REQ-SC2: Snack List Display

The system SHALL display a grid of saved snacks in the Colaciones tab, showing the snack name and a summary of its food items.

**Display Contract:**
- Each snack card MUST show: snack name, item count summary (e.g., "3 alimentos")
- Grid layout SHOULD match the plate list styling (desktop: 2-3 columns; mobile: single column)
- Load-more pagination SHOULD match plate list behavior if the user has >20 snacks

#### Scenario: Display saved snacks in grid

- GIVEN user "Ana" has 3 saved snacks: "Colación Mañana" (2 items), "Colación Tarde" (3 items), "Fruta Rápida" (1 item)
- WHEN the Colaciones tab is active
- THEN the grid displays 3 snack cards
- AND each card shows the snack name + item summary

#### Scenario: Empty-state when no snacks exist

- GIVEN user has zero saved snacks
- WHEN the Colaciones tab is active
- THEN the empty-state message displays: "No tienes colaciones guardadas todavía"
- AND a "+ Crear Colación" button or affordance is visible

#### Scenario: Loading state while fetching snacks

- GIVEN snacks are being fetched from the API
- WHEN the Colaciones tab is active
- THEN a loading spinner or skeleton grid is displayed
- AND the empty-state or grid appears after the data loads

---

### REQ-SC3: Create Snack via SnackBuilderDrawer

The system SHALL provide a `SnackBuilderDrawer` component that allows manual per-group food selection to create a new snack.

**Drawer Contract:**
- Right-side full-screen drawer (mirrors PlateBuilderDrawer style)
- Name input (required)
- Stage selector (optional, nullable: `stageFor: PlateStage?`)
- 3-group build zones: HEALTHY_FAT, CEREAL_TUBER, FRUIT (age-driven via `getSnackGroupsForAge`)
- NO group-count toggle (snacks are fixed to 2-3 groups by age, not user choice)
- Reuses `FoodSearchModal` for per-group food selection
- Save action calls `snackStore.createSnack(payload)` → API `POST /api/snacks`
- On success: new snack appears at top of the list, drawer closes, warnings (if any) are shown

#### Scenario: Open SnackBuilderDrawer from empty-state

- GIVEN user has no saved snacks (empty-state visible)
- WHEN the user clicks "+ Crear Colación"
- THEN the SnackBuilderDrawer opens
- AND the name input is empty
- AND 3 empty food zones are displayed (HEALTHY_FAT, CEREAL_TUBER, FRUIT)

#### Scenario: Build and save a 2-group snack (10-12m baby)

- GIVEN baby profile "Tomás" (11 months) → age-suggested groups are [HEALTHY_FAT, CEREAL_TUBER]
- AND the SnackBuilderDrawer is open
- WHEN the user enters name "Colación Mañana"
- AND selects "Aguacate" for HEALTHY_FAT
- AND selects "Avena" for CEREAL_TUBER
- AND clicks "Guardar"
- THEN `createSnack` is called with `{ name: "Colación Mañana", items: [{ foodId: "aguacate-123", groupAssignment: "HEALTHY_FAT" }, { foodId: "avena-456", groupAssignment: "CEREAL_TUBER" }] }`
- AND the API returns `201 Created` with the new snack
- AND the new snack appears at top of the list
- AND the drawer closes

#### Scenario: Build and save a 3-group snack (13-23m baby)

- GIVEN baby profile "Ana" (15 months) → age-suggested groups are [HEALTHY_FAT, CEREAL_TUBER, FRUIT]
- WHEN the user builds a snack with all 3 groups filled
- AND clicks "Guardar"
- THEN the snack is saved with 3 items
- AND it appears in the list

#### Scenario: Save action disabled when name is empty

- GIVEN the SnackBuilderDrawer is open
- AND the name input is empty
- WHEN the user tries to click "Guardar"
- THEN the save button is disabled
- AND a tooltip or hint indicates "El nombre es obligatorio"

---

### REQ-SC4: Age-Suggested Composition with Warnings Display

The system SHALL surface age-suggested food groups via `getSnackGroupsForAge(ageMonths)` in the SnackBuilderDrawer, and display backend composition warnings (REQ-SM4) from the `createSnack` response. Warnings MUST NOT block save.

**Warning Contract:**
- Backend `POST /api/snacks` returns `{ data: Snack, warnings?: string[] }`
- Warnings are shown to the user AFTER save succeeds (not live during build)
- Warning types (from REQ-SM4): missing suggested group, extra group beyond age suggestion
- Warnings are informative only — the snack is still saved

#### Scenario: Suggested groups displayed for 11-month-old baby

- GIVEN baby profile "Tomás" (11 months)
- WHEN the SnackBuilderDrawer opens
- THEN the builder displays 3 zones: HEALTHY_FAT, CEREAL_TUBER, FRUIT
- AND HEALTHY_FAT + CEREAL_TUBER are marked as "Sugerido" or visually emphasized
- AND FRUIT is present but not emphasized (optional for this age)

#### Scenario: Save snack with missing suggested group shows warning

- GIVEN baby "Ana" (11 months) → suggested groups are [HEALTHY_FAT, CEREAL_TUBER]
- WHEN the user saves a snack with only HEALTHY_FAT filled (missing CEREAL_TUBER)
- THEN the API returns `{ data: {snack}, warnings: ["Suggested group CEREAL_TUBER is missing"] }`
- AND the snack is saved successfully
- AND a warning banner displays: "El grupo Cereal o Tubérculo está faltando para esta edad"
- AND the new snack appears in the list

#### Scenario: Save snack with extra group shows warning

- GIVEN baby "Tomás" (10 months) → suggested groups are [HEALTHY_FAT, CEREAL_TUBER]
- WHEN the user saves a snack with all 3 groups (including FRUIT)
- THEN the API returns `{ warnings: ["FRUIT is not typically suggested for 10 months"] }`
- AND the snack is saved successfully
- AND a warning banner displays the message
- AND the drawer closes

#### Scenario: Save snack matching suggested groups shows no warning

- GIVEN baby "Ana" (15 months) → suggested groups are [HEALTHY_FAT, CEREAL_TUBER, FRUIT]
- WHEN the user saves a snack with all 3 groups filled
- THEN the API returns `{ data: {snack}, warnings: [] }` or no warnings field
- AND no warning banner is displayed
- AND the snack is saved normally

---

### REQ-SC5: Delete Snack

The system SHALL allow a user to delete a saved snack from the Colaciones tab. Deletion calls `snackStore.deleteSnack(snackId)` → API `DELETE /api/snacks/:id` (soft-delete).

**Delete Contract:**
- Confirmation affordance (e.g., modal or inline confirm) before deletion
- On success: snack is removed from the list
- If the deleted snack is assigned to any menu slots, the slot becomes empty (existing backend behavior)

#### Scenario: Delete a snack with confirmation

- GIVEN user has a saved snack "Colación Mañana" (snack-123)
- AND the snack is visible in the list
- WHEN the user clicks the delete icon/button on the snack card
- THEN a confirmation modal appears: "¿Eliminar 'Colación Mañana'?"
- WHEN the user confirms
- THEN `deleteSnack(snack-123)` is called
- AND the API returns `204 No Content`
- AND the snack disappears from the list

#### Scenario: Cancel delete confirmation

- GIVEN user initiated delete on a snack
- AND the confirmation modal is visible
- WHEN the user clicks "Cancelar"
- THEN the modal closes
- AND the snack remains in the list (not deleted)

#### Scenario: Delete the last snack shows empty-state

- GIVEN user has exactly 1 saved snack
- WHEN the user deletes it
- THEN the snack is removed from the API
- AND the empty-state message appears: "No tienes colaciones guardadas todavía"

---

### REQ-SC6: Tier Gate (Trial-First Lockout — mirrors plates)

The system SHALL gate snack creation with the SAME trial-first tier model the app uses for plates. Snack creation is a PRO/TRIAL feature; a locked-out FREE user (expired trial) cannot create snacks. The client limit MUST mirror `PLATE_LIMITS` via a new `SNACK_LIMITS` constant (`FREE: 0`, `PRO: Infinity`) so snacks and plates behave identically for the same user.

**Tier Gate UX (mirror the plates tier UX exactly):**
- Locked-out FREE user: creation affordance is disabled and an upsell is shown (same pattern as the plates tab).
- TRIAL/PRO user: unlimited snacks; no limit messaging.

#### Scenario: Locked-out FREE user cannot create snacks

- GIVEN a FREE user (expired trial) whose `SNACK_LIMITS[FREE]` is 0
- WHEN the user views the Colaciones tab
- THEN the create affordance is disabled
- AND an upsell to PRO is shown (mirroring the plates tab lockout UX)

#### Scenario: PRO user has unlimited snacks

- GIVEN a PRO user has 10 saved snacks
- WHEN the user creates a new snack
- THEN the save action succeeds
- AND no tier limit message is shown

#### Scenario: Snack tier gate matches plate tier gate for the same user

- GIVEN a user whose tier locks out plate creation (`PLATE_LIMITS[tier] === 0`)
- WHEN the user views the Colaciones tab
- THEN snack creation is locked out identically (`SNACK_LIMITS[tier] === 0`)
- AND the user is never allowed to create snacks while blocked from creating plates

---

### REQ-SC7: No A/L Balance Display in SnackBuilderDrawer

The system SHALL NOT display an A/L balance score or balance indicator in the SnackBuilderDrawer or SnackVisualization. Snacks do NOT have a `balanceScore` field (REQ-SM5).

**Contrast with PlateBuilderDrawer:**
- PlateBuilderDrawer displays a balance bar (A vs L score)
- SnackBuilderDrawer displays composition warnings instead
- No balance calculation is performed for snacks

#### Scenario: SnackBuilderDrawer has no balance bar

- GIVEN the SnackBuilderDrawer is open
- WHEN the user adds foods to the 3 groups
- THEN no balance score or balance bar is visible
- AND only the food zones (HEALTHY_FAT, CEREAL_TUBER, FRUIT) are displayed

#### Scenario: SnackVisualization has no balance indicator

- GIVEN a snack is being built or displayed
- WHEN the `SnackVisualization` component renders
- THEN it shows a 3-zone circular visualization
- AND no A/L balance icon or score is present

---

## Snack Diary Integration (MODIFIED — Serve Flow)

Delta (snack-diary-integration change) extends the weekly menu serve flow to support snacks, enabling menu-served snacks to be logged to the food diary.

---

## ADDED Requirements (via snack-diary-integration change)

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

## MODIFIED Requirements (via snack-diary-integration change)

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

## Design Notes: Architecture Decisions (from snack-diary-integration change)

### AD5 Override: MealLog.snackId Added to Shared DTO

**Original Design**: REQ-SD7 assumed snackId would be persistence-only (not in the MealLog DTO or shared types), based on the reasoning that "nothing in the serve flow or diary/dashboard renders a snack id".

**Reality**: During implementation (sdd-verify phase), live QA discovered that the diary RENDER groups served snacks by their snackId to display all foods from a single snack under one card. The original assumption was WRONG — REQ-SD7 requires frontend code (grouping by snackId in `apps/web/src/modules/diary/groupEntries.ts`), contrary to the original "no code change" note.

**Fix Applied**: `MealLog.snackId` was added to `packages/shared/src/types/diary.ts` (line 96) so the diary render can access it for grouping. The `GET /api/diary` response already included snackId (via findMany with no select filter); only the DTO type was missing.

**Archive Note**: This decision override is recorded here as a design correction. The synced main spec now reflects the true implementation (snackId IS in the shared DTO and IS required for REQ-SD7 frontend grouping).

---

## Out of Scope — Snack Management & Serving (Deferred to Later PRs)

- **Snack Build UX Polish**: per-group food picker polish, composition suggestion badges — covered by PR
- **Auto-Composition**: system does NOT auto-fill snack items from suggestions
- **Edit Snack**: No `updateSnack` action or edit mode — user deletes + recreates to fix mistakes
- **Snack Duplication**: ability to clone an existing snack
- **Filtering by Food**: searching snacks that contain a specific food
- **Nutrition Scoring**: no macro/micro nutrient calculations for snacks (only A/L was dropped, others were never in scope for Plates either)
- **Dedicated dashboard served-snack card**: A separate "Snacks served today" card distinct from `SnackSuggestionCard` (suggestions) and the generic `TodayLogsCard` — future enhancement.
- **Snack-specific analytics**: Served-snack frequency, acceptance trends, and reporting beyond the generic diary entry.
- **Snack reactions / acceptance UX**: Richer per-snack feedback beyond what the existing generic diary entry already supports.
- **Snack editing after served**: Once served, the FoodLog entries are immutable (same as plate serves).
- **Snack serve history / audit trail**: No dedicated "what snacks were served this week" query beyond the existing diary queries.

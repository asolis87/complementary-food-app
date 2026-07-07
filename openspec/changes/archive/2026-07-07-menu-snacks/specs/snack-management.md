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

## Out of Scope — Snack Management (Deferred to Later PRs)

- **Catalog Tab UI** ("Mis Colaciones" tab inside "Mis Platos"): PR-1 provides backend only; UI is later PR
- **Snack Build UX Polish**: per-group food picker, composition suggestion badges in UI — deferred
- **Auto-Composition**: system does NOT auto-fill snack items from suggestions
- **Edit/Delete Snack**: CRUD endpoints for edit/delete can be added later if needed
- **Snack Duplication**: ability to clone an existing snack
- **Filtering by Food**: searching snacks that contain a specific food
- **Nutrition Scoring**: no macro/micro nutrient calculations for snacks (only A/L was dropped, others were never in scope for Plates either)

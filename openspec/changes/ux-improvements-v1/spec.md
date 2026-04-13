# Specification: ux-improvements-v1

## Context
This document specifies 6 UX improvements for the Pakulab complementary feeding PWA.

## 1. New plate starts empty
**Description:** The plate builder must start completely empty for a new plate creation to avoid unintentional ingredient carryover from a previous session.

### Acceptance Criteria
**Scenario: Starting a new plate builder session**
* **Given** the user navigates to `PlateBuilderPage.vue` to create a new plate
* **When** the page component is mounted
* **Then** `plateStore.resetDraft()` is called
* **And** the plate canvas is completely empty (no ingredients selected)

### Edge Cases
* User is editing an existing plate (must ensure `resetDraft` doesn't overwrite an incoming edit payload if loaded in the same tick; ideally call `resetDraft` only on "create new" paths or before loading the edit draft).

### Out of scope
* Modifying how the draft is saved.

---

## 2. Sort plates by recent
**Description:** Plates should appear with the most recently created ones at the top of the list.

### Acceptance Criteria
**Scenario: Viewing the plate list**
* **Given** a user with multiple saved plates opens the `PlateListPage.vue`
* **When** the list is loaded from `plates.service.ts`
* **Then** the plates are sorted by `createdAt: 'desc'`
* **And** any newly created plates added to the store via `unshift` appear at the top immediately

### Edge Cases
* Pagination edge cases (if any) when inserting new items.

### Out of scope
* Building custom sort filters (only the default sort is locked in).

---

## 3. Camote → CEREAL_TUBER
**Description:** Camote (Sweet potato) should be classified correctly under Cereals & Tubers rather than Vegetables.

### Acceptance Criteria
**Scenario: Seeding the database**
* **Given** the database seeding script (`prisma/seed.ts`) is executed
* **When** the ingredients are populated
* **Then** "Camote" is assigned the `group: 'CEREAL_TUBER'` instead of `VEGETABLE`

### Edge Cases
* Existing plates containing Camote will now display it in the Cereals/Tubers quadrant. This is an expected behavioral update.

### Out of scope
* Database migration for existing user-modified ingredients (relies solely on the seed for base data).

---

## 4. "Se lo di" confirmation
**Description:** Prevent accidental registrations of meals by requiring confirmation before the first serve in the menu bitácora.

### Acceptance Criteria
**Scenario: Registering a meal for the first time**
* **Given** a user is viewing `MenuWeekPage.vue`
* **When** they click "Se lo di" on an unserved meal slot
* **Then** a confirmation modal appears with the text "¿Registrar esta comida en la bitácora?"
* **And** it presents options "Sí, registrar" and "Cancelar"
* **When** they click "Sí, registrar", the meal is marked as served
* **When** they click "Cancelar", the modal closes and no changes are made

### Edge Cases
* Re-serving a meal (changing an already served meal) already has a dialog; ensure the two flows don't conflict.

### Out of scope
* Changing the underlying tracking/bitácora data model.

---

## 5. Apply plate to all meals of day
**Description:** Allow users to rapidly assign the same plate to all meal slots in a single day (e.g., Breakfast, Lunch, Dinner).

### Acceptance Criteria
**Scenario: Selecting a plate for a meal slot**
* **Given** the user selects a plate for a specific meal slot (e.g., Lunch)
* **When** the selection is confirmed
* **Then** a modal appears asking "apply to just this slot or all day?"
* **When** the user selects "Todas" (All day)
* **Then** the app loops through all `MEALS` for that `dayKey`
* **And** calls `assignPlate` in `menuStore.ts` for each slot

### Edge Cases
* Overwriting existing meal slots for that day (modal should ideally warn, or by default just overwrite without breaking).

### Out of scope
* Copying meals across multiple days or whole weeks.

---

## 6. Relocate "+" FAB
**Description:** The Floating Action Button on the Plate List must not obscure the last card on mobile devices.

### Acceptance Criteria
**Scenario: Scrolling the plate list on mobile**
* **Given** the user is viewing `PlateListPage.vue` on a mobile device
* **When** they scroll to the very bottom of the list
* **Then** the "+" FAB is positioned such that the last card is fully visible
* **And** either the FAB has a higher bottom offset (e.g. `calc(8rem + env(safe-area-inset-bottom))`) OR the list container has adequate bottom padding (e.g. `pb-32`)

### Edge Cases
* Interaction with safe area insets on iOS devices.
* Very short lists without a scrollbar (FAB shouldn't block the only item).

### Out of scope
* Redesigning the FAB component itself.

# Spec: Integrar flujo de creación de plato en menú semanal

## ADDED Requirements

### Requirement: Composable Extraction (`usePlateBuilder`)

The system MUST extract plate creation logic into a context-aware composable (`usePlateBuilder`) to support multiple independent instances without singleton collision.
- It MUST expose state: `draftItems`, `balance`, `isValid`.
- It MUST expose actions: `initDraft`, `addFood`, `removeFood`, `savePlate`.
- It MUST allow independent drafts between the page builder and the drawer builder.

#### Scenario: Multiple builder instances do not collide
- GIVEN the user has an active draft in the `PlateBuilderPage`
- WHEN the user opens the `PlateBuilderDrawer` and initiates a new draft
- THEN the drawer draft MUST NOT overwrite the page draft
- AND saving the drawer draft MUST NOT clear the page draft

### Requirement: PlateBuilderDrawer Component

The system MUST provide a `PlateBuilderDrawer` component for inline plate creation.
- It MUST display as a slide-over on desktop and a near-fullscreen bottom sheet on mobile.
- It MUST utilize the `usePlateBuilder` composable.
- It MUST include plate visualization, food search, and balance indicator.
- It MUST emit `plate-created(plate)` with the full `Plate` object on successful save and `close` on cancellation.

#### Scenario: User saves a plate from the drawer
- GIVEN the `PlateBuilderDrawer` is open
- WHEN the user adds valid food items and clicks "Guardar"
- THEN the system MUST save the plate via the API
- AND the system MUST emit `plate-created` with the new plate object
- AND the drawer MUST close

#### Scenario: User cancels plate creation in drawer
- GIVEN the `PlateBuilderDrawer` is open with draft items
- WHEN the user clicks "Cancelar" or closes the drawer
- THEN the system MUST emit `close` without saving
- AND the system MUST discard the drawer's draft state

### Requirement: Menu → Builder Integration

The system MUST allow users to create a new plate directly from the weekly menu's plate picker dialog.
- The picker MUST include a "Crear plato nuevo" button.
- Clicking the button MUST open the `PlateBuilderDrawer`.
- Upon successful creation, the system MUST auto-assign the new plate to the active meal slot.
- The system MUST update the plate list in the picker to include the new plate.

#### Scenario: Auto-assignment from Menu
- GIVEN the user is selecting a plate for Monday's Lunch
- WHEN the user clicks "Crear plato nuevo" and successfully saves a new plate in the drawer
- THEN the system MUST assign the newly created plate to Monday's Lunch slot
- AND the system MUST close the drawer and the picker
- AND the weekly menu MUST display the new plate in Monday's Lunch slot

### Requirement: Builder → Menu Integration

The system MUST allow users to assign a newly created plate to a menu slot directly from the `PlateBuilderPage`.
- After successfully saving a plate, the system MUST display an option to assign it to a meal.
- The system MUST provide a menu slot selector (day + meal type).
- The system MUST use `menuStore.assignPlate()` to update the menu.

#### Scenario: Assigning a plate after creation in the Builder page
- GIVEN the user has just saved a new plate in `PlateBuilderPage`
- WHEN the user selects "Martes" and "Cena" from the assignment options and confirms
- THEN the system MUST assign the plate to Tuesday's Dinner slot via `menuStore.assignPlate()`
- AND the system MUST show a success confirmation

### Requirement: State Management and Offline Awareness

The system MUST ensure stores reflect changes immediately and respect offline capabilities.
- `plateStore` MUST support context-aware drafts (page vs drawer) to prevent state bleeding.
- `menuStore` MUST refresh or locally append to `savedPlates` after inline creation.
- The interactions MUST NOT require new API endpoints (reusing existing ones).
- The interactions MUST respect existing IndexedDB patterns for offline-aware behavior.

#### Scenario: Cache update on inline creation
- GIVEN the system is offline and the user creates a plate in the drawer
- WHEN the plate is saved to IndexedDB
- THEN `menuStore.savedPlates` MUST be updated with the local offline record
- AND the plate MUST be available for immediate assignment in the menu

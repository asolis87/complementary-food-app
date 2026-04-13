# Exploration: Integrar flujo de creación de plato en menú semanal

## Current State

### 1. Dish Creation Flow (Cream de Plato / Plate Builder)

**Route:** `/plate/new` → `PlateBuilderPage.vue`
**Route (edit):** `/plates/:id` or `/plate/new?edit=<id>` → same `PlateBuilderPage.vue`

**Data Flow:**
```
User taps group zone on PlateVisualization
  → FoodSearchModal opens (bottom sheet, per-group)
  → User selects a food
  → plateStore.addFoodToDraft(food, group) [Pinia]
  → Real-time balance via useBalance composable (shared pure fn)
  → Save: plateStore.saveDraftAsPlate() → POST /api/plates
  → Edit: plateStore.updatePlate(id) → PUT /api/plates/:id
```

**Key Store:** `plateStore` (Pinia)
- `draftItems: PlateItemDraft[]` — current plate being built
- `draftName: string` — editable plate name
- `draftGroupCount: 4 | 5` — 4-group or 5-group toggle
- `savedPlates: Plate[]` — fetched from API, used by menu picker
- `addFoodToDraft(food, group)` — only ONE food per group zone (replaces)
- `removeFoodFromDraft(localId)` — remove by local ID
- `setGroupCount(count)` — switches 4↔5, strips HEALTHY_FAT items on 4
- `saveDraftAsPlate()` → POST /api/plates → unshifts to savedPlates
- `updatePlate(id)` → PUT /api/plates/:id → updates in savedPlates

**Key API:**
- `POST /api/plates` — create plate (requires FREE+ tier)
- `GET /api/plates` — list user plates (paginated)
- `GET /api/plates/:id` — get single plate
- `PUT /api/plates/:id` — update plate
- `DELETE /api/plates/:id` — soft delete
- `POST /api/plates/calculate-balance` — anonymous balance calc (DB lookup)
- `POST /api/plates/balance` — stateless balance calc (no DB)

**Components:**
- `PlateVisualization.vue` — circular plate SVG with tap zones per group
- `FoodSearchModal.vue` — bottom sheet modal for food selection (944 lines!)
- `BalanceIndicator.vue` — A/L balance bar
- `PlateContents.vue` — sidebar list of selected foods by group
- `FoodGroupTabs.vue` — group tabs alternative
- `PlateActions.vue` — save/share/clear buttons
- `PlateExport.vue` — off-screen image capture
- `PlateItemChip.vue` — individual food chip

### 2. Weekly Menu Flow (Menú Semanal)

**Route:** `/menus` → `MenuWeekPage.vue` (PRO-gated via TierGate)
**Rating:** 3 meal slots per day (desayuno, comida, cena)

**Data Flow:**
```
User taps "Agregar plato" button on empty slot
  → Picker dialog opens (Teleport to body)
  → Shows savedPlates list (expanded accordion style)
  → User selects a plate
  → Apply-to-all dialog (single meal or all day's meals)
  → menuStore.assignPlate(profileId, weekStart, dayKey, mealKey, plate)
  → PATCH /api/menus/:menuId/meals { dayOfWeek, mealType, plateId }
```

**Key Store:** `menuStore` (Pinia)
- `weekMenus: Map<string, WeeklyMenuResponse | null>` — cached by weekStart ISO
- `currentWeekStart: string | null` — active week
- `menuMap: Record<SlotKey, Plate | null>` — computed lookup for all 21 slots
- `assignPlate(...)` — optimistic update + rollback on error
- `removePlate(...)` — optimistic clear + rollback
- `ensureMenu(...)` — lazy menu creation (POST only when first plate assigned)
- `serveMeal(...)` — marks meal as served (creates FoodLog entries)
- `reServeMeal(...)` — force re-serve with confirmation dialog

**Key API:**
- `GET /api/menus?babyProfileId=&weekStart=` — get/create menu (lazy)
- `POST /api/menus` — create menu with 7 days
- `PATCH /api/menus/:menuId/meals` — upsert meal slot (assign/clear plate)
- `POST /api/menus/:menuId/meals/serve` — serve meal (FoodLog creation)
- `DELETE /api/menus/:menuId` — soft delete

**Components:**
- `MenuWeekPage.vue` — the entire page (monolithic, ~2200+ lines with styles)
- `MenuExportFrame.vue` — off-screen export frame
- Picker dialog (inline within MenuWeekPage, NOT a separate component)
- Confirmation dialogs: re-serve, first-serve, apply-to-all (all inline)

### 3. Interaction Between Both Flows (Current Friction)

**The FRICTION POINT:**

When a user is planning their weekly menu (MenuWeekPage) and wants to assign a plate to a meal slot, they:

1. Tap "Agregar plato" on the empty slot
2. See the Plate Picker dialog with their saved plates
3. **BUT**: if they don't have the plate they want, the only option is a `<RouterLink to="/plates">` that says "Crear un plato" (line 370)

```html
<RouterLink to="/plates" class="picker-empty__link">Crear un plato</RouterLink>
```

This link navigates to `/plates` (the plate LIST page), NOT the plate builder. Then from there the user must:
4. Tap "Crear Nuevo Plato" button
5. Go to `/plate/new`
6. Build the plate from scratch
7. Save the plate
8. Navigate back to `/menus`
9. Find the slot again
10. Tap "Agregar plato" again
11. Find the newly created plate in the picker
12. Assign it

**This is TERRIBLE UX** — at least 7 steps of context switching to create one plate from the menu context.

Even when the user DOES have plates, the picker only shows:
- Plate name + number of foods
- Expanded: food list with group assignments
- No inline creation option

### 4. Data Model Relationships

```
User
 ├── BabyProfile (1:N)
 │    ├── Plate (1:N)
 │    │    └── PlateItem (1:N) → Food (N:1)
 │    ├── WeeklyMenu (1:N)
 │    │    └── MenuDay (1:N per menu, 7 days)
 │    │         └── MenuMeal (1:N per day, up to 6 meal types)
 │    │              └── Plate (N:1, nullable)
 │    └── FoodLog (1:N)
 │         └── Plate (N:1, nullable)

MealType: BREAKFAST, LUNCH, DINNER, SNACK_1, SNACK_2, SNACK
ActiveMealKeys: ['desayuno', 'comida', 'cena'] → BREAKFAST, LUNCH, DINNER
DayKey: 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom' → 0-6

Plate → PlateItem → Food (materialized group assignment)
MenuMeal.plateId is NULLABLE (slot can be empty)
MenuMeal.servedAt tracks if meal was actually served
```

### 5. Existing UI Patterns for Modals/Drawers/Inline Forms

**Modal Patterns Found:**

1. **Bottom Sheet (FoodSearchModal):** Teleport to body, backdrop fade + slide-up animation, drag handle for mobile. This is the most sophisticated modal in the app — 944 lines with search, group filtering, food history, allergen warnings.

2. **Dialog Pattern (MenuWeekPage):** Uses `<Teleport to="body">` with `Transition` components. Multiple dialogs: Picker, Re-serve confirmation, First-serve confirmation, Apply-to-all confirmation. Backdrop with `@click.self="closeX"` pattern.

3. **No Drawer/Slide-over component:** There's no shared Drawer component. All overlays are either bottom sheets or centered dialogs.

4. **No shared Modal/Dialog component:** Each modal is built inline (duplicated backdrop, animation, close patterns). This is a reuse opportunity.

5. **Inline Edit:** Plate name uses `<input>` styled as heading (PlateBuilderPage line 9-17).

**Unique Constraint:** Each plate group zone allows ONLY ONE food — `addFoodToDraft` replaces existing item in that group. This is important for the inline creation approach.

## Affected Areas

- `apps/web/src/modules/menus/MenuWeekPage.vue` — primary target; picker dialog needs "create new plate" inline flow
- `apps/web/src/modules/plates/PlateBuilderPage.vue` — plate builder page; its logic may need to be extracted into reusable composables
- `apps/web/src/shared/stores/plateStore.ts` — draft state management; needs to support creation from within menu context
- `apps/web/src/shared/stores/menuStore.ts` — menu state; needs coordination with plate creation
- `apps/web/src/modules/plates/components/FoodSearchModal.vue` — core food selection UI; needs to be reusable from menu context
- `apps/api/src/modules/plates/plates.routes.ts` — plate creation API (may need a response format that includes items for immediate picker display)
- `apps/api/src/modules/plates/plates.service.ts` — plate creation logic
- `packages/shared/src/types/plate.ts` — Plate type definitions
- `packages/shared/src/types/menu.ts` — Menu type definitions

## Approaches

### Approach 1: Inline Mini-Builder Inside Picker Dialog
**Description:** Add a "Crear plato nuevo" option inside the existing Picker dialog. When tapped, the dialog expands or transitions to show a simplified plate builder (food group selection + food search) within the same modal overlay. On save, the plate is created via API, returned to the menu picker, and the user can immediately assign it.

- **Pros:**
  - Zero context switching — user never leaves the menu page
  - Reuses FoodSearchModal for food selection
  - Matches the "single task" UX of the current picker
  - Natural flow: Menu → Picker → "No tengo el plato" → Build it inline → Assign
- **Cons:**
  - Modal becomes complex — needs state machine for steps (pick → build → confirm → assign)
  - FoodSearchModal is heavy (944 lines) — reusing it inside another modal requires care
  - Mobile screen space is limited — bottom sheet inside dialog is awkward
  - The plate builder's group toggle (4/5 groups) and balance indicator add visual weight
- **Effort:** Medium

### Approach 2: Slide-over Drawer from Menu Page
**Description:** When user taps "Crear plato" from the picker, a right-side drawer (desktop) or full-screen slide-over (mobile) slides in with a complete plate builder. The menu page remains visible underneath. After saving the plate, the drawer closes and the plate appears in the picker.

- **Pros:**
  - Full plate builder UX — no compromises
  - Menu context visible (desktop) so user remembers what they're planning
  - Can reuse PlateBuilderPage components almost as-is
  - Clear visual separation between "creating" and "assigning"
- **Cons:**
  - Need a new Drawer/SlideOver component (doesn't exist yet)
  - Mobile: full-screen slide-over still requires "back" navigation
  - PlateBuilderPage isn't currently composable — it's a full page with `<template>` and routing
  - Two states in plateStore: draft for menu context vs. standalone builder page
- **Effort:** Medium-High

### Approach 3: Quick-Create Plate API + Simple Form in Picker
**Description:** Add a simplified "quick create" flow inside the picker: just a plate name input + food group tabs + food selection. No visualization, no balance indicator. Save directly to API. This is a streamlined mini-form, not the full builder.

- **Pros:**
  - Simplest UI — minimal components to build
  - No need for full builder components — just food selection
  - Stays within the picker dialog context
  - Fast to implement
- **Cons:**
  - No balance feedback during creation (core value prop of the builder)
  - No plate visualization — users lose the A/L awareness feature
  - Different UX from standalone builder — inconsistent experience
  - Risk of creating unbalanced plates without visual feedback
- **Effort:** Low

### Approach 4: Route-Based with Return Intent (Deep Link)
**Description:** When user taps "Crear plato" in the picker, navigate to `/plate/new?returnTo=/menus&meal=lun:desayuno`. After saving, the builder redirects back to menus with query params that auto-open the picker for that meal slot with the newly created plate.

- **Pros:**
  - Reuses existing PlateBuilderPage with minimal changes
  - Familiar navigation pattern (back/forward)
  - Full plate builder UX with no compromises
  - Simple to implement — just add query param handling
- **Cons:**
  - Full page navigation — menu context is completely lost
  - User must remember what meal they were planning
  - Browser back/forward can cause confusion
  - 7-step flow isn't significantly improved (just automated redirect)
- **Effort:** Low

## Recommendation

**Approach 2: Slide-over Drawer** with composable extraction from PlateBuilderPage.

**Why:**
1. **Zero compromise on UX** — full plate builder with visualization, balance indicator, and food search
2. **Context preservation** — menu stays visible on desktop, slide-over is dismissible
3. **Composable extraction** — the plate builder's logic (`usePlateBuilder` composable) can be reused across the standalone page AND the drawer, following the container/presentation pattern
4. **Future-proof** — drawer pattern can be reused for other inline editing flows (e.g., editing a plate from the menu)

**Implementation path:**
1. Extract plate builder logic from `PlateBuilderPage.vue` into `usePlateBuilder.ts` composable
2. Refactor `PlateBuilderPage.vue` to use the composable
3. Create a `PlateBuilderDrawer.vue` component (slide-over) using the same composable
4. Modify `MenuWeekPage.vue` picker to add "Crear plato nuevo" button that opens the drawer
5. On plate save, close drawer, refresh savedPlates, auto-assign the new plate to the active meal slot

**Alternative consideration:** If time is critical, Approach 1 (Inline Mini-Builder) is acceptable as a V1 with a plan to evolve to Approach 2.

## Risks

- **State management collision:** plateStore.draftItems is singleton — if user has a draft in progress on the builder page and opens the drawer from menu, state could collide. Mitigation: use a separate composable instance or namespace the state.
- **Mobile UX:** Full builder in a drawer on small screens is tight. Need responsive adaptation — slide-over becomes nearly full-screen on mobile, with a "close" affordance.
- **Concurrent creation race:** If menu menu's savedPlates cache isn't refreshed after inline creation, the picker won't show the new plate. Must call `plateStore.fetchSavedPlates()` or unshift the created plate.
- **plateStore mutation:** The current `saveDraftAsPlate()` only pushes to savedPlates but doesn't return the full plate with items populat` — the menu picker needs the complete plate (with items.food populated) for display.
- **API response format:** `POST /api/plates` returns the plate with `items.food`, but the menu picker's Plate type needs all food details (name, group, alClassification). Verify the API response satisfies this.
- **Existing monolithic components:** MenuWeekPage.vue is already 2200+ lines. Adding more logic will make it unmanageable. Extracting the picker into its own component should happen first.

## Ready for Proposal

**Yes** — the exploration is complete. The next step is to propose the change with a clear scope:

1. Extract plate builder logic into `usePlateBuilder` composable
2. Create `PlateBuilderDrawer.vue` component
3. Modify menu picker to include "Crear plato nuevo" action
4. Wire up plate creation → auto-assign flow
5. Refactor picker into its own component for maintainability

The orchestrator should ask the user which approach they prefer (1, 2, 3, or 4) and whether they want the full implementation or just the composable extraction + drawer as a first phase.
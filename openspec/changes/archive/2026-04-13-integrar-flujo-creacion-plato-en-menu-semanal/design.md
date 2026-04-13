# Design: Integrar flujo de creación de plato en menú semanal

## Technical Approach

Extract plate-building logic from `PlateBuilderPage.vue` into a composable `usePlateBuilder()` that manages isolated per-instance state via `reactive()` (not the Pinia singleton). Both the existing page and a new `PlateBuilderDrawer` consume this composable. The drawer mounts via `<Teleport to="body">` following the existing dialog pattern. `plateStore` retains only server-synced state (`savedPlates`, `fetchSavedPlates`, `saveDraftAsPlate`); draft state moves to the composable.

## Architecture Decisions

| # | Decision | Alternatives | Rationale |
|---|----------|-------------|-----------|
| AD-1 | **Composable-owned draft state** — `usePlateBuilder()` returns local `reactive` state per call-site. `plateStore` keeps ONLY server-synced state (`savedPlates`, API actions). | (a) Namespaced Pinia stores per context, (b) Store with `createDraft(id)` method | Composable isolation is simpler, avoids singleton collision (spec REQ), and follows Vue 3 composition pattern. Pinia stays for what it does best: shared server cache. |
| AD-2 | **Drawer as `<Teleport to="body">`** — slide-from-right on desktop (max-width 520px), near-fullscreen bottom-sheet on mobile. Z-index 1100 (drawer) + 1200 (FoodSearchModal inside drawer). | (a) Route-based with `?drawer=1`, (b) Inline in MenuWeekPage | Teleport matches existing dialog pattern (z-index 1000 for picker). Drawer at 1100 layers above picker. FoodSearchModal already uses Teleport independently — bump its z-index to 1200 when inside drawer context via a `layerOffset` prop. |
| AD-3 | **`plateStore.saveDraftAsPlate()` stays in store** — composable calls `plateStore.saveDraftAsPlate()` passing the draft payload, so `savedPlates` cache updates automatically. | (a) Duplicate API call in composable, (b) Event bus | Single source of truth for savedPlates. The composable builds the payload, store executes the API call and caches the result. |
| AD-4 | **Post-save assignment dialog** — After saving from PlateBuilderPage, show a `MealSlotPicker` bottom-sheet (new component) with day × mealType grid. Reuses `menuStore.assignPlate()`. | (a) Redirect to menu page with query param, (b) Always auto-navigate | Keeps user in context. The slot picker is a reusable component also useful for future "duplicate plate to slot" features. |
| AD-5 | **No new API endpoints** — All operations use existing `POST /plates`, `PATCH /menus/:id/meals`. Composable orchestrates the sequence. | n/a | Spec explicitly states no new endpoints. Data model unchanged. |

## Data Flow

### Flow 1: Menu → Builder (inline creation)

```
MenuWeekPage        Picker        PlateBuilderDrawer    usePlateBuilder    plateStore    menuStore
    │                  │                   │                   │                │              │
    │─openPicker(d,m)─→│                   │                   │                │              │
    │                  │──"Crear plato"───→│                   │                │              │
    │                  │  (close picker)   │──initDraft()─────→│                │              │
    │                  │                   │                   │                │              │
    │                  │                   │◄─[user builds]────│                │              │
    │                  │                   │                   │                │              │
    │                  │                   │──savePlate()──────→│───saveDraft──→│              │
    │                  │                   │                   │  (payload)     │──POST /plates│
    │                  │                   │◄──plate-created────│◄──Plate───────│              │
    │◄─@plate-created──│                   │                   │                │              │
    │──assignPlate(d,m,plate)─────────────────────────────────────────────────→│──PATCH meals │
    │                                                                          │              │
```

### Flow 2: Builder → Menu (post-save assignment)

```
PlateBuilderPage    usePlateBuilder    plateStore    MealSlotPicker    menuStore
    │                    │                │                │              │
    │──handleSave()─────→│                │                │              │
    │                    │──savePlate()──→│──POST /plates──│              │
    │                    │◄──Plate────────│                │              │
    │◄──plate saved──────│                │                │              │
    │──show picker──────────────────────────────────────→│              │
    │                                                     │              │
    │◄────────────────────(user selects day+meal)─────────│              │
    │──assignPlate(d,m,plate)────────────────────────────────────────→│
    │                                                                   │
```

## Component Tree

```
MenuWeekPage.vue
├── ... (existing)
├── PlatePicker (existing inline dialog, add "Crear plato nuevo" btn)
└── PlateBuilderDrawer.vue          ← NEW (Teleport to body)
    ├── PlateVisualization           (reused)
    ├── BalanceIndicator             (reused)
    ├── PlateContents                (reused)
    ├── PlateActions                 (reused, slim variant via prop)
    └── FoodSearchModal              (reused, z-index bumped)

PlateBuilderPage.vue
├── ... (refactored to use usePlateBuilder composable)
└── MealSlotPicker.vue              ← NEW (post-save bottom-sheet)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `web/src/shared/composables/usePlateBuilder.ts` | Create | Composable with isolated reactive draft state, food management, save orchestration. Returns `{ draftItems, draftName, draftGroupCount, balance, hasItems, canSave, addFood, removeFood, setGroupCount, resetDraft, clearItems, savePlate }` |
| `web/src/modules/plates/components/PlateBuilderDrawer.vue` | Create | Slide-over drawer consuming `usePlateBuilder()`. Props: `isOpen`, `layerOffset?`. Emits: `plate-created(Plate)`, `close`. |
| `web/src/modules/menus/components/MealSlotPicker.vue` | Create | Day×MealType selector grid. Props: `isOpen`, `weekDays`, `meals`. Emits: `select({dayKey, mealKey})`, `close`. |
| `web/src/modules/plates/PlateBuilderPage.vue` | Modify | Replace direct `plateStore.draft*` usage with `usePlateBuilder()`. Add `MealSlotPicker` post-save flow. Remove ~80 lines of inline state management, add ~20 lines for composable wiring + slot picker. |
| `web/src/modules/menus/MenuWeekPage.vue` | Modify | Import `PlateBuilderDrawer`. Add "Crear plato nuevo" button in picker empty state + plate list. Add `drawerOpen` ref, `onPlateCreated` handler (~30 lines). |
| `web/src/shared/stores/plateStore.ts` | Modify | Add `saveDraftPayload(payload)` action that accepts external draft data (from composable). Keep existing `saveDraftAsPlate()` as wrapper for backward compat during migration. |
| `web/src/modules/plates/components/FoodSearchModal.vue` | Modify | Add optional `zIndexOffset` prop (default 0). Backdrop z-index: `200 + zIndexOffset`, sheet: `201 + zIndexOffset`. When used inside drawer, pass `zIndexOffset={1000}`. |

## Interfaces / Contracts

```typescript
// usePlateBuilder.ts
interface UsePlateBuilderReturn {
  // State
  draftItems: Ref<PlateItemDraft[]>
  draftName: Ref<string>
  draftGroupCount: Ref<4 | 5>
  // Derived
  balance: ComputedRef<BalanceResult>
  hasItems: ComputedRef<boolean>
  canSave: ComputedRef<boolean>
  // Actions
  addFood(food: Food, group: FoodGroup): void
  removeFood(localId: string): void
  setGroupCount(count: 4 | 5): void
  resetDraft(): void
  clearItems(): void
  savePlate(): Promise<Plate>  // delegates to plateStore
  loadPlateIntoDraft(plate: Plate): void  // for edit mode
}

// PlateBuilderDrawer.vue props/emits
interface PlateBuilderDrawerProps {
  isOpen: boolean
  zIndexOffset?: number  // default 0, set to 100 when over picker
}
// emits: 'plate-created' (Plate), 'close'

// MealSlotPicker.vue props/emits
interface MealSlotPickerProps {
  isOpen: boolean
  weekStart?: string  // ISO, defaults to current week
}
// emits: 'select' ({ dayKey: DayKey, mealKey: MealKey }), 'skip', 'close'
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `usePlateBuilder` — isolated drafts, addFood, removeFood, savePlate delegation | vitest, mock `plateStore` |
| Unit | `MealSlotPicker` — emits correct day/meal on selection | vitest + vue-test-utils |
| Manual | Drawer open/close, z-index layering, FoodSearchModal over drawer | Browser testing on mobile + desktop |
| Manual | Full flow: Menu→Drawer→Save→Auto-assign→UI update | Browser E2E walkthrough |

## Migration / Rollout

No migration required. Pure frontend change. Feature is additive — existing flows remain intact. `PlateBuilderPage` refactor is backward-compatible since composable exposes the same interface the page already uses.

## Open Questions

- [x] All resolved during exploration and proposal phases.

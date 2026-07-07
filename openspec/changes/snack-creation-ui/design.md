# Design: Snack Creation UI (Mis Colaciones)

## Technical Approach

Frontend-only. Consume the shipped snack contracts (`POST /api/snacks` → `{ data, warnings }`,
`DELETE /api/snacks/:id`) via three new/extended Vue pieces mirroring the proven plate-builder trio:
a `useSnackBuilder` composable (isolated draft, no balance), a dedicated `SnackBuilderDrawer` +
`SnackVisualization` (3 groups: HEALTHY_FAT, CEREAL_TUBER, FRUIT), and a "Colaciones" tab inside
`PlateListPage` gated by `?tab=snacks`. `snackStore` gains `createSnack`/`deleteSnack` with optimistic
list sync so the MenuWeekPage picker sees new snacks. Answers spec REQ-SC1..SC7. Delivered as 3 chained PRs.

## Architecture Decisions

### Decision: Dedicated components over a mode flag

**Choice**: New `SnackBuilderDrawer.vue` + `SnackVisualization.vue` + `useSnackBuilder.ts`. Do NOT add
`mode: 'plate' | 'snack'` to the 644-line `PlateBuilderDrawer` nor stretch `PlateVisualization` to 3 zones.
**Alternatives rejected**: (A) mode flag on PlateBuilderDrawer — conditionals for balance-vs-warnings and
4/5-vs-3 groups throughout a dense file, high risk to shipped plates; (C) shared base + wrappers —
premature abstraction (YAGNI, no third builder).
**Rationale**: Snacks differ structurally (3 groups, no group-count toggle, no A/L balance, warnings
instead of a balance bar). Clean boundaries keep plate code untouched and mirror the proven
composable-per-context pattern (menu-snacks AD-1). `FoodSearchModal` is already group-agnostic, so ~80%
of food-selection UX is reused for free.

### Decision: `useSnackBuilder` owns isolated draft state (AD-1)

**Choice**: Composable-owned reactive draft per call-site (`draftName`, `draftItems`, `draftStageFor`,
`lastWarnings`), delegating persistence to `snackStore.createSnack`. No Pinia singleton draft.
**Alternatives rejected**: draft state in `snackStore` (Pinia singleton) — risks collision if a second
builder mounts; contradicts the usePlateBuilder precedent.
**Rationale**: Direct mirror of `usePlateBuilder`; each mount gets fresh state. Diverges from usePlateBuilder
by dropping balance/groupCount/serving-excess and adding age-driven suggested groups + reactive warnings.

### Decision: Warnings render ON-SAVE (not live) — RESOLVED

**Choice**: Surface REQ-SM4 warnings from the `createSnack` `{ data, warnings }` response after save
succeeds; show a non-blocking banner + keep the drawer decision to close. NO live preview.
**Alternatives rejected**: live preview driving `getMissingSnackGroups`/`getExtraSnackGroups` client-side
as the user builds.
**Rationale**: The backend is the single source of truth for warning text/logic; on-save avoids duplicating
age→warning derivation client-side (drift risk) and matches the shipped contract exactly (spec REQ-SC4
explicitly states "shown AFTER save succeeds, not live"). The shared helpers COULD later drive a live hint,
but that is deferred to keep one authority for warnings. Baby age still drives the *suggested-group emphasis*
in the builder (visual only), via `getSnackGroupsForAge(babyAgeMonths)`.

### Decision: Tab via `?tab=snacks` + extracted `SnackListSection` component

**Choice**: `PlateListPage` renders a Platos/Colaciones tab bar. Active tab derives from
`route.query.tab === 'snacks'`; switching calls `router.replace({ query: { tab } })` (URL-driven, no full
reload, shareable, back-button friendly). The snacks tab body is an extracted `SnackListSection.vue`
(grid + empty-state + load-more + tier upsell + delete-confirm + drawer host), NOT inlined into the
1168-line page.
**Alternatives rejected**: (a) local `ref` tab state — not shareable/linkable (fails REQ-SC1 scenarios);
(b) new `/snacks` route — spec locks it as a tab, not a route; (c) inline snack list in PlateListPage —
bloats an already 1168-line file and duplicates plate list markup.
**Rationale**: URL param satisfies all REQ-SC1 scenarios (direct link, back button, default). Extracting
`SnackListSection` keeps PlateListPage's diff to the tab bar + `<SnackListSection v-if>` mount (~80 lines),
isolates snack concerns, and keeps each PR reviewable.

### Decision: Tier gate mirrors PLATE_LIMITS via `SNACK_LIMITS` (FREE: 0) — RESOLVED

**Choice**: Add `SNACK_LIMITS: Record<UserTier, number> = { FREE: 0, PRO: Infinity }` to
`packages/shared/src/constants/tiers.ts` mirroring `PLATE_LIMITS`, and gate save/empty-state/upsell
exactly like PlateListPage (`atLimit = savedSnacks.length >= SNACK_LIMITS[tier]`).
**Alternatives rejected**: (a) hardcode `5` in the web layer — bypasses the shared tier source of truth;
(b) a distinct `FREE: 5` snack cap — contradicts the app's trial-first model where FREE is a lockout
(a FREE user could make 5 snacks but 0 plates — incoherent for the same user).
**Rationale**: RESOLVED by product — the frontend tier model is trial-first LOCKOUT (`PLATE_LIMITS.FREE = 0`,
every new user gets a 21-day PRO trial; FREE = expired/no subscription). Snacks MUST mirror this so the
Colaciones tab behaves identically to Mis Platos for the same user. NOTE: the backend snack/plate services
use a local `{ FREE: 5, PRO: Infinity }` that is effectively never hit for active (trial/PRO) users; the
authoritative client gate is the shared `SNACK_LIMITS`. This supersedes the spec's original "FREE max 5"
wording (spec REQ-SC6 updated to the trial-first lockout contract).

## Data Flow

    Build:   SnackBuilderDrawer ──(age)──> useSnackBuilder.suggestedGroups (getSnackGroupsForAge)
                    │  open per-group             │
                    ├──> FoodSearchModal ──addFood──> useSnackBuilder.draftItems ──> SnackVisualization
                    └──> Guardar ──> useSnackBuilder.saveSnack()
                                          └──> snackStore.createSnack(payload)
                                                └──> POST /api/snacks ──> { data, warnings }
                                                      ├─ savedSnacks.unshift(data)  (optimistic top)
                                                      └─ return { snack, warnings } ──> banner + close

    List:    PlateListPage(?tab=snacks) ──> SnackListSection ──> snackStore.savedSnacks / fetchSavedSnacks
    Delete:  card ──> confirm ──> snackStore.deleteSnack(id) ──> DELETE /api/snacks/:id ──> filter out

`savedSnacks` is the single Pinia list; MenuWeekPage's picker reads the same ref, so a created snack is
visible there without extra wiring (unshift keeps API descending order).

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/shared/stores/snackStore.ts` | Modify | Add `createSnack(payload): Promise<{snack, warnings}>` (POST, `unshift` on success, surface `warnings`), `deleteSnack(id)` (DELETE, filter out), `fetchMoreSnacks`, pagination state (`totalSnacks`, `currentPage`, `hasMore`), `canSave` getter — mirrors plateStore |
| `apps/web/src/shared/composables/useSnackBuilder.ts` | Create | Isolated draft (`draftName`, `draftItems`, `draftStageFor`, `saving`, `lastWarnings`); `suggestedGroups`/`isSuggested`; `addFood`/`removeFood`/`clear`/`resetDraft`; `isValid`/`canSave`; `saveSnack()→{snack,warnings}`. No balance, no groupCount |
| `apps/web/src/shared/components/SnackBuilderDrawer.vue` | Create | Right-side drawer: name input, optional stage selector, 3 age-driven group zones (suggested emphasized), `SnackVisualization`, on-save warnings banner, save/clear; hosts `FoodSearchModal` per group |
| `apps/web/src/modules/plates/components/SnackVisualization.vue` | Create | Dedicated 3-zone circular viz (HEALTHY_FAT/CEREAL_TUBER/FRUIT); no A/L balance indicator (REQ-SC7); matches plate style tokens |
| `apps/web/src/modules/plates/components/SnackListSection.vue` | Create | Colaciones tab body: snack card grid, empty-state (+tier hint), load-more, tier upsell, delete-confirm, `SnackBuilderDrawer` host |
| `apps/web/src/modules/plates/PlateListPage.vue` | Modify | Add Platos/Colaciones tab bar; derive active tab from `?tab=snacks`; `router.replace` on switch; mount `<SnackListSection v-if="activeTab==='snacks'">` |
| `packages/shared/src/constants/tiers.ts` | Modify | Add `SNACK_LIMITS` mirroring `PLATE_LIMITS` |
| `packages/shared/src/index.ts` | Modify | Barrel-export `SNACK_LIMITS` |
| `apps/web/src/modules/plates/components/FoodSearchModal.vue` | Reused | No change — pass `group=HEALTHY_FAT|CEREAL_TUBER|FRUIT` + group-filtered foods |

## Interfaces / Contracts

```ts
// useSnackBuilder return (mirrors usePlateBuilder, minus balance/groupCount)
export interface UseSnackBuilderReturn {
  draftName: Ref<string>
  draftItems: Ref<PlateItemDraft[]>        // reuse PlateItemDraft (foodId + groupAssignment)
  draftStageFor: Ref<PlateStage | null>
  saving: Ref<boolean>
  lastWarnings: Ref<string[]>              // populated on-save from response
  suggestedGroups: ComputedRef<FoodGroup[]> // getSnackGroupsForAge(ageMonths)
  isSuggested: (g: FoodGroup) => boolean
  isValid: ComputedRef<boolean>            // hasItems && name.trim() !== ''
  canSave: ComputedRef<boolean>            // authed && savedSnacks.length < SNACK_LIMITS[tier]
  addFood: (food: Food, group: FoodGroup) => void   // one per zone (replace)
  removeFood: (localId: string) => void
  clear: () => void
  resetDraft: () => void
  saveSnack: () => Promise<{ snack: Snack; warnings: string[] }>
}
export interface UseSnackBuilderOptions {
  ageMonths: Ref<number> | (() => number)  // from profileStore.activeProfile.birthDate → getAgeMonths
  onSaved?: (snack: Snack) => void
}

// snackStore additions
createSnack(payload: CreateSnackInput): Promise<{ snack: Snack; warnings: string[] }>
// POST /snacks → { data: Snack, warnings?: string[] }; savedSnacks.value.unshift(snack)
deleteSnack(id: string): Promise<void>   // DELETE /snacks/:id; savedSnacks = filter(id)
```

Baby age source: `profileStore.activeProfile?.birthDate → getAgeMonths(birthDate)` (same as MenuWeekPage
line 937 and PlateListPage line 233). No new age plumbing.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (shared) | `SNACK_LIMITS` values/shape | vitest, mirror `tiers.test.ts` PLATE_LIMITS block |
| Unit (composable) | `addFood` replaces per zone, `removeFood`, `isValid`, `canSave` at limit, `suggestedGroups` by age, `saveSnack` returns `{snack,warnings}` | vitest + mocked `snackStore.createSnack`; mock profile age; mirror usePlateBuilder tests |
| Unit (store) | `createSnack` unshifts + surfaces warnings, `deleteSnack` filters, `fetchMoreSnacks` appends | mock `apiClient` (post/delete/get); mirror plateStore tests + menu-snacks PR-1b store tests |
| Component (drawer) | 3 zones render, suggested emphasis, no balance bar (REQ-SC7), save disabled on empty name, on-save warnings banner | Vue Test Utils; mock `useSnackBuilder`/`FoodSearchModal` |
| Component (viz) | 3-zone render, no A/L indicator | Vue Test Utils, snapshot-light |
| Component (tab/section) | `?tab=snacks` activates tab, switch updates URL, empty-state, delete-confirm flow, tier upsell at limit | mount PlateListPage/SnackListSection with mocked router + snackStore |

Mock boundaries: `apiClient`, `snackStore`, `profileStore`, `FoodSearchModal`. Do NOT hit the network.

## PR Slicing + Size Forecast

- **PR-1** — `snackStore.createSnack/deleteSnack/fetchMoreSnacks` + `useSnackBuilder` + `SNACK_LIMITS`
  (shared) + unit tests. **~300 lines**. Isolated, no visible UI. **Budget: Low risk (~300 < 400).**
- **PR-2** — `SnackBuilderDrawer` + `SnackVisualization` + component tests. **~550 lines** (drawer chrome +
  viz SVG + warnings + wiring). Depends on PR-1, not yet reachable. **Budget: High risk — likely
  `size:exception`, OR split `SnackVisualization` (~180) into PR-2b.** Resolve at sdd-tasks.
- **PR-3** — `PlateListPage` tab wiring + `SnackListSection` + tests. **~350 lines**. Depends on PR-2,
  user-visible. **Budget: Medium risk (~350, close to 400).**

`Decision needed before apply: Yes` (PR-2 sizing). `Chained PRs recommended: Yes`.
`400-line budget risk: PR-1 Low, PR-2 High, PR-3 Medium`.

## Migration / Rollout

No migration. Frontend-only, additive: new files + additive store actions + one shared constant + a gated
tab. Revert per PR; reverting the tracker branch removes the feature with zero impact on plates or the
existing menu snack picker.

## Open Questions

- [x] **Tier cap value** — RESOLVED (product): `SNACK_LIMITS = { FREE: 0, PRO: Infinity }`, mirroring the
      trial-first `PLATE_LIMITS` lockout model. NOT a literal 5-cap. Spec REQ-SC6 updated to match.
- [ ] Confirm PR-2 `size:exception` vs splitting `SnackVisualization` into its own slice (delivery strategy).
- [ ] Delete confirmation UI: reuse an existing confirm modal or inline confirm — decide at tasks time.

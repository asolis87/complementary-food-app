# Proposal: Snack Creation UI (Mis Colaciones)

## Intent

Colaciones are clinically required for the 10-23m stage, and the archived **menu-snacks** change already shipped the *assignment* side: a first-class reusable `Snack` entity, backend CRUD (create/list/get/soft-delete), shared types/constants, and a snack picker inside the weekly menu. But that picker opens onto a dead end — its empty-state reads **"No tienes colaciones guardadas todavía"** and there is no way to create a snack from anywhere in the app. The loop is broken: users can *assign* snacks they can never *create*.

This change closes that loop. It is a **frontend-only** feature that adds the deferred "Mis Colaciones" experience to CREATE and DELETE reusable snacks, so the snacks then appear in the menu picker and can be assigned end-to-end. It consumes the backend and shared contracts that already shipped — no new backend routes, no schema changes.

Why now: menu-snacks intentionally deferred the build-UX to keep its PR budget in check, delivering assignment against an empty catalog. That catalog is only fillable via direct API calls today. This is the visible, promised follow-up that makes colaciones actually usable in the product.

## Scope

### In Scope
- **snackStore actions**: `createSnack` and `deleteSnack` (consuming the existing `POST /api/snacks` and `DELETE /api/snacks/:id`). `createSnack` surfaces the backend `{ data, warnings }` shape (REQ-SM4 composition warnings).
- **`useSnackBuilder` composable** (NEW): isolated draft state per call-site, mirroring the proven `usePlateBuilder` pattern — `draftItems`, `draftName`, `draftStageFor`, `addFood` / `removeFood`, `saveSnack` via snackStore. NO balance calculation; reactive `warnings` instead.
- **`SnackBuilderDrawer` component** (NEW): full-screen right-side drawer mirroring `PlateBuilderDrawer` but simpler — name input, age-driven 3-group build (no group-count toggle), `SnackVisualization`, warnings display, save/clear. Reuses `FoodSearchModal` for food selection per group.
- **`SnackVisualization` component** (NEW, dedicated): a 3-zone circular visualization for HEALTHY_FAT / CEREAL_TUBER / FRUIT. Standalone — does NOT touch `PlateVisualization`.
- **"Colaciones" tab** inside `apps/web/src/modules/plates/PlateListPage.vue`: a tab toggle (Platos / Colaciones) with a snack card grid, empty-state, and load-more, gated by a `?tab=snacks` URL param. NOT a new route.
- **Tier gate UX**: FREE users limited to 5 snacks (mirroring `PLATE_LIMITS`) — surfaced in the empty-state, a disabled save action at the cap, and an upsell banner, reusing the PlateListPage tier pattern.

### Out of Scope (deferred / non-goals)
- **Editing snacks.** No `updateSnack` action, no edit mode in the drawer, and explicitly **NO backend `PUT /api/snacks/:id` route**. A user who makes a mistake deletes the snack and recreates it. (Plates have edit parity; snacks intentionally do not for MVP — see Future Enhancements.)
- **Any backend change.** No new/modified routes, services, schemas, or migrations. This change is frontend-only against shipped contracts.
- **A/L balance / nutrition scoring for snacks.** No `balanceScore`, no balance bar, no BalanceIndicator — snacks use non-blocking composition warnings instead.
- Composition ENFORCEMENT — warnings are suggested-not-enforced and never block save.
- Auto-composition, snack suggestions rework, or migrating any existing data.

## Capabilities

### Modified Capabilities
- `snack-management`: adds the create + delete UI surface (store actions, builder composable, builder drawer, visualization) to the entity/catalog contract that menu-snacks shipped headless.
- `weekly-menu-plate-builder`: no code change, but the menu snack picker becomes functionally complete once the catalog is fillable from the UI.

## Approach

**Dedicated components over a mode flag.** Snacks and plates are fundamentally different (3 vs 4-5 groups, no A/L balance, warnings instead of a balance bar). Rather than add a `mode: 'plate' | 'snack'` flag to the already-dense (~644-line) `PlateBuilderDrawer` and stretch `PlateVisualization` to a 3-group layout — which would put existing 4/5-group plates at risk — we build a **dedicated `SnackBuilderDrawer` + `SnackVisualization` + `useSnackBuilder`** trio. This mirrors the plate builder's shape but simpler, keeps plate code untouched, and follows the proven composable-per-context pattern from menu-snacks (AD-1).

**Tab, not route.** "Mis Colaciones" lives as a tab inside `PlateListPage`, selected via a `?tab=snacks` URL param so the view is shareable and back-button friendly.

**Delivery = 3 chained PRs** on a tracker branch, mirroring how menu-snacks was shipped (feature-branch-chain):
- **PR-1** — snackStore `createSnack`/`deleteSnack` actions + `useSnackBuilder` composable + tests (~280 lines). Isolated, no visible UI.
- **PR-2** — `SnackBuilderDrawer` + `SnackVisualization` + tests (~550 lines; may need `size:exception`, evaluated at sdd-tasks). Depends on PR-1; not yet reachable via any route.
- **PR-3** — `PlateListPage` "Colaciones" tab + `?tab=snacks` routing + tests (~350 lines). Depends on PR-2; user-visible.

Each PR is autonomous, testable, and independently reversible.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/shared/stores/snackStore.ts` | Modified | Add `createSnack` (surfaces `{ data, warnings }`) + `deleteSnack` actions |
| `apps/web/src/shared/composables/useSnackBuilder.ts` | New | Isolated snack draft state; mirrors `usePlateBuilder` minus balance, plus warnings |
| `apps/web/src/shared/components/SnackBuilderDrawer.vue` | New | Snack build drawer (3 age-driven groups, warnings, save/clear); reuses `FoodSearchModal` |
| `apps/web/src/modules/plates/components/SnackVisualization.vue` | New | Dedicated 3-zone circular snack visualization (isolated from `PlateVisualization`) |
| `apps/web/src/modules/plates/PlateListPage.vue` | Modified | Add Platos/Colaciones tab, snack grid/empty-state/load-more, `?tab=snacks` param, tier upsell |
| `apps/web/src/modules/plates/components/FoodSearchModal.vue` | Reused | Group-filtered food selection, no change |
| `packages/shared` snack types/constants | Reused | `Snack`, `CreateSnackInput`, `getSnackGroupsForAge`, warnings helpers — already shipped |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| No-edit MVP frustrates users who mistype a name / pick wrong food | Med | Clear delete affordance + recreate flow; documented as intentional MVP scope; edit is the top Future Enhancement |
| Tier-cap UX (FREE max 5) is confusing if not surfaced clearly | Med | Reuse PlateListPage tier pattern: empty-state hint, disabled save at cap, upsell banner — consistent with plates |
| PR-2 (~550 lines) exceeds the 400-line PR budget | Med | Evaluate at sdd-tasks: `size:exception` or split `SnackVisualization` into its own slice |
| Duplicating list/empty/load-more for the snacks tab bloats `PlateListPage` | Low | Keep duplication small; extract a shared list fragment only if it exceeds ~100 lines |
| `SnackVisualization` diverges visually from the plate look | Low | Dedicated component by design; match plate styling tokens for consistency without coupling |

## Rollback Plan

Revert per PR. The feature is additive and frontend-only: new files (composable, drawer, visualization) plus additive store actions and a gated tab. No schema, backend, or shared-contract change to undo. Reverting the tracker branch removes the entire feature with zero impact on plates or the existing menu snack picker.

## Dependencies

- The archived **menu-snacks** change (backend snack CRUD, shared `Snack` types/constants, `snackStore.fetchSavedSnacks`, menu snack picker) — all shipped and on `main`.
- No PUT/update backend route exists for snacks; this change deliberately does not add one.

## Success Criteria

- [ ] From the "Colaciones" tab, a user can build a snack (grasa saludable + cereal/tubérculo [+ fruta by age]) and save it.
- [ ] A newly created snack immediately appears in the weekly-menu snack picker (empty-state "No tienes colaciones guardadas todavía" no longer shows once one exists) and can be assigned to a SNACK slot end-to-end.
- [ ] Backend composition warnings (REQ-SM4) are surfaced in the builder without blocking save.
- [ ] A user can delete a snack from the tab; there is no edit affordance anywhere (by design).
- [ ] FREE users are capped at 5 snacks with a clear disabled-save + upsell; existing plates and the plate builder are unaffected.

## Future Enhancements (explicit non-goals for this change)

- **Editing snacks**: backend `PUT /api/snacks/:id` + `updateSnack` action + drawer edit mode, for parity with plates.
- Possible extraction of a shared builder-drawer/list core if a third builder type ever appears (YAGNI for now).

## Open Questions (for spec/design)

- Tab routing leans to the `?tab=snacks` URL param (shareable, back-button friendly) as the default; confirm at spec/design unless a strong reason to prefer local-only state surfaces.
- Whether warnings are shown live during the build or only on the save-attempt response (`createSnack` returns `{ data, warnings }`) — a UX detail for design.

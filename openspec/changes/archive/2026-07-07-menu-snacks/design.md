# Design: Menu Snacks (Colaciones)

## Technical Approach

Add a first-class reusable `Snack` entity that mirrors the `Plate`/`PlateItem` infra, link it to a
meal slot via a new nullable `MenuMeal.snackId`, enforce plate/snack mutual-exclusion in the
existing `upsertMealSlot`, and un-hide the age-aware snack columns by driving the menu grid off
`getMealSlotsForAge` (already present, PR-13) instead of the `ACTIVE_MEAL_KEYS` hard filter.
All schema changes are additive `db-push` (new tables + nullable FK); `schema.prisma` is the artifact
(migrations are gitignored). Composition is suggested-not-enforced. This answers the proposal exactly;
PR-1 covers schema + backend + assignment + un-hide, deferring the "Mis Colaciones" catalog UI.

## Architecture Decisions

### Decision: Reusable `Snack` + `SnackItem` mirroring Plate

**Choice**: New `Snack { id, userId, babyProfileId?, name, stageFor?, items SnackItem[], createdAt, updatedAt, deletedAt }`
and `SnackItem { id, snackId, foodId, groupAssignment FoodGroup, servingAmount?, createdAt }`.
Reuse the `FoodGroup` enum (not a new 3-value enum); constrain to `HEALTHY_FAT | CEREAL_TUBER | FRUIT`
in the Zod app layer, not the DB.
**Alternatives rejected**: (a) Option B ephemeral inline items on `MenuMeal` — still needs a new table,
no reuse, larger upsert change; (b) new `SnackGroup` Prisma enum — `db-push` on Postgres handles enum
additions poorly and the 3 snack groups are a strict subset of `FoodGroup`, so app-layer validation is
lower-risk and keeps one enum source of truth (already sync-tested pattern).
**Rationale**: Mirroring Plate gives list/reuse/edit + a "Mis Colaciones" catalog for near-zero extra
cost, reuses `requireTier`/soft-delete/serialization patterns, and keeps the schema diff small.
Snack has NO `groupCount`/`balanceScore`/A-L counters (locked: no A/L for snacks).

### Decision: plateId/snackId mutual exclusion via upsert guard (not DB CHECK)

**Choice**: Enforce "a slot carries exactly one of plateId/snackId" inside `upsertMealSlot`. The payload
carries `plateId | snackId | null`; when setting `snackId`, the upsert writes `snackId` AND clears
`plateId: null` (and vice-versa). Which FK is legal is gated by whether `mealType` is a snack type
(`SNACK_1 | SNACK_2 | SNACK`) — reject a `plateId` on a snack slot and a `snackId` on a meal slot.
**Alternatives rejected**: DB `CHECK (plateId IS NULL OR snackId IS NULL)` — Prisma `db-push` cannot model
a cross-column CHECK cleanly and it is not expressible in `schema.prisma`; a DB trigger is overkill for
a single-writer service path.
**Rationale**: `upsertMealSlot` is the ONLY write path to a slot, so the invariant is enforceable in one
place with a clear 400 error, consistent with existing `NotFoundError('Plate')` ownership checks.

### Decision: Un-hide snack columns by retiring `ACTIVE_MEAL_KEYS`, relaxing the store

**Choice**: `MenuWeekPage.MEALS` already maps `getMealSlotsForAge(age)` → columns, so the grid is ALREADY
age-aware; the only blocker is `menuStore.menuMap` initializing/filtering slots by `ACTIVE_MEAL_KEYS`
(lines 99 & 113). Replace those two loops with all six `MealKey`s (or the age-driven set passed in) so
snack slots round-trip. Keep the `ACTIVE_MEAL_KEYS` export as a relaxed alias to avoid churn but stop
using it as a filter; fix `weekStats` TOTAL_SLOTS to derive from the visible meal count, not `7 * 3`.
**Call sites (4)**: `mealType.ts` (relax def to all keys or mark deprecated), `index.ts` (barrel keeps
export), `mealType.test.ts` (update the "exactly 3" assertions to the new contract), `menuStore.ts`
(stop filtering by it). `MenuWeekPage.vue` needs no MEALS change — only `MealDef.key` type widened to
include `snack1|snack2`.
**Alternatives rejected**: delete `ACTIVE_MEAL_KEYS` outright — breaks the barrel + store + test (4 refs)
for no gain; keep it as the grid driver — contradicts PR-13's age-aware slots (the root cause).
**Rationale**: Lowest-blast-radius reconciliation; `getMealSlotsForAge` is the single source of truth.

## Data Flow

    Snack catalog:  POST /api/snacks ──→ createSnack ──→ Snack + SnackItem[]
                    GET  /api/snacks ──→ getUserSnacks (paginated, soft-delete filtered)

    Assign snack:   MenuWeekPage (SNACK slot) ──→ menuStore.assignSnack
                        └─→ PATCH /menus/:id/meals { snackId } ──→ upsertMealSlot
                              └─ if snack mealType: set snackId, clear plateId
                              └─ MenuMeal ⇄ Snack(include items.food)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add `Snack`, `SnackItem`; add `MenuMeal.snackId String?` + `snack Snack? @relation(onDelete: SetNull)`; add `Snack`/`SnackItem` relations on `User`/`BabyProfile`/`Food` |
| `packages/shared/src/types/snack.ts` | Create | `Snack`, `SnackItem`, `SnackItemSummary`, `CreateSnackInput`; add `snackId`/`snack` to `MenuMealResponse` + `MealSlotPatch` (menu.ts) |
| `packages/shared/src/constants/snack.ts` | Create | `SNACK_GROUPS`, `getSnackGroupsForAge(months): FoodGroup[]`, `getMissingSnackGroups(items, months)` (suggest-not-enforce helper) |
| `packages/shared/src/constants/mealType.ts` | Modify | Relax `ACTIVE_MEAL_KEYS` (deprecate as filter); keep export |
| `packages/shared/src/index.ts` | Modify | Barrel-export snack types/constants |
| `apps/api/src/modules/snacks/snack.{service,schema,routes}.ts` | Create | Mirror plates module (create/list/get/soft-delete), Zod, REST |
| `apps/api/src/app.ts` | Modify | `register(snackRoutes, { prefix: '/api/snacks' })` |
| `apps/api/src/modules/menus/menus.{schemas,service}.ts` | Modify | `patchMealSchema` accepts `snackId`; `upsertMealSlot` handles snack path + mutual exclusion + snack ownership check + serialize snack |
| `apps/web/src/shared/stores/menuStore.ts` | Modify | Drop `ACTIVE_MEAL_KEYS` filter; add `getSnack`/`assignSnack`; `snackMap` |
| `apps/web/src/modules/menus/MenuWeekPage.vue` | Modify | Widen `MealKey`; route snack slots to snack picker/assign |

## Interfaces / Contracts

```prisma
model Snack {
  id String @id @default(cuid())
  userId String
  babyProfileId String?
  name String @default("Mi colación")
  stageFor PlateStage?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
  babyProfile BabyProfile? @relation(fields: [babyProfileId], references: [id], onDelete: SetNull)
  items SnackItem[]
  menuMeals MenuMeal[]
  @@index([userId, deletedAt])
}
model SnackItem {
  id String @id @default(cuid())
  snackId String
  foodId String
  groupAssignment FoodGroup   // app-validated: HEALTHY_FAT|CEREAL_TUBER|FRUIT
  servingAmount String?
  createdAt DateTime @default(now())
  snack Snack @relation(fields: [snackId], references: [id], onDelete: Cascade)
  food Food @relation(fields: [foodId], references: [id], onDelete: Restrict)
  @@index([snackId]) @@index([foodId])
}
// MenuMeal += snackId String?  snack Snack? @relation(onDelete: SetNull)
```

```ts
// packages/shared: suggested-not-enforced
export const SNACK_GROUPS = ['HEALTHY_FAT','CEREAL_TUBER','FRUIT'] as const
export function getSnackGroupsForAge(months: number): FoodGroup[] // <13m: [FAT,CEREAL]; ≥13m: +FRUIT
export function getMissingSnackGroups(items: {groupAssignment: FoodGroup}[], months: number): FoodGroup[]
// MealSlotPatch adds: snackId?: string | null
```

Snack routes: `POST /` + `PUT/DELETE /:id` under `requireTier('FREE')`, `GET /` + `GET /:id` under
`requireAuth` — identical tier posture to plates. No public `calculate-balance` (snacks have no A/L).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (shared) | `getSnackGroupsForAge`, `getMissingSnackGroups`, relaxed `ACTIVE_MEAL_KEYS` | pure vitest; update `mealType.test.ts` "exactly 3" → new contract |
| Sync (apps/api) | shared `SNACK_GROUPS` ⊂ Prisma `FoodGroup` | `snack-group-sync.test.ts` mirroring `plate-stage-sync.test.ts` |
| Unit (apps/api) | `createSnack`/`getUserSnacks` | `snack.service.test.ts` mirroring plates.service test |
| Unit (apps/api) | mutual exclusion: snack on meal slot rejected, plate on snack slot rejected, set snack clears plate | additions to `menus.service.test.ts` + `menus.schemas.test.ts` |
| Component (web) | snack slot renders/assigns; grid shows age-aware snack columns | `MenuWeekPage.test.ts`, `menuStore.test.ts` |

CI: `packages/shared` must NOT import `@prisma/client` (sync test lives in apps/api); rebuild shared
before api/web typecheck.

## PR-1 Slicing + Size Forecast

**Estimate**: schema (~40) + shared types/constants (~120) + snack module create/schema/routes (~220) +
app.ts (~2) + menus widening (~80) + shared menu.ts/index (~20) + web store+page un-hide (~120) + tests
(~250) ≈ **850–900 changed lines** → exceeds the 400-line budget. **Recommend a stacked split:**

- **PR-1a (schema + backend + shared)**: `schema.prisma`, `snack.ts` types/constants, snack module +
  app.ts, sync test, snack.service test, `getSnackGroupsForAge` tests. Autonomous, verifiable via API,
  no UI risk. ~500–550 lines (may itself warrant `size:exception` or a further sync/module split).
- **PR-1b (menu un-hide + assignment)**: `menus.schemas/service` widening + tests, `mealType.ts`
  relaxation + test, `menuStore`/`MenuWeekPage`. Depends on 1a's schema/types. ~300–350 lines.

Boundary rationale: 1a lands the persistence + catalog contract behind the existing (hidden) UI with zero
user-visible change; 1b flips visibility + wiring once the contract is stable. Clean rollback per slice.

## Migration / Rollout

Additive `db-push` only (new tables + nullable FK, `SetNull`). No data migration. Rollback = revert branch;
dropping the columns/tables is non-breaking to existing plates.

## Open Questions

- [ ] Snack build UX (per-group picker) is deferred; PR-1b assigns EXISTING snacks — confirm an empty
      "Mis Colaciones" list is acceptable UX until the catalog-build PR (empty-state affordance).
- [ ] Confirm `size:exception` vs the 1a/1b stacked split with the delivery strategy at tasks time.
- [ ] `weekStats.balanced` currently counts only plate `balanceScore`; snacks have no score — confirm
      snacks count toward `total`/`empty` but never `balanced`.

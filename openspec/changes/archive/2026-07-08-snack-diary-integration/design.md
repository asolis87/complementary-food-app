# Design: Snack Diary Integration (Serve a Snack from the Menu)

## Technical Approach

Close the plan→serve→track loop for colaciones by extending the EXISTING `serveMeal`
(`apps/api/src/modules/menus/menus.service.ts` L654–776) with a conditional snack branch, and by
adding a nullable `FoodLog.snackId` FK that mirrors `plateId` exactly. `MenuMeal.snackId` +
`Snack.items` already ship (menu-snacks). The transaction (replace-by-soft-delete, empty check,
`servedAt` stamp, return shape) stays shared; only the item source and which FK/label is written
diverge. Frontend is template-only: render the same serve affordance on SNACK_1/SNACK_2 slots
(desktop + mobile) reusing the already-slot-generic `menuStore.serveMeal(profileId, dayKey, mealKey)`.
Answers spec REQ-SD1..SD8.

## Architecture Decisions

### Decision: Extend serveMeal with a snack branch (not a new endpoint)
**Choice**: One conditional inside `serveMeal`: resolve `{ kind, items, plateBalanceLabel }` up front,
then run the existing transaction generically.
**Alternatives rejected**: a dedicated `serveSnack` service + `POST .../serve-snack` route.
**Rationale**: One served-state path (`MenuMeal.servedAt`), one replace/force/empty flow, one route the
frontend already calls. A fork would duplicate ownership + transaction + date logic and split the
served UX. Divergence is tiny (2 fields), so a branch is cheaper and lower-risk than an endpoint.

### Decision: `FoodLog.snackId String?` mirrors `plateId`, `onDelete: SetNull`
**Choice**: `snackId String?` + `snack Snack? @relation(fields: [snackId], references: [id], onDelete: SetNull)`
+ `@@index([snackId])` — byte-for-byte the `plateId` shape (schema L287/294/298).
**Alternatives rejected**: `onDelete: Cascade`; required (non-null) FK; a `sourceType` discriminator column.
**Rationale**: `SetNull` matches `plateId` and both existing `Snack` relations
(`Snack.user`/`babyProfile`, `MenuMeal.snack` all SetNull): deleting a snack must NOT delete diary
history — the log stays a valid plain `FoodLog`, losing only traceability. Nullable keeps the migration
additive/non-breaking. `MenuMeal` mutual exclusion (`upsertMealSlot`) already guarantees at most one of
`plateId`/`snackId`, so no DB-level XOR constraint is needed.

### Decision: `plateBalanceLabel` omitted (null) for snack entries
**Choice**: Snack branch does NOT set `plateBalanceLabel` (already nullable). Plate branch is unchanged
and still calls `derivePlateBalanceLabel(plate.balanceScore)`.
**Alternatives rejected**: computing an A/L label for snacks; a separate snack label field.
**Rationale**: Snacks have no A/L balance (3-group model, no `balanceScore`). Leaving it null is
semantically correct and requires zero plate-path change.

### Decision: Always include BOTH `plate` and `snack` in the MenuMeal query
**Choice**: Extend the existing `menuDay.findFirst` include (L668–691) to fetch `snack.items.food`
alongside `plate.items.food`, using the same `food` select. Do NOT branch the include by mealType.
**Alternatives rejected**: a second query/second `findFirst` for snack slots; conditional include.
**Rationale**: A slot has at most one of plate/snack, so the unused relation resolves to `null` at
near-zero cost — one query, no round-trip added. Branching the `include` shape complicates typing and
risks regressing the plate path. `resolveMealSlotFks`/`getWeekMenu` already prove `snack.items.food` is
fetchable identically to `plate.items.food`.

### Decision: Serve response shape unchanged; `snackId` is persistence-only
**Choice**: Keep `{ servedAt, entriesCount, replacedCount }` identical — no snack field. Do NOT add
`snackId` to `MealLog`/`CreateMealLogPayload` in `packages/shared`.
**Alternatives rejected**: adding `snackId?` to the serve response and/or the shared `MealLog` DTO.
**Rationale (resolves Open Q1)**: Nothing in the served flow or diary/dashboard render reads a snack
id — `getTodayLogs` is mealType-agnostic and surfaces entries by date+mealType. `snackId` is traceability
metadata only. Adding it now is speculative (YAGNI); defer until a snack-specific view needs it.

## serveMeal — refactored control flow

    serveMeal(...)
      ├─ assertOwnedMenu(userId, menuId)                    // unchanged
      ├─ assertOwnedBabyProfile(userId, babyProfileId)      // unchanged
      ├─ menuDay.findFirst({ include: { meals: { plate.items.food, snack.items.food } } })
      ├─ if !menuDay || meals.length === 0 → NotFoundError('Comida')
      ├─ menuMeal = meals[0]
      │
      ├─ RESOLVE SOURCE (new — replaces the L700 plate-only guard):
      │    if menuMeal.snackId && menuMeal.snack:
      │        assert snack.userId === userId  (else ForbiddenError)   // mirrors plate ownership posture
      │        source = { kind:'snack', items: snack.items, plateId:null, snackId: snack.id, label:null }
      │    elif menuMeal.plateId && menuMeal.plate:
      │        source = { kind:'plate', items: plate.items, plateId: plate.id, snackId:null,
      │                   label: derivePlateBalanceLabel(plate.balanceScore) }
      │    else → NotFoundError('No hay plato ni colación asignada a esta comida')
      │
      ├─ if servedAt && !force → AlreadyServedError(servedAt)         // unchanged, shared
      ├─ serveDate = computeServeDate(...)                            // unchanged, shared
      └─ $transaction:                                                // SHARED, generic over source
           updateMany soft-delete prior logs (userId+baby+date+mealType) → replacedCount
           if source.items.length === 0 → EmptyError (plate: existing; snack: 'La colación no tiene alimentos asignados')
           createMany: items.map → { userId, baby, foodId, date, mealType,
                                      plateId: source.plateId, snackId: source.snackId,
                                      plateBalanceLabel: source.label }
           menuMeal.update servedAt = now()
           return { servedAt, entriesCount, replacedCount }

Plate ownership today is implicit (plate reached only via an owned menu). Snacks are user-scoped
(`Snack.userId`), so the snack branch adds an explicit `snack.userId === userId` check for parity
(spec REQ-SD2: 403). Empty-snack copy `"La colación no tiene alimentos asignados"` mirrors
`EmptyPlateError` (400) per spec REQ-SD4.

## Data Flow

    Snack slot (MenuWeekPage) ──handleServeClick──> menuStore.serveMeal(profileId, dayKey, mealKey)
        └─ POST /api/menus/:menuId/meals/serve { dayOfWeek, mealType, babyProfileId }
             └─ serveMeal → snack branch → FoodLog[] (snackId set, plateBalanceLabel null) + servedAt
                  └─ getTodayLogs (mealType-agnostic) ──> Bitácora + Dashboard today  (no code change)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | `FoodLog`: add `snackId String?`, `snack Snack? @relation(fields:[snackId],references:[id],onDelete:SetNull)`, `@@index([snackId])`. Add `foodLogs FoodLog[]` back-relation to `Snack`. Apply via `prisma db push` (repo convention — Snack/MenuMeal.snackId shipped with no migration file). |
| `apps/api/src/modules/menus/menus.service.ts` | Modify | Extend `menuDay.findFirst` include with `snack.items.food`; replace L700 plate-only guard with source-resolution branch (+ snack ownership check + combined error); make the transaction generic over `plateId`/`snackId`/`label`; add `EmptySnackError` (400) or reuse a shared empty helper. |
| `apps/api/src/modules/menus/menus.routes.test.ts` | Modify | Add snack scenarios to `createMockPrisma` (menuMeal with `snackId`+`snack.items`); tests: 2-item, 3-item, empty snack, re-serve/force, neither-assigned error, ownership 403, plate-path regression. |
| `apps/web/src/modules/menus/MenuWeekPage.vue` | Modify | Add serve button + served state to the assigned-snack blocks (desktop L107–121 and mobile L348–358), mirroring the plate serve button (L156–168 / L388–399). Reuse `handleServeClick`/`getServeTooltip`/served copy. |
| `apps/web/src/modules/menus/MenuWeekPage.*.test.ts` | Modify/Create | Assert serve button renders on assigned snack slots (desktop + mobile), served state "Servido ✓", click wires `menuStore.serveMeal`, empty snack slot shows no serve button. |
| `apps/web/src/modules/diary/mealTypeOptions.test.ts` | Modify | Regression (REQ-SD8): `getMealTypeOptions` exposes SNACK_1 at 11m, SNACK_1+SNACK_2 at 15m, none at 8m — pins manual snack logging. |

No shared-type change (see Decision 5). `menuStore.serveMeal` unchanged (already slot-generic).

## Interfaces / Contracts

```prisma
model FoodLog {
  // ...existing...
  snackId String?
  snack   Snack? @relation(fields: [snackId], references: [id], onDelete: SetNull)
  @@index([snackId])
}
model Snack { /* ...existing... */ foodLogs FoodLog[] }
```

```ts
// internal to serveMeal — no exported API/DTO change
type ServeSource =
  | { kind: 'plate'; items: PlateItemWithFood[]; plateId: string; snackId: null; label: PlateBalanceLabel }
  | { kind: 'snack'; items: SnackItemWithFood[]; plateId: null; snackId: string; label: null }
// FoodLog.createMany row: { ...common, plateId, snackId, plateBalanceLabel: label }
```
Route/service signature `serveMeal(prisma, userId, menuId, payload, force)` and response
`{ servedAt, entriesCount, replacedCount? }` are UNCHANGED.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration (service, Prisma-mocked) | Serve 2-item snack → 2 FoodLogs (snackId set, label null); 3-item → 3; empty snack → 400; re-serve no force → 409; force → replaces (replacedCount); neither assigned → clear error; snack not owned → 403 | Extend `createMockPrisma` in `menus.routes.test.ts` with snack fixtures + `$transaction` mock (existing pattern) |
| Integration (regression) | Plate slot behaves byte-for-byte (plateId set, snackId null, label set); snack branch never entered on plate slots | Existing plate serve test kept + assert `snackId` absent |
| Component (menu) | Serve button renders on assigned snack slot (desktop + mobile); served → "Servido ✓"; empty snack slot → no serve button; click calls `menuStore.serveMeal` | Vue Test Utils, mock `menuStore` |
| Unit (diary regression) | `getMealTypeOptions`: SNACK_1 @11m, SNACK_1+SNACK_2 @15m, none @8m | Extend existing `mealTypeOptions.test.ts` |

No new E2E. Manual diary logging + dashboard display are covered by regression only (no code change).

## PR Slicing + Size Forecast

- **PR-1 backend** — schema (`FoodLog.snackId` + db push) + `serveMeal` snack branch + service/regression
  tests. **~230–280 lines.** Autonomous, no visible UI. **Risk: Low (< 400).**
- **PR-2 frontend** — serve button on snack slots (desktop + mobile) + menu component tests + diary
  `mealTypeOptions` regression test. Depends on PR-1. **~90–140 lines.** **Risk: Low.**

`Decision needed before apply: No` · `Chained PRs recommended: Yes` · `400-line budget risk: Low`.
Delivery: feature-branch chain, tracker branch off `release/etapa-10-23-meses`; PR-1 → tracker,
PR-2 → PR-1. No `size:exception` expected.

## Migration / Rollout

Additive, non-breaking: `FoodLog.snackId` is nullable, indexed, no backfill; applied via `prisma db push`
(matching how Snack/`MenuMeal.snackId` shipped — newest migration file is `warning_tags`). Rollback =
revert per PR. Dropping the nullable no-backfill column is safe: snack-served rows lose only traceability,
entries stay valid plain FoodLogs. Reverting the tracker branch removes the whole feature with zero impact
on plate serving or the menu snack picker.

## Open Questions

- [x] **Shared `snackId` exposure** — RESOLVED: persistence-only; NOT added to `MealLog`/`CreateMealLogPayload`
      (nothing renders it; `getTodayLogs` is mealType-agnostic). Add later only if a snack-specific view needs it.
- [x] **Combined no-assignment error copy** — RESOLVED: `"No hay plato ni colación asignada a esta comida"`
      (from proposal/spec REQ-SD2). Empty-snack copy: `"La colación no tiene alimentos asignados"` (400, REQ-SD4).

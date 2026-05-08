# Exploration: diary-day-centric-redesign

## Current State

### Prisma Schema (FoodLog / ReactionType)

The diary is modeled entirely around `FoodLog` — one row per food offered per meal. No "Day" entity exists.

**`ReactionType` enum** (prisma/schema.prisma + packages/shared/src/types/diary.ts):
```
LIKED | DISLIKED | NEUTRAL | ALLERGIC | GAS | RASH
```
This is a **single nullable enum column** (`reaction ReactionType?`) on `FoodLog`. There is no array, no JSON column — one reaction per row. Stool observations (`laxo`, `astringido`) do not exist anywhere in the schema.

**Key `FoodLog` fields**:
- `date DateTime @db.Date` — the logical day
- `mealType MealType` — BREAKFAST / LUNCH / DINNER / SNACK_1 / SNACK_2 / SNACK
- `reaction ReactionType?` — nullable, filled in after the meal
- `accepted Boolean?` — parental acceptance flag
- `notes String?` — free text per food entry
- `plateId String?` — optional link to a saved `Plate`
- `plateBalanceLabel String?` — A/L snapshot at log time
- No day-level entity exists; "day" is just the `date` column value

**Shared type mismatch discovered**: `packages/shared/src/types/user.ts` exports a legacy `Reaction` type (`LIKED | REJECTED | RASH | GAS | DIARRHEA | CONSTIPATION | VOMITING`) with `REACTION_LABELS`. This is NOT used by the diary module (diary.ts uses `ReactionType` enum) — it appears to be dead/orphaned code.

### API Module (apps/api/src/modules/diary/)

Files:
- `diary.routes.ts` — 4 endpoints: GET /api/diary, POST /api/diary, PATCH /api/diary/:id, DELETE /api/diary/:id, plus GET /api/diary/food-history
- `diary.schemas.ts` — Zod schemas; `createLogSchema` accepts `reaction: z.nativeEnum(ReactionType).optional()`
- `diary.utils.ts` — pure `aggregateFoodHistory()` function; references `ALLERGIC` and `RASH` by name in `hasAllergyReaction` logic
- `diary.utils.test.ts` — comprehensive unit tests; hardcode `ALLERGIC`, `GAS`, `RASH`, `LIKED`, `DISLIKED`, `NEUTRAL`

No day-level aggregation in the API. GET /api/diary returns flat FoodLog[], filtered by babyProfileId and date. Day grouping is done entirely in the Vue component.

### Vue Frontend (apps/web/src/modules/diary/)

Files:
- `DiaryPage.vue` — main view; day grouping computed inline
- `components/AddMealModal.vue` — renders all 6 ReactionType values: LIKED, DISLIKED, NEUTRAL, ALLERGIC, GAS, RASH
- `components/EditLogModal.vue` — also renders all 6 reactions
- Store: `apps/web/src/shared/stores/diaryStore.ts` — Pinia composition store

**Day-level summary card** exists but computes from FoodLog entries only: meal count, food count, food groups covered, allergen alerts. No stool info, no symptoms, no day notes.

**Day grouping**: `entriesForDate` computed filters by selectedDate. `groupedEntries` separates plateId-grouped entries from standalone. 100% client-side — no `/api/diary/day-summary` endpoint.

**Date navigation**: scrollable row of last-7-days chips. No week view or date param in route.

### Pinia Store

`diaryStore.ts`: `entries[]`, `selectedDate`, `entriesForDate`, `entriesGroupedByMeal`, `fetchEntries`, `logMeal`, `updateEntry`, `deleteEntry`, `setSelectedDate`. No day-observation state.

### PDF Generation

`apps/web/package.json` has **html2canvas@^1.4.1** already installed. No jspdf, pdfmake, or puppeteer anywhere. html2canvas usage not found in diary files — likely used elsewhere.

### Migration Risk

- Seed file seeds only Food records — zero FoodLog seed data
- No test fixtures with FoodLog rows
- POC/MVP phase — pre-launch, likely zero or near-zero real user FoodLog rows
- `diary.utils.test.ts` hardcodes ALLERGIC and RASH — will break if enum values are removed

---

## Affected Areas

| File | Why affected |
|------|-------------|
| `prisma/schema.prisma` | Add DayObservation model, modify/trim ReactionType enum |
| `packages/shared/src/types/diary.ts` | ReactionType enum change; new DayObservation types |
| `packages/shared/src/types/user.ts` | Legacy Reaction type — cleanup/alignment needed |
| `apps/api/src/modules/diary/diary.routes.ts` | New CRUD endpoints for DayObservation |
| `apps/api/src/modules/diary/diary.schemas.ts` | New Zod schemas for day observation |
| `apps/api/src/modules/diary/diary.utils.ts` | aggregateFoodHistory references ALLERGIC and RASH by name |
| `apps/api/src/modules/diary/diary.utils.test.ts` | Tests use ALLERGIC, RASH, GAS — need updating if enum changes |
| `apps/web/src/modules/diary/DiaryPage.vue` | Day summary card redesign; new Day Observation section |
| `apps/web/src/modules/diary/components/AddMealModal.vue` | Remove ALLERGIC/GAS/RASH; keep 4 acceptance reactions |
| `apps/web/src/modules/diary/components/EditLogModal.vue` | Same |
| `apps/web/src/shared/stores/diaryStore.ts` | Add day observation state and actions |
| `prisma/migrations/` | New migration for schema changes |

---

## Open Questions for Propose Phase

1. **DayObservation table vs JSON column**: Separate Prisma model (normalized, queryable) vs nullable JSON on FoodLog (simpler, tech debt). Separate table is the clean choice.

2. **Stool field cardinality**: Single-select enum (normal | laxo | astringido | no_hubo) vs multi-select. Single per day is clinically sufficient.

3. **Symptoms field structure**: Fixed PostgreSQL String[] column vs relational DaySymptom join table. String[] is simpler; join table is extensible.

4. **ReactionType migration path**: (a) keep old enum values hidden from UI (non-breaking), (b) nullify old reaction values in migration + backfill to day observations, (c) rename values. Given POC data volume, option (b) is viable.

5. **aggregateFoodHistory post-migration**: `hasAllergyReaction` currently flags `ALLERGIC | RASH`. If those move to day observations, what replaces this food-level signal? The plate builder uses this for allergen history display.

6. **Day summary view as entry point or sub-route**: Replace DiaryPage.vue entirely, or create /diary/:date sub-route?

7. **PDF library**: html2canvas already installed. Options: (a) html2canvas + CSS @media print — zero extra bundle, fragile on mobile Safari; (b) jspdf + existing html2canvas — ~300KB gzipped, good control, well-tested pattern; (c) pdfmake — ~1MB, programmatic layout only. Likely winner: jspdf + html2canvas.

8. **Export scope**: Day only, or week? Week scope needs a multi-day API endpoint.

9. **DayObservation UX entry point**: Dedicated bottom sheet from summary card CTA, or inline edit within the card?

---

## Approaches

### Approach A — Separate `DayObservation` Table (recommended)
- Pros: normalized, queryable, clean hexagonal entity, future-proof
- Cons: adds new DB table and CRUD surface
- Effort: Medium

### Approach B — JSON Column on FoodLog (not recommended)
- Pros: no new table
- Cons: semantic overload, no type safety, tech debt
- Effort: Low

### Approach C — New `DiaryDay` Table replacing FoodLog.date
- Pros: fully day-centric model
- Cons: large migration, all API queries change
- Effort: High

**Recommendation**: Approach A. Preserves FoodLog, adds minimum surface, follows screaming architecture (new domain entity).

---

## Risks

1. **ReactionType enum mutation in PostgreSQL**: Removing enum values requires raw SQL ALTER TYPE — Prisma cannot auto-generate this.
2. **diary.utils.test.ts coupling**: Tests hardcode 'ALLERGIC', 'RASH', 'GAS' — enum change requires test updates.
3. **html2canvas mobile Safari**: Known issues with fixed/sticky elements and SVG on iOS Safari.
4. **FoodHistory.hasAllergyReaction semantic breakage**: Plate builder uses this signal for allergen display. Removing ALLERGIC/RASH from ReactionType breaks it unless alternative devised.
5. **No existing day-level route**: New API endpoint required; current client re-fetches per date change.

---

## Ready for Proposal
Yes — enough codebase knowledge to design the DayObservation entity, the reaction enum trim, and the PDF approach.

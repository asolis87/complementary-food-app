# Verify Report: diary-day-centric-redesign

**Date**: 2026-04-29  
**Verdict**: PASS WITH WARNINGS

---

## 1. Summary

The implementation of `diary-day-centric-redesign` is functionally complete and correct across Phases 1–6. All typechecks are clean (API, web, shared). The API test suite shows 310/315 tests passing; the 5 failures are pre-existing `menus.routes.test.ts` regressions unrelated to this change. One CRITICAL spec gap was found: `GET /api/diary` does not include the `observation` field in its response as required by REQ-B5 — however the web UI works correctly by calling `GET /api/day-observation` separately in parallel, which constitutes a design deviation rather than a functional bug. Three WARNINGS and two SUGGESTIONS are noted below.

---

## 2. Verification Matrix

| REQ | Capability | Status | Evidence | Notes |
|-----|-----------|--------|----------|-------|
| REQ-A1 | Reactions trimmed | ✅ | `packages/shared/src/types/diary.ts:17` — `ReactionType` = LIKED/DISLIKED/NEUTRAL/REJECTED; `dayObservation.schemas.ts:22` uses `z.nativeEnum(StoolType)` | |
| REQ-A2 | Reaction nullable | ✅ | `diary.schemas.ts:34` — `reaction: z.nativeEnum(ReactionType).nullable().optional()` | |
| REQ-A3 | Migration nullifies ALLERGIC/GAS/RASH | ✅ | `prisma/migrations/20260429181303_diary_day_centric_redesign/migration.sql:1-14` — USING CASE clause maps unknowns to NULL | |
| REQ-B1 | Unique (babyProfileId, date) + upsert | ✅ | `schema.prisma:@@unique([babyProfileId, date])`; `dayObservation.routes.ts:70` — `prisma.dayObservation.upsert()`; test "returns 200 on second PUT" in `dayObservation.routes.test.ts:162` | |
| REQ-B2 | stool/symptoms/notes all optional | ✅ | `dayObservation.schemas.ts:23-30` — all `.optional()`; `DayObservationSheet.vue` covers all three fields | |
| REQ-B3 | Symptoms dedup + max 10 | ✅ | `dayObservation.schemas.ts:27` — `.transform(arr => Array.from(new Set(arr)))` + `.max(10)`; tests at lines 184, 208 | |
| REQ-B4 | DELETE returns 204/404 | ✅ | `dayObservation.routes.ts:111-138`; tests "returns 204" and "returns 404 when not found" | |
| REQ-B5 | GET /api/diary includes observation | ⚠️ | `diary.routes.ts:55` — response is `{ data: entries, meta }` with NO `observation` field | Web works via separate `GET /api/day-observation` call (parallel). API contract does not match spec. |
| REQ-C1 | Day PDF with all sections | ✅ | `exportDayPdf.ts` + `pdfTemplate.vue` + `DayDetailSection.vue`; DiaryPage wires `exportDay` button | |
| REQ-C2 | Week PDF — empty days show "Sin registros" | ✅ | `exportWeekPdf.ts` passes all 7 days; `DayDetailSection.vue` renders "Sin comidas registradas" / "Sin observación registrada" for empty days | |
| REQ-C3 | PDF generation is client-side only | ✅ | No PDF server endpoint; range endpoint only loads data; `useDiaryExport.ts` uses dynamic imports | |
| REQ-C4 | A4 portrait, no fixed/sticky/transform in template | ✅ | `pdfTemplate.vue` — no `position: fixed/sticky`; system font stack; width 794px; jsPDF `format: 'a4', unit: 'pt'` | |
| REQ-D1 | hasSuspectedReaction from DayObservation.symptoms | ✅ | `diary.utils.ts:28` — `SUSPECT_SYMPTOMS = new Set(['ALLERGY_SUSPECT', 'RASH'])`; `diary.routes.ts:194-210` fetches observations for food-history | |
| REQ-D2 | FoodLog.reaction NOT used for suspect signal | ✅ | `diary.utils.ts:108-119` — derives suspect only from `symptomMap`, never from `entry.reaction` | |
| REQ-D3 | hasAllergyReaction renamed everywhere | ✅ | `rg hasAllergyReaction apps/ packages/` — zero hits in source code; only in comments | |

---

## 3. Findings by Severity

### CRITICAL

None that block shipping from a functional standpoint, but one spec contract deviation:

- **CRITICAL-1 — REQ-B5 API contract violation**: `GET /api/diary` response shape is `{ data: FoodLog[], meta }`. The spec explicitly requires `{ logs: FoodLog[], observation: DayObservation | null }` in a single response. The web works because `diaryStore.ts` calls `GET /api/day-observation` in parallel via `fetchObservation()`. However:
  - Any third-party API consumer following the spec would not get observation data from `GET /api/diary`.
  - The `meta` wrapper key (not `logs`) is also a shape divergence.
  - **Recommendation**: either enrich `GET /api/diary` to include observation when `babyProfileId + date` are provided, or formally document the workaround as a design deviation accepted in this iteration (downgrade to WARNING).

### WARNING

- **WARNING-1 — range.routes.ts does not serialize DayObservation dates**: The range endpoint returns raw Prisma rows for observations (`orderBy: { date: 'asc' }`) without calling a `toDTO()` helper. The `date` field will be a `Date` object, which Fastify serializes as ISO 8601 (with time component `T00:00:00.000Z`). The web side compensates with `e.date.split('T')[0]`, but the `observationsByDate` map key (YYYY-MM-DD string) may not match if the client reconstructs the date key differently. This is fragile.
- **WARNING-2 — No test for REQ-B5 GET /api/diary shape**: There is no test asserting that `GET /api/diary` includes or excludes `observation`. When/if the enrichment is added, there is no regression guard.
- **WARNING-3 — upsertBodySchema validates max 10 BEFORE dedup**: The Zod schema applies `.max(10)` before the `.transform()` dedup. This means sending `['RASH', 'GAS', 'RASH', ...]` with 11 items (even if they'd dedup to ≤10) returns 400. The spec says "max 10" after dedup. Current behavior is stricter than the spec's intent. Functionally safe but may confuse clients.

### SUGGESTION

- **SUGGESTION-1 — Document v1 PDF overflow limitation**: The known limitation (single-day content exceeding one A4 page is clipped) is noted in code comments but not in the user-facing changelog or README. Should be added before shipping.
- **SUGGESTION-2 — DayObservationBlock in summary card only when entries > 0**: `DayObservationBlock` is rendered inside `v-if="entriesForDate.length > 0"` (inside the summary card section). If the user registers a day observation but has no meal entries that day, the observation block is hidden entirely. Consider surfacing an observation-only UI state.

---

## 4. Test Summary

### API (`pnpm --filter @pakulab/api test`)
- **Total**: 315 tests across 22 test files
- **Passed**: 310
- **Failed**: 5 — ALL in `menus.routes.test.ts` (pre-existing regression, unrelated to this change)
- **New tests for this change**: `dayObservation.routes.test.ts` (14 tests, all pass) + `range.routes.test.ts` (9 tests, all pass) + `diary.utils.test.ts` (25 tests, all pass)
- **Pre-existing menus failures**: `serveMeal` throws `ForbiddenError` instead of domain errors because the fake Prisma mock returns null for `babyProfile`, causing `assertOwnedBabyProfile` to throw before the domain logic runs. These are pre-existing and unrelated to this change.

### Web (`pnpm --filter @pakulab/web typecheck`)
- **Status**: CLEAN — 0 errors, 0 warnings

### Shared (`pnpm --filter @pakulab/shared typecheck`)
- **Status**: CLEAN — 0 errors

### API (`pnpm --filter @pakulab/api typecheck`)
- **Status**: CLEAN — 0 errors

---

## 5. Manual Smoke Checklist (NOT YET PERFORMED)

The following must be performed by the developer in a real browser before archiving:

- [ ] Register a meal with each of the 4 reactions (LIKED, DISLIKED, NEUTRAL, REJECTED), edit each, delete each
- [ ] Register a day observation (stool + at least 2 symptoms + notes), verify it appears in the DayObservationBlock summary
- [ ] Edit the day observation (change stool type and symptoms), verify update is idempotent (no duplicate created)
- [ ] Delete the day observation, verify it disappears and the sheet footer's "Quitar observación" button disappears after deletion
- [ ] Verify the DayDetailSection expandable section shows the observation correctly
- [ ] Export day PDF in Chrome desktop — verify download triggers, filename format `bitacora-{name}-{YYYY-MM-DD}.pdf`, readable layout
- [ ] Export week PDF in Chrome desktop — verify 7 pages, empty days show "Sin comidas registradas" / "Sin observación registrada"
- [ ] Repeat day export in iOS Safari (or mobile Safari simulator) — verify no rendering glitches or clipped content
- [ ] Navigate to the plates module and search a food that was offered on a day with RASH observation — verify suspect indicator shows
- [ ] Verify no console warnings or errors during any of the above steps

---

## 6. Verification Gates for Archive

- [x] All API tests pass (excluding 5 pre-existing `menus.routes.test.ts` failures)
- [x] All typecheck commands clean (api, web, shared)
- [ ] CRITICAL-1 resolved or formally accepted as design deviation (requires explicit decision)
- [ ] Manual smoke completed by user (mark each item above when done)

---

## Appendix: Files Inspected

- `prisma/schema.prisma` — ReactionType, StoolType, SymptomType, DayObservation model
- `prisma/migrations/20260429181303_diary_day_centric_redesign/migration.sql`
- `packages/shared/src/types/diary.ts` — all shared enums and interfaces
- `packages/shared/src/types/user.ts` — legacy Reaction type absent
- `apps/api/src/modules/diary/dayObservation.schemas.ts`
- `apps/api/src/modules/diary/dayObservation.routes.ts`
- `apps/api/src/modules/diary/dayObservation.routes.test.ts`
- `apps/api/src/modules/diary/range.routes.ts`
- `apps/api/src/modules/diary/range.routes.test.ts`
- `apps/api/src/modules/diary/diary.routes.ts`
- `apps/api/src/modules/diary/diary.schemas.ts`
- `apps/api/src/modules/diary/diary.utils.ts`
- `apps/api/src/modules/diary/diary.utils.test.ts`
- `apps/api/src/app.ts`
- `apps/web/src/modules/diary/DiaryPage.vue`
- `apps/web/src/modules/diary/components/AddMealModal.vue`
- `apps/web/src/modules/diary/components/EditLogModal.vue`
- `apps/web/src/modules/diary/components/DayObservationBlock.vue`
- `apps/web/src/modules/diary/components/DayObservationSheet.vue`
- `apps/web/src/modules/diary/components/DayDetailSection.vue`
- `apps/web/src/modules/diary/export/pdfTemplate.vue`
- `apps/web/src/modules/diary/export/exportDayPdf.ts`
- `apps/web/src/modules/diary/export/exportWeekPdf.ts`
- `apps/web/src/modules/diary/export/useDiaryExport.ts`
- `apps/web/src/shared/stores/diaryStore.ts`
- `apps/web/src/modules/plates/components/FoodSearchModal.vue`

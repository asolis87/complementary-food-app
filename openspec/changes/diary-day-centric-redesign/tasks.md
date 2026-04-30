# Tasks: diary-day-centric-redesign

## Phase 1 — Schema and migration

- [ ] 1. Update `prisma/schema.prisma`: trim `ReactionType` (remove ALLERGIC, GAS, RASH), add `StoolType` and `SymptomType` enums, add `DayObservation` model with cascade delete, `@@unique([babyProfileId, date])` and `@@index([babyProfileId, date])`; add back-relation `dayObservations DayObservation[]` to `BabyProfile`.
  - Files: `prisma/schema.prisma`
  - Acceptance: `npx prisma validate` passes with no errors
  - Spec: REQ-A1, REQ-B1, REQ-B2, Design § 1

- [ ] 2. Generate migration skeleton via `prisma migrate dev --name diary_day_centric_redesign --create-only`, then replace the auto-generated SQL with the rename-and-recreate pattern from Design § 2 (USING-clause for enum swap, explicit DayObservation DDL). Commit the `.sql` file unchanged.
  - Files: `prisma/migrations/<timestamp>_diary_day_centric_redesign/migration.sql`
  - Acceptance: SQL contains `RENAME TO "ReactionType_old"`, USING-clause, `CREATE TABLE "DayObservation"`, both indexes; no `prisma validate` warnings
  - Spec: REQ-A3, Design § 2

- [ ] 3. Apply migration locally (`prisma migrate dev`), then regenerate the Prisma client (`prisma generate`). Fix any compile errors in `apps/api` that arise from the removed enum values.
  - Files: generated client at `node_modules/.prisma/client`; compile fix in any `.ts` file referencing `ALLERGIC | GAS | RASH` on `ReactionType`
  - Acceptance: `pnpm --filter @pakulab/api tsc --noEmit` passes
  - Spec: REQ-A3

---

## Phase 2 — Shared types

- [ ] 4. Update `packages/shared/src/types/diary.ts`: (a) trim `ReactionType` enum to `LIKED | DISLIKED | NEUTRAL | REJECTED`, (b) add `StoolType`, `SymptomType` enums, (c) add `DayObservation` interface, (d) rename `hasAllergyReaction` → `hasSuspectedReaction` in `FoodHistory`, (e) add `REJECTED` to `ReactionType` if not present.
  - Files: `packages/shared/src/types/diary.ts`
  - Acceptance: no TypeScript errors; `hasAllergyReaction` does NOT appear in file
  - Spec: REQ-A1, REQ-D3, Design § 8

- [ ] 5. Remove legacy `Reaction` type and `REACTION_LABELS` (if present) from `packages/shared/src/types/user.ts`; fix any orphan imports across the monorepo.
  - Files: `packages/shared/src/types/user.ts`; any consumer files (`rg "Reaction" packages/shared`)
  - Acceptance: `pnpm --filter @pakulab/shared tsc --noEmit` passes; `rg "hasAllergyReaction"` returns zero results
  - Spec: REQ-D3, Design D9

---

## Phase 3 — API

- [ ] 6. Create `apps/api/src/modules/diary/dayObservation.schemas.ts` with Zod schemas: `upsertBodySchema` (babyProfileId, date, stool?, symptoms max-10 with dedup transform, notes max-500?), `getQuerySchema`, `deleteQuerySchema`.
  - Files: `apps/api/src/modules/diary/dayObservation.schemas.ts`
  - Acceptance: unit test `dayObservation.schemas.test.ts` covers: valid upsert, symptoms dedup, symptoms > 10 → fail, invalid date format → fail
  - Spec: REQ-B2, REQ-B3, Design § 3

- [ ] 7. Create `apps/api/src/modules/diary/dayObservation.routes.ts` with `GET /api/day-observation`, `PUT /api/day-observation` (Prisma upsert, always 200), `DELETE /api/day-observation` (204 or 404); all require `requireAuth`; register routes in the diary module entrypoint.
  - Files: `apps/api/src/modules/diary/dayObservation.routes.ts`; diary module entrypoint (e.g. `diary.module.ts` or equivalent)
  - Acceptance: PUT twice same (babyProfileId, date) does not create duplicates; DELETE missing returns 404
  - Spec: REQ-B1, REQ-B4, Design § 3

- [ ] 8. Create `apps/api/src/modules/diary/range.routes.ts` with `GET /api/diary/range`; Zod `rangeQuerySchema` with 31-day cap refine; response shape `{ logs: FoodLogDTO[], observations: DayObservationDTO[] }`.
  - Files: `apps/api/src/modules/diary/range.routes.ts`; diary module entrypoint
  - Acceptance: range > 31 days returns 400; `to < from` returns 400; valid range returns 200 with both arrays
  - Spec: REQ-C3, Design § 3

- [ ] 9. Update `apps/api/src/modules/diary/diary.utils.ts`: rewrite `aggregateFoodHistory` to accept `observations: DayObservation[]` param, build `symptomMap`, derive `hasSuspectedReaction` from `ALLERGY_SUSPECT | RASH` only; remove all logic referencing old enum values.
  - Files: `apps/api/src/modules/diary/diary.utils.ts`
  - Acceptance: function signature matches Design § 4; `hasAllergyReaction` absent from file
  - Spec: REQ-D1, REQ-D2, Design § 4

- [ ] 10. Update `apps/api/src/modules/diary/diary.utils.test.ts`: replace fixtures using `ALLERGIC/GAS/RASH` with new model; add test cases covering `hasSuspectedReaction=true` (ALLERGY_SUSPECT, RASH), `=false` (GAS only, no observation, DISLIKED reaction without observation).
  - Files: `apps/api/src/modules/diary/diary.utils.test.ts`
  - Acceptance: `pnpm --filter @pakulab/api test -- diary.utils` all green
  - Spec: REQ-D1, REQ-D2

- [ ] 11. Update `apps/api/src/modules/diary/diary.schemas.ts`: trim `ReactionType` enum references in `createLogSchema` and `updateLogSchema` to the 4 valid values; remove `ALLERGIC | GAS | RASH` from allowed values.
  - Files: `apps/api/src/modules/diary/diary.schemas.ts`
  - Acceptance: POST with `reaction: "ALLERGIC"` returns 422
  - Spec: REQ-A1

- [ ] 12. Enrich `GET /api/diary` response with `observation: DayObservationDTO | null` — query DayObservation for the requested (babyProfileId, date) alongside food logs; pass `observations` array to `aggregateFoodHistory`.
  - Files: `apps/api/src/modules/diary/diary.routes.ts`
  - Acceptance: GET with existing observation returns `{ logs: [...], observation: {...} }`; GET without observation returns `{ logs: [...], observation: null }`
  - Spec: REQ-B5

- [ ] 13. Find and rename all occurrences of `hasAllergyReaction` in `apps/api` (plate builder, food history consumers) to `hasSuspectedReaction` via `rg "hasAllergyReaction" apps/api`.
  - Files: any file under `apps/api` referencing `hasAllergyReaction`
  - Acceptance: `rg "hasAllergyReaction" apps/api` returns zero results
  - Spec: REQ-D3

- [ ] 14. Create `apps/api/src/modules/diary/dayObservation.routes.test.ts`: integration tests for PUT idempotency (create then update same date), GET with/without observation, DELETE 204, DELETE 404, 401 on all three endpoints, 422 on symptoms > 10.
  - Files: `apps/api/src/modules/diary/dayObservation.routes.test.ts`
  - Acceptance: `pnpm --filter @pakulab/api test -- dayObservation` all green
  - Spec: REQ-B1, REQ-B3, REQ-B4

---

## Phase 4 — Web shared types and store

- [ ] 15. Update `apps/web/src/shared/stores/diaryStore.ts`: add state `observationsByDate: Ref<Map<string, DayObservation>>`, add actions `fetchObservation(date)`, `upsertObservation(payload)`, `deleteObservation(date)`, `fetchRange(from, to)`; refactor `setSelectedDate` to use `Promise.all([fetchEntries(date), fetchObservation(date)])`.
  - Files: `apps/web/src/shared/stores/diaryStore.ts`
  - Acceptance: `pnpm --filter @pakulab/web tsc --noEmit` passes; `setSelectedDate` makes parallel requests
  - Spec: REQ-B5, Design § 7

---

## Phase 5 — UI components

- [ ] 16. Update `apps/web/src/modules/diary/components/AddMealModal.vue`: render only 4 reaction buttons (`LIKED | DISLIKED | NEUTRAL | REJECTED`); remove any reference to `ALLERGIC | GAS | RASH`; update display strings/icons accordingly.
  - Files: `apps/web/src/modules/diary/components/AddMealModal.vue`
  - Acceptance: modal renders 4 buttons; no runtime console errors about unknown enum values
  - Spec: REQ-A1

- [ ] 17. Update `apps/web/src/modules/diary/components/EditLogModal.vue`: same changes as task 16 — trim to 4 reactions, remove obsolete values; ensure `null` reaction is still selectable (REQ-A2).
  - Files: `apps/web/src/modules/diary/components/EditLogModal.vue`
  - Acceptance: selecting "sin reacción" persists `reaction: null`
  - Spec: REQ-A1, REQ-A2

- [ ] 18. Create `apps/web/src/modules/diary/components/DayObservationBlock.vue`: read-only summary chip showing stool icon + symptom count; emits `click` to open the sheet; shows "Sin observación" state when observation is null.
  - Files: `apps/web/src/modules/diary/components/DayObservationBlock.vue`
  - Acceptance: renders without observation (null), with partial data, with full data; no layout shift
  - Spec: REQ-B5, Design § 5.1

- [ ] 19. Create `apps/web/src/modules/diary/components/DayObservationSheet.vue`: bottom sheet matching AddMealModal style; stool radio chips (4 values), symptoms multi-select chips (max 10, dedup enforced in UI), notes textarea (500 char limit with counter); Save → `upsertObservation`; "Quitar observación del día" → `deleteObservation` (visible only when observation exists).
  - Files: `apps/web/src/modules/diary/components/DayObservationSheet.vue`
  - Acceptance: Save calls PUT and closes sheet; delete shows confirm then calls DELETE; symptoms UI blocks 11th selection
  - Spec: REQ-B1, REQ-B2, REQ-B3, REQ-B4, Design § 5.2

- [ ] 20. Create `apps/web/src/modules/diary/components/DayDetailSection.vue`: pure presentational component; props `{ logs: MealLog[], observation: DayObservation | null, babyProfile: BabyProfile, date: string }`; renders meals list with reaction chip and notes, observation section with stool + symptoms + notes; no store calls.
  - Files: `apps/web/src/modules/diary/components/DayDetailSection.vue`
  - Acceptance: component accepts all props; no Pinia imports; renders correctly with observation=null
  - Spec: REQ-C1, Design § 5.3

- [ ] 21. Update `apps/web/src/modules/diary/DiaryPage.vue`: integrate `DayObservationBlock` into DaySummaryCard area with CTA "Registrar observación" that opens `DayObservationSheet`; add export dropdown menu ("Exportar día (PDF)", "Exportar semana (PDF)") wired to `useDiaryExport`; embed `DayDetailSection` as expandable section.
  - Files: `apps/web/src/modules/diary/DiaryPage.vue`
  - Acceptance: sheet opens/closes correctly; export buttons visible; DayDetailSection renders below meals; `pnpm --filter @pakulab/web tsc --noEmit` passes
  - Spec: REQ-B2, REQ-C1, REQ-C2, Design § 5.1

---

## Phase 6 — PDF export

- [ ] 22. Add `jspdf` to `apps/web/package.json` (check if workspace-level first); verify `html2canvas` is already present.
  - Files: `apps/web/package.json` (or root `package.json`)
  - Acceptance: `pnpm install` succeeds; `import jsPDF from 'jspdf'` resolves in TS
  - Spec: REQ-C3, Design § 6

- [ ] 23. Create `apps/web/src/modules/diary/export/pdfTemplate.vue`: off-screen A4 Vue component (`position: absolute; left: -9999px; width: 794px; background: #fff`); accepts same props as `DayDetailSection`; includes header (baby name + birth date), day section via `DayDetailSection`, footer with clinical disclaimer; system font stack only; Unicode emoji for symptoms; no `transform`, no `position: fixed/sticky`.
  - Files: `apps/web/src/modules/diary/export/pdfTemplate.vue`
  - Acceptance: renders visually correct at 794px width; no SVG inline; no layout CSS violations from Design § 6
  - Spec: REQ-C1, REQ-C4

- [ ] 24. Create `apps/web/src/modules/diary/export/exportDayPdf.ts`: fetch data from store, mount `pdfTemplate.vue` off-screen via `createApp`, `html2canvas(node, { useCORS: true, scale: 2, backgroundColor: '#ffffff', windowWidth: 794 })` → `new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'pt' })` → `save('bitacora-{babyName}-{YYYY-MM-DD}.pdf')`; unmount after save.
  - Files: `apps/web/src/modules/diary/export/exportDayPdf.ts`
  - Acceptance: calling the function triggers browser download with correct filename; off-screen node removed from DOM after completion
  - Spec: REQ-C1, REQ-C3, REQ-C4

- [ ] 25. Create `apps/web/src/modules/diary/export/exportWeekPdf.ts`: calls `fetchRange(from, to)` from store, iterates 7 days in order, renders each day via `pdfTemplate.vue`, appends pages via `jsPDF.addPage()`; days with no logs AND no observation render a "Sin registros" placeholder page; filename `bitacora-{babyName}-{from}_a_{to}.pdf`.
  - Files: `apps/web/src/modules/diary/export/exportWeekPdf.ts`
  - Acceptance: 7-page PDF always generated (even for empty days); empty-day pages contain "Sin registros" text; filename matches spec
  - Spec: REQ-C2, REQ-C3, REQ-C4

- [ ] 26. Create `apps/web/src/modules/diary/export/useDiaryExport.ts`: composable that dynamic-imports `exportDayPdf` and `exportWeekPdf` to keep initial bundle lean; exposes `{ exportDay(date), exportWeek(from, to), isExporting }`.
  - Files: `apps/web/src/modules/diary/export/useDiaryExport.ts`
  - Acceptance: import via `() => import('./exportDayPdf')` pattern (no static import); `isExporting` set to true during generation
  - Spec: REQ-C3, Design § 6

---

## Phase 7 — Cleanup and verify

- [ ] 27. Rename all remaining occurrences of `hasAllergyReaction` in `apps/web` to `hasSuspectedReaction` (`rg "hasAllergyReaction" apps/web`); fix orphan imports from removed `ReactionType` values in any web component.
  - Files: any file under `apps/web` returned by the search
  - Acceptance: `rg "hasAllergyReaction"` returns zero results across entire repo
  - Spec: REQ-D3

- [ ] 28. Run typecheck across the monorepo: `pnpm --filter @pakulab/api tsc --noEmit` and `pnpm --filter @pakulab/web tsc --noEmit`. Fix all errors.
  - Files: any file with compile errors
  - Acceptance: both commands exit 0

- [ ] 29. Run unit and integration test suites: `pnpm --filter @pakulab/api test` (diary module). Ensure all tests pass green.
  - Files: test output only
  - Acceptance: zero failures; `diary.utils.test.ts` and `dayObservation.routes.test.ts` both pass

- [ ] 30. Manual smoke checklist (document pass/fail inline as code comments or checklist notes — no automated test required):
  - Register a meal with each of the 4 valid reactions; verify ALLERGIC not available
  - Register a day observation with stool + symptoms + notes; verify PUT idempotency (edit same day)
  - Delete the observation; verify UI reverts to "Sin observación"
  - Export day PDF on Chrome desktop; verify filename and content
  - Export week PDF on Chrome desktop; verify 7 pages including empty-day placeholder
  - Export day PDF on iOS Safari; verify no visual artefacts
  - Spec: REQ-A1, REQ-B1–B4, REQ-C1–C4

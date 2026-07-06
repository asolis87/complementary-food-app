# Verify Report: etapa-10-23-meses

> **Phase**: sdd-verify (final verification before archive)
> **Change**: etapa-10-23-meses — 10–23 month complementary-feeding experience
> **Branch / commit**: `release/etapa-10-23-meses` @ `a1b47f0` (all 12 feature PRs + tech-debt PR-95 merged)
> **Artifact store**: openspec
> **Verified**: 2026-07-06
> **Verdict**: **NOT READY FOR ARCHIVE** — 2 CRITICAL spec-coverage gaps (both traceable to documented `T-00-05` / `REQ-D2` deferrals, but neither was removed from the spec contract). See §Verdict.

---

## 1. Test Health (REAL output, this working tree)

Shared built first (`pnpm --filter @pakulab/shared build`) so api/web typecheck against fresh dist.

| Command | Result | Baseline | Match |
|---|---|---|---|
| `pnpm typecheck` (shared tsc + api tsc + web vue-tsc) | **exit 0** | exit 0 | ✅ |
| `pnpm --filter @pakulab/shared test` | **218 passed (218)** / 15 files | 218 | ✅ |
| `pnpm --filter api test` | **444 passed (444)** / 29 files | 444 | ✅ |
| `pnpm --filter web test:run` | **289 passed (289)** / 31 files | 289 | ✅ |

No failures, no skipped suites, no `test:run` errors. All three suites match the last-session baseline exactly.

**Non-fatal noise (not a failure):** `FoodSearchPage.test.ts` emits `[Vue warn]: injection "Symbol(router)" not found` to stderr; both tests still pass. It is a missing RouterLink/router stub in that test's mount, not a runtime defect. → SUGGESTION.

---

## 2. Spec Coverage Matrix (req-01 … req-06)

Legend: ✅ satisfied · ⚠️ partial/deviation · ❌ unmet.

### REQ-01 — Age-Aware Experience (Bloque 0)

| Req | Scenario focus | Status | Evidence |
|---|---|---|---|
| REQ-A1 | `getMealSlotsForAge` returns 3/4/5 slots chronologically | ✅ | `packages/shared/src/constants/dashboard.ts:168-172` + `SLOTS_3/4/5_MEALS:135-154`; 31 shared tests |
| REQ-A2 | Dashboard uses age-aware slots, label "Comida" | ✅ | `DashboardPage.vue` + `TodayLogsCard`; label "Comida" at dashboard.ts:138/143/151 |
| REQ-A3 | **MenuWeekPage age-aware (4 cols @11m, SNACK column)** | ❌ | `MenuWeekPage.vue:764` `MealKey='desayuno'|'comida'|'cena'`; `:782 MEALS` = 3 fixed; CSS `repeat(3,1fr)`. NO `getMealSlotsForAge`, NO SNACK_1/2 columns. **CRITICAL-1** |
| REQ-A4 | Diary timeline order + "Sin registro" gap placeholders | ⚠️ | Order correct (`DiaryPage.vue:678 MEAL_TYPE_ORDER` SNACK_1:2, SNACK_2:4). Per-slot "Sin registro" placeholders NOT rendered (deferred `T-04-DIARY-GAPS`). Diary picker age-awareness IS fixed (`mealTypeOptions.ts:61 getMealTypeOptions`). → WARNING |
| REQ-B1/B2 | `useStageTransition` cross-detection + banner | ✅ | `useStageTransition.ts` (9 tests); `StageTransitionBanner.vue` wired `DashboardPage.vue:49,304` |
| REQ-C1 | TextureGuideCard 5-stage split + current/future | ✅ | `TextureGuideCard.vue:97-163` 5 stages (6m,7-9m,10-12m,13-17m,18-23m), `isCurrentStage`/`isFutureStage`, "Próximamente" badge (8 tests) |
| REQ-D1 | `STAGE_TIPS` Record ≥4 tips/stage + `useStageTip` | ✅ | `dashboard.ts:72-77` STAGE_TIPS (6 tips each); `useDashboardTips.ts:61 useStageTip` (16 tests) |
| REQ-D2 | **"Tip de la etapa" card rendered in dashboard** | ❌ | `useStageTip` has NO UI consumer — DashboardPage does not import/render it; only the test file consumes it. Card not wired. **CRITICAL-2** |
| REQ-E1 | PerceptiveFeedingCard collapsible, 5 principles | ✅ | `PerceptiveFeedingCard.vue` wired `DashboardPage.vue:74` (4 tests) |
| REQ-F1 | Water reminder in AddMealModal, 3 copy points | ✅ | `AddMealModal.vue:170-183` — vaso abierto/popote, orden leche→alimentos→agua, no reemplazar leche; dismissible, non-blocking (3 tests) |

### REQ-02 — Food Catalog 10–23m (Bloque 1)  ✅ (re-scoped per PR-3, authoritative user decision)

| Req | Status | Evidence |
|---|---|---|
| REQ-A1 (6 target foods exist, needsValidation) | ✅ | Foods pre-existed via 154-food catalog expansion; PR-3 re-scoped to DB-free audit + integrity test. `packages/shared/src/data/food-catalog.ts`; `apps/api/src/shared/migrations/seed-audit.test.ts` |
| REQ-A2 (unique names, prep notes) | ✅ | catalog invariants tested (`food-catalog.test.ts` 44 tests, no-dup guard) |
| REQ-A3 (isIronRich where applies) | ✅ | 18 iron-rich foods incl. hígado pollo/res, lenteja, frijol; yogur NOT iron-rich (verified). |
| REQ-B1 (audit section visible) | ✅ | seed audit comment block (PR-3) |

Note: spec's `ageMonths: 10-12` proposal is OBSOLETE — user authoritatively kept 6-8m per Protocolo Beikost/Dra. Trueba. Recorded in state.yaml + tasks.md Bloque 1 reality update. Not a violation.

### REQ-03 — Allergen Tracker (Bloques 2+4)

| Req | Status | Evidence |
|---|---|---|
| REQ-A1 (GET /api/allergens/status, response shape) | ✅ | `allergens.routes.ts:38`; `allergens.service.ts:53 getStatus` returns `{ageMonths, closingWindow, allergens[]}` (8 route tests) |
| REQ-A2 (exposureCount excludes REJECTED) | ✅ | `computeAllergenStatus:161` skips `reaction==='REJECTED'` |
| REQ-A3 (status introduced/pending/in_window) | ✅ | `allergens.service.ts:189-196`; CLOSING_WINDOW_AGE_MONTHS=10 |
| REQ-A4 (tier gating) | ⚠️ | Design AD-06 consciously overrode spec's "HTTP 402 `{error:'TIER_REQUIRED'}`" → uses `requireTier('PRO')` = **403 INSUFFICIENT_TIER**. Code matches DESIGN, deviates from SPEC TEXT. → WARNING (documented design decision) |
| REQ-B1 (card hidden <6m) | ✅ | `AllergenTrackerCard.vue:83 showCard = babyAgeMonths >= 6` |
| REQ-B2 (chips + closing-window banner) | ✅ | `AllergenTrackerCard.vue` (14 tests) |
| REQ-B3 (FREE CTA → /billing) | ✅ | `TierGate required-tier="PRO"`; card skips fetch when tier!==PRO (`:109`) |

Allergen set deviation: spec lists **8** priority allergens; `TOP_ALLERGENS` renders **9** (the 8 spec allergens split fish→pescado+mariscos, PLUS ajonjolí/sésamo). Superset is clinically defensible (sesame is a top-9 allergen); pescado/mariscos split is a recorded PR-4 decision. → WARNING (count differs from spec's literal "8").

### REQ-04 — Warning Tags (Bloques 3+4)  ✅

| Req | Status | Evidence |
|---|---|---|
| REQ-A1 (WarningTag enum, 4 values) | ✅ | schema enum + `packages/shared/src/types/food.ts WARNING_TAGS`; schema-non-destructive test (5 shared) |
| REQ-A2 (Food.warningTags[] + seed backfill) | ✅ | 14+ foods tagged from PDF page 7; `seed-audit.test.ts` real invariants (all tree_nuts have CHOKING, round/hard-chunk fruits tagged, safe foods untagged) |
| REQ-B1 (FoodSearchPage badge+tooltip) | ✅ | `FoodSearchPage.vue` `<WarningBadge>` (2 tests) |
| REQ-B2 (FoodSearchModal panel, button stays enabled) | ✅ | `FoodSearchModal.vue` warning panel; add button enabled (4 tests, REQ-4-B2) |
| REQ-B3 ("consulta a tu pediatra" disclaimer) | ✅ | `food.ts:47 WARNING_DISCLAIMER='Si tienes dudas, consulta a tu pediatra.'` — **es-MX tuteo** (spec text shows rioplatense voseo "tenés/consultá"; es-MX is the settled app-wide copy decision, NOT re-opened). → SUGGESTION on the stale spec string |
| REQ-C1 (MenuWeekPage badge) | ✅ | `MenuWeekPage.vue:223,353 <WarningBadge>` via API contract widening |
| REQ-C2 (PlateBuilder badge) | ✅ | `PlateVisualization.vue` badge; `usePlateBuilder.ts:232` edit-path preserves warningTags (dead-badge bug fixed) |

### REQ-05 — Plate Builder (Bloques 4+5)  ✅

| Req | Status | Evidence |
|---|---|---|
| REQ-A1/A2 (groupCount suggestion, deterministic) | ✅ | `getSuggestedGroupCount`; PlateBuilderPage "Sugerido para X meses" badge (`:47,63,86,102,328`) |
| REQ-B1 (serving selector, default 1, preserve) | ✅ | `PlateContents.vue:50 :value="item.servingAmount ?? '1'"`, 1-4 cdas; `usePlateBuilder.ts:232` preserves on edit |
| REQ-B2 (total "X cdas en total") | ✅ | `PlateBuilderPage.vue:26` |
| REQ-B3 (>4 cdas/group non-blocking banner) | ✅ | `usePlateBuilder.ts:136 hasExcessServing` per group; `PlateBuilderPage.vue:170-173` exact spec copy, role=alert, non-blocking |
| REQ-C1 (PlateStage enum, Plate.stageFor?) | ✅ | schema + `packages/shared/src/types/plate.ts` (12 tests); `plate-stage-sync.test.ts` |
| REQ-C2 (stageFor selector "Etapa objetivo") | ✅ | PlateBuilderPage stageFor selector |
| REQ-C3 (filter by stage, stageFor=null = IS NULL) | ✅ | `plates.schema.ts:65 z.preprocess("null"/""→null)`; `plates.service.ts:53 ...(stageFor!==undefined && {stageFor})` |
| REQ-C4 (default filter = baby stage) | ✅ | `PlateListPage.vue:241 getSuggestedStageForAge(babyAgeMonths)`, null="Todas" |
| REQ-D1 (export shows baby CURRENT stage) | ✅ | `MenuExportFrame.vue:13 — {{ stageLabel }}`; MenuWeekPage derives via getAgeMonths→getSuggestedStageForAge→PLATE_STAGE_LABELS (PR-12; MenuExportFrame 20 tests) |

### REQ-06 — Dashboard Suggestions (Bloque 4)  ✅

| Req | Status | Evidence |
|---|---|---|
| REQ-A1 (iron priority ≥10m, ≥30% iron-rich) | ✅ | `dashboard.service.ts:488 sortSuggestions`; tiers = pending-allergens → iron (`minIron=min(len,max(3,ceil(limit*0.3)))`) → rest. Allergen-first-then-iron is the recorded product decision. All 18 iron foods are age≤10 so always candidates for ≥10m babies (verified). |
| REQ-A2 (graceful fallback, no iron-rich) | ✅ | `:524 if (ironFoods.length===0) return sorted.slice(0,limit)` |
| REQ-B1 (getSnackSuggestions, <10m NOT_YET, ≥12m extras, exclude CHOKING) | ✅ | `dashboard.service.ts:218-291`; `<10m→SNACKS_NOT_YET`, core (fruit/veg/yogur-queso) ≥3, 12m+ galleta/pan/cereal/arroz, `notChokingHazard` filter, deterministic order-by-name |
| REQ-B2 (SnackSuggestionCard only when snack slot exists) | ✅ | `SnackSuggestionCard.vue` wired `DashboardPage.vue:102`, shown ≥10m & available (5 tests) |
| REQ-B3 (card "Ver detalle" → FoodSearchModal) | ✅ | SnackSuggestionCard |

---

## 3. Task Completion vs Reality

state.yaml `tasks.completed_prs` = PR-1 … PR-12 (all merged) + standalone tech-debt PR-95. Spot-checks confirm marked-done tasks are genuinely implemented (WarningBadge, allergen service, iron tiers, snack service, plate stageFor, export stage label all present with real tests). Two exceptions where a task/spec was marked done/deferred but the SPEC requirement remains unmet in shipped UI:

- **T-00-05 (MenuWeekPage age-aware, REQ-A3)** — marked `DEFERRED (Bloque 4)` in tasks.md, but never actually implemented in any later PR and never removed from the REQ-01 spec contract. Menu grid is still 3 fixed columns. → CRITICAL-1.
- **REQ-D2 "Tip de la etapa" card** — `useStageTip` composable shipped (REQ-D1) but the rendered dashboard card (REQ-D2) was never wired. Tracked in state.yaml deferred debt ("useStageTip has no UI consumer"). → CRITICAL-2.

All other tasks' checked state matches code.

---

## 4. Known Deferred Tech-Debt — classified (from state.yaml apply.notes)

| Deferred item | Classification | Rationale |
|---|---|---|
| dashboard `buildAllergenAlerts` ES/EN allergen-key bug | **WARNING (not truly dead code, but UI-orphaned)** | `getPendingAllergens`→`buildAllergenAlerts` still called by live route `GET /api/dashboard/allergens` (`dashboard.routes.ts:146`) and dangling store method `dashboardStore.fetchAllergens` (`:126`), BUT no UI reaches it: the old `AllergenAlertsCard` is DELETED (0 refs), and the epic card `AllergenTrackerCard.vue:114` fetches the correct `/allergens/status` (PR-4 service with proper ES↔EN mapping). Not a spec violation; the shipped tracker (REQ-03) is correct. Recommend deleting the orphaned route/method post-archive. |
| `ALLERGEN_AGE_THRESHOLDS` pescado/mariscos reconcile | acceptable deferral | Constant is consumed ONLY by the UI-orphaned `buildAllergenAlerts` path above. Confined blast radius; no live consumer. |
| garbanzo left untagged for warningTags | **acceptable deferral (spec-compliant)** | `food-catalog.ts:1030` documents deferral pending product; NOT on PDF page 7 verbatim. REQ-2-A1 makes garbanzo's CHOKING tag conditional ("si entero"), so untagged is within spec. |
| shared test asserting all iron foods age≤10m (missing) | **WARNING (invariant holds, unlocked)** | Verified all 18 iron-rich foods have ageMonths 4–9 (≤10). The invariant HOLDS today but nothing locks it — a future regression would silently break iron priority for ≥10m babies. Add the test post-archive. |
| `useStageTip` has no UI consumer | **CRITICAL-2** (see §2 REQ-D2) | Spec REQ-D2 explicitly requires the rendered card. |
| `forbidOnly` missing in shared/api vitest configs | SUGGESTION (partly resolved) | api HAS `forbidOnly:!!process.env.CI` (`apps/api/vitest.config.ts:7`) and web has it via mergeConfig; only `packages/shared/vitest.config.ts` lacks it. A stray `.only` in shared tests would not fail CI. Non-blocking. |
| TextureGuideCard under-6m all-future state | SUGGESTION | `currentStageIndex` = -1 for <6m → all stages "future", no current highlight. Spec scenarios only cover 8m/14m (both correct); the whole 10-23m experience targets ≥6m. Cosmetic edge case. |

---

## 5. Clinical Integrity (highest-risk claims spot-checked)

- **Iron-rich foods (18)** — heme (hígado pollo/res, carne de res), legumes (frijol negro/pinto/blanco, lenteja/lenteja roja, garbanzo), green leaves (espinaca, acelga, quelites, verdolagas, rúgula), fortified cereals (arroz/avena/maíz/trigo). All ages 4–9m. Traces to PDF page 2 per PR-11 note. No invented foods. ✅
- **Warning tags** — CHOKING_HAZARD_UNDER_5Y on all tree_nuts + round/hard-chunk fruits; PROHIBITED tags per PDF page 7. seed-audit.test.ts enforces (no vacuous escape hatches after PR-5 4R FIX-3). ✅
- **Allergen thresholds** — CLOSING_WINDOW_AGE_MONTHS=10, min-age 6m, aligned to ESPGHAN/AAP. ✅
- **Meal distribution** — 3 meals <10m, +1 colación 10-12m, +2 colaciones ≥13m, per guide p.5. Correct in `getMealSlotsForAge`. (Only the MenuWeekPage SURFACE fails to apply it — CRITICAL-1.) ✅ logic / ❌ one consumer.

No invented clinical content found. es-MX tuteo copy is the settled product decision.

---

## 6. Issues

### CRITICAL (blocks archive)

- **CRITICAL-1 — REQ-A3 unmet: MenuWeekPage is not age-aware.** `apps/web/src/modules/menus/MenuWeekPage.vue:764,782` hardcodes a 3-meal model (`'desayuno'|'comida'|'cena'`, `repeat(3,1fr)`); does not use `getMealSlotsForAge`; no SNACK_1/SNACK_2 columns. REQ-A3 scenario ("bebé 11m → 4 columnas incl. Colación") fails. Documented deferral `T-00-05`, but the spec contract still requires it.
- **CRITICAL-2 — REQ-D2 unmet: "Tip de la etapa" card not rendered.** `useStageTip` (`useDashboardTips.ts:61`) is implemented and tested but has NO UI consumer; `DashboardPage.vue` neither imports nor renders it. REQ-D2 ("card 'Tip para [etapa]' … debajo de la card de balance") is not satisfied.

### WARNING (should fix, not blocking)

- **W-1 — REQ-A4 partial:** diary per-slot "Sin registro" gap placeholders not rendered (only timeline order + day-level empty state). Deferred `T-04-DIARY-GAPS`.
- **W-2 — REQ-3-A4 tier code deviation:** spec says HTTP 402 `{error:'TIER_REQUIRED'}`; code+design (AD-06) use 403 `INSUFFICIENT_TIER`. Conscious design decision; client handles the 403 code. Reconcile spec text or accept.
- **W-3 — Allergen count:** spec says 8; app renders 9 (adds ajonjolí; splits pescado/mariscos). Clinically sound superset; reconcile spec wording.
- **W-4 — Missing iron-age invariant test:** all iron foods currently ≤10m but nothing locks it.
- **W-5 — Orphaned buggy allergen path:** ES/EN key bug in `buildAllergenAlerts` + `ALLERGEN_AGE_THRESHOLDS` pescado/mariscos mismatch live behind `GET /api/dashboard/allergens` + `dashboardStore.fetchAllergens`, but no UI reaches them. Delete post-archive to remove the trap.

### SUGGESTION (nice-to-have)

- **S-1** — `packages/shared/vitest.config.ts` lacks `forbidOnly` (api/web have it).
- **S-2** — REQ-4-B3 spec string is stale rioplatense; app uses settled es-MX tuteo (do not change code; refresh spec text).
- **S-3** — TextureGuideCard <6m all-future edge state (cosmetic; app targets ≥6m).
- **S-4** — `FoodSearchPage.test.ts` router-injection Vue warning (add RouterLink stub).
- **S-5** — Icon inconsistency: WarningBadge ⚠️ emoji vs FoodSearchModal panel Material-Symbols "warning" (design pass).

---

## 7. Verdict

**NOT READY FOR ARCHIVE.**

Tests are fully green (typecheck exit 0; shared 218 / api 444 / web 289, all matching baseline) and 4 of 6 delta requirements are fully satisfied with strong runtime evidence. However **two spec requirements in the verified contract are unmet in shipped code**:

Blocking list:
1. **CRITICAL-1 — REQ-A3** MenuWeekPage age-aware meal slots (no SNACK columns; 3-col hardcode).
2. **CRITICAL-2 — REQ-D2** "Tip de la etapa" dashboard card not rendered (`useStageTip` unconsumed).

Both were internally deferred but never removed from the REQ-01 spec. To reach archive, EITHER implement CRITICAL-1 and CRITICAL-2, OR (product/owner decision) formally move REQ-A3 and REQ-D2 to the spec's "Out of scope" section with a recorded rationale and re-run verify. Do not archive with the spec still asserting requirements the code does not meet.

Next recommended phase: **sdd-apply** (implement CRITICAL-1 + CRITICAL-2) — or a spec amendment + re-verify if the owner de-scopes them.

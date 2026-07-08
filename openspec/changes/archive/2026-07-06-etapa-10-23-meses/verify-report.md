# Verify Report: etapa-10-23-meses — ROUND 2

> **Phase**: sdd-verify (round 2, re-verification after PR-13 CRITICAL fixes)
> **Change**: etapa-10-23-meses — 10–23 month complementary-feeding experience
> **Branch / commit**: `chore/etapa-10-23-meses-pr13-state-sync` @ `eb6ae22` (post-merge state-sync of `release/etapa-10-23-meses` @ `6463fc3`; PR #99 / PR-13 merged, all 13 PRs present)
> **Artifact store**: openspec
> **Verified**: 2026-07-06
> **Verdict**: **READY FOR ARCHIVE** — both round-1 CRITICALs closed with real source evidence + real DOM/exact-string tests. All suites green. No new blockers. Non-blocking WARNINGs/SUGGESTIONs unchanged (product/clinical decisions, not re-opened).

---

## 0. Round 1 → Round 2 delta

| Item | Round 1 (`a1b47f0`) | Round 2 (`eb6ae22`) | Change |
|---|---|---|---|
| **CRITICAL-1 REQ-A3** (MenuWeekPage age-aware) | ❌ hardcoded 3-meal grid, `repeat(3,1fr)`, no `getMealSlotsForAge` | ✅ `MEALS` computed from `getMealSlotsForAge(babyAgeMonths)`; 3/4/5 columns; SNACK columns for ≥10m | **CLOSED** |
| **CRITICAL-2 REQ-D2** (Tip de la etapa card) | ❌ `useStageTip` unconsumed, card never rendered | ✅ `StageTipCard.vue` rendered in DashboardPage below BalanceInsightCard; `useStageTip` exports `stage` | **CLOSED** |
| web suite | 289 passed | 299 passed (+10, PR-13 tests) | as forecast |
| typecheck / shared / api | 0 / 218 / 444 | 0 / 218 / 444 | unchanged |
| W-1..W-5 WARNINGs | open (non-blocking) | unchanged (non-blocking) | no regression |
| S-1..S-5 SUGGESTIONs | open | unchanged | no regression |

**Note on commit ref**: the task named `release/etapa-10-23-meses @ 6463fc3`; the checked-out working tree is the immediate state-sync child `eb6ae22` (branch `chore/etapa-10-23-meses-pr13-state-sync`), whose only production-code delta from `6463fc3` is the `openspec/.../state.yaml` PR-13 sync note. All PR-13 source (MenuWeekPage, StageTipCard, DashboardPage, useDashboardTips) is present and verified in this tree. No material difference for verification.

---

## 1. Test Health (REAL output, this working tree @ `eb6ae22`)

| Command | Result | Round-2 baseline | Match |
|---|---|---|---|
| `pnpm typecheck` (shared tsc + api tsc + web vue-tsc) | **exit 0** | exit 0 | ✅ |
| `pnpm --filter @pakulab/shared test` | **218 passed (218)** / 15 files | 218 | ✅ |
| `pnpm --filter api test` | **444 passed (444)** / 29 files | 444 | ✅ |
| `pnpm --filter web test:run` | **299 passed (299)** / 32 files | 299 (289 + ~10) | ✅ |

No failures, no skipped suites, no runner errors. The `+10` on web is exactly the PR-13 additions: MenuWeekPage REQ-A3 age-aware tests (6 new: 8m/11m/15m + 10m boundary + 13m boundary + age-0 fallback) and StageTipCard tests (4 new). Rebuild of shared was NOT required — typecheck passed against existing dist.

**Non-fatal noise (unchanged from round 1):** `FoodSearchPage.test.ts` emits `[Vue warn]: injection "Symbol(router)" not found` to stderr; both tests pass. Missing router stub in that mount, not a runtime defect. → SUGGESTION S-4 (unchanged).

---

## 2. PRIMARY OBJECTIVE — CRITICAL closure (evidence, file:line)

### CRITICAL-1 — REQ-A3 MenuWeekPage age-aware  →  ✅ CLOSED

**Source (`apps/web/src/modules/menus/MenuWeekPage.vue`):**
- `babyAgeMonths` computed from active profile birthDate via `getAgeMonths`, `0` fallback for missing/invalid (`:807-811`).
- `MEALS` is now a **`computed<MealDef[]>`** derived from `getMealSlotsForAge(babyAgeMonths.value)` and mapped through `MEAL_TYPE_TO_KEY` + `MEAL_ICONS` (`:819-826`). NOT a hardcoded array.
- `MealKey` type extended to `'desayuno' | 'comida' | 'cena' | 'snack1' | 'snack2'` (`:764`); `MEAL_ICONS` covers all 5 slots incl. `snack1`/`snack2`/`snack` (`:783-790`).
- Template renders variable columns via `v-for="meal in MEALS"` — desktop grid (`:94`), preview rows (`:183`), mobile day panel (`:304`) — and all script consumers use `MEALS.value` (weekFoodIds `:908`, exportData `:1027`, confirmApplyAll `:1438`). No `repeat(3,1fr)` remains as a fixed-meal constraint; per-day meal count is driven entirely by `MEALS`.
- SNACK columns appear for ≥10m: `getMealSlotsForAge` returns SLOTS_4_MEALS (adds `SNACK_1` "Colación") for 10–12m and SLOTS_5_MEALS (`SNACK_1` "Colación 1" + `SNACK_2` "Colación 2") for ≥13m.

**Shared source of truth (`packages/shared/src/constants/dashboard.ts:168-172`):** `getMealSlotsForAge(months)` → `<10` (incl. non-finite/negative) = 3 meals; `10..12` = 4 meals; `≥13` = 5 meals. Matches REQ-A1 chronological ordering (SNACK_1 mid-morning, SNACK_2 afternoon in 5-meal). 31 shared `dashboard.test.ts` tests pass.

**Tests (`MenuWeekPage.test.ts` describe "REQ-A3: Age-aware meal columns (CRITICAL-1)" `:562-718`)** — REAL DOM-count assertions, not vacuous:
- 8m → `findAll('.meal-slot').length === 21` (3×7), label set = Desayuno/Comida/Cena, **zero** "Colación" (`:568-596`).
- 11m → `=== 28` (4×7), "Colación" present, singular NOT "Colación 1" (`:598-625`).
- 15m → `=== 35` (5×7), both "Colación 1" AND "Colación 2" (`:627-653`).
- **exactly 10m → `=== 28`** — lower boundary of 10–12m gets the snack column (`:656-675`).
- **exactly 13m → `=== 35`** — lower boundary of 13–23m gets both colación columns (`:677-696`).
- age-0 fallback (no birthDate) → `=== 21` (safe 3-meal default) (`:698-717`).
Ages derived deterministically from birthDate via a `birthDateForAge(months)` helper pinned to day-1 (no end-of-month rollover). Assertions count real mounted `.meal-slot` nodes and inspect `.meal-slot__label` text — genuine, not `toBeTruthy` escape hatches.

### CRITICAL-2 — REQ-D2 "Tip de la etapa" card  →  ✅ CLOSED

**Source:**
- `StageTipCard.vue` EXISTS (`apps/web/src/modules/dashboard/components/StageTipCard.vue`). Consumes `useStageTip(props.babyAgeMonths)` and destructures `{ tip, reshuffle, stage }` (`:47`); renders header "Tip para {stageLabel}" (`:9`), tip text (`:24`), and a reshuffle button (`:10-18`). `stageLabel` derived from the composable's `stage` via a display-only `AGE_STAGE_LABELS` map (`:40-48`) — no duplicate age→stage logic.
- Rendered in `DashboardPage.vue` **below BalanceInsightCard**: BalanceInsightCard at `:112-117`, StageTipCard immediately after at `:120-123`, passing `:baby-age-months="dashboardData.baby.ageInMonths"`, guarded by `v-if="dashboardData"`. Import at `:145`. Satisfies REQ-D2 "debajo de la card de balance".
- `useStageTip` (`apps/web/src/shared/composables/useDashboardTips.ts:61-92`) now **exports `stage`** (`:89-90`, "single source of truth"), reads `STAGE_TIPS[stage]`, picks with immediate-repeat avoidance (`_pickRandomStageTip` `:109-132`). `STAGE_TIPS` has ≥4 (6) tips per stage (`dashboard.ts:72-77`).

**Tests (`StageTipCard.test.ts` `:1-86`)** — REAL, deterministic, not vacuous:
- "renders a tip from the baby's stage list": mocks `Math.random → 0` → asserts EXACT tip `'Cada alimento nuevo necesita 10-15 exposiciones para ser aceptado.'` (TIPS_10_12[0]) (`:19-31`).
- "displays the stage label": 11m → matches `/10.*12.*meses/i` (`:33-42`).
- "reshuffle button click rotates the tip": `mockReturnValueOnce(0)` then `mockReturnValueOnce(0.34)` → floor(0.34×6)=2 → asserts new tip EXACTLY `'Experimenta con diferentes preparaciones y sabores.'` AND `!== initialTip` (`:44-65`). Deterministic reshuffle, not chance.
- "renders for different age stages": 8m→`/6.*9/`, 15m→`/13.*17/`, 20m→`/18.*23/` (`:67-85`).

---

## 3. Spec Coverage Matrix (delta requirements)

Legend: ✅ satisfied · ⚠️ partial/deviation (non-blocking) · ❌ unmet.

### REQ-01 — Age-Aware Experience (Bloque 0)

| Req | Status | Evidence |
|---|---|---|
| REQ-A1 `getMealSlotsForAge` 3/4/5 | ✅ | `dashboard.ts:168-172`; 31 shared tests |
| REQ-A2 dashboard age-aware, "Comida" | ✅ | `dashboard.ts:137/143/151` label "Comida"; TodayLogsCard |
| **REQ-A3 MenuWeekPage age-aware** | ✅ **(FIXED PR-13)** | `MenuWeekPage.vue:819-826` MEALS computed; 6 DOM-count tests incl. 10m/13m boundaries + age-0 |
| REQ-A4 diary order + gap placeholders | ⚠️ | Order correct; per-slot "Sin registro" placeholders still deferred (`T-04-DIARY-GAPS`). → W-1 (unchanged, non-blocking) |
| REQ-B1/B2 stage transition | ✅ | `useStageTransition.ts` + `StageTransitionBanner.vue` (banner test 4 passing) |
| REQ-C1 TextureGuideCard 5-stage | ✅ | `TextureGuideCard.vue` 5 stages, current/future |
| REQ-D1 STAGE_TIPS + useStageTip | ✅ | `dashboard.ts:72-77`; `useDashboardTips.ts:61` (now exports `stage`) |
| **REQ-D2 Tip de la etapa card** | ✅ **(FIXED PR-13)** | `StageTipCard.vue` rendered `DashboardPage.vue:120-123` below balance; 4 real tests |
| REQ-E1 PerceptiveFeedingCard | ✅ | wired DashboardPage |
| REQ-F1 water reminder | ✅ | `AddMealModal.vue` |

### REQ-02..06 (previously PASSED — re-confirmed, no PR-13 regression)

PR-13 was FRONTEND-ONLY (`git show --stat 84cc971..6463fc3`): DashboardPage (+7), StageTipCard (new), MenuWeekPage.vue (+41), MenuWeekPage.test.ts (+158), useDashboardTips.ts (+2). It did NOT touch allergen service, plate builder serving logic, snack service, iron priority, or the API. Spot-check:

| Req | Status | Re-confirmation |
|---|---|---|
| REQ-02 food catalog 10–23m | ✅ | catalog + seed-audit untouched; shared `food-catalog.test.ts` 44 tests green |
| REQ-03 allergen tracker | ✅ | `allergens.routes.test.ts` 8 green; AllergenTrackerCard untouched (W-2 403-vs-402, W-3 9-vs-8 = settled, NOT re-opened) |
| REQ-04 warning tags | ✅ | `usePlateBuilder.ts` edit-path preserves warningTags (PR-13 diff only +1 line, no behavior change); WarningBadge in MenuWeekPage preview `:223` + mobile `:353` still present |
| REQ-05 plate builder / **REQ-D1 export stage** | ✅ | MenuExportFrame still receives `:stage-label="babyStageLabel"` (`MenuWeekPage.vue:649`); `babyStageLabel` computed intact (`:829-834`); MenuExportFrame tests + MenuWeekPage stage-derivation tests (`:507-560`) green. `MEALS` computed feeds `exportData` (`:1027`) — ripple-safe, no collateral break. |
| REQ-06 dashboard suggestions | ✅ | `dashboard.service.ts` iron/snack tiers untouched by PR-13; api 444 green |

---

## 4. Task Completion vs Reality

state.yaml `completed_prs` = PR-1 … PR-13 (all merged). Round 1's two "marked done but unmet" exceptions (T-00-05 REQ-A3, REQ-D2) are now genuinely implemented and tested in PR-13. `apply.status: complete`, `next_pr: null`. All checked task states match shipped code. No unchecked implementation task remains.

---

## 5. Known Deferred Tech-Debt — status unchanged (NOT re-raised as blockers)

Per round-1 classification, these remain non-blocking and were explicitly NOT re-opened this round:

| Item | Round-2 status |
|---|---|
| REQ-3-A4 tier 403 `INSUFFICIENT_TIER` vs spec 402 (AD-06 design decision) | W-2 — unchanged, documented design decision |
| Allergen 9 (ajonjolí + pescado/mariscos split) vs spec "8" | W-3 — unchanged, clinical superset |
| Orphaned buggy `buildAllergenAlerts` ES/EN path (no live UI consumer) | W-5 — unchanged; delete post-archive |
| Missing "all iron foods ≤10m" invariant test | W-4 — unchanged; invariant holds, add test post-archive |
| es-MX tuteo vs stale rioplatense spec strings (REQ-4-B3) | S-2 — unchanged; settled copy decision, refresh spec text only |
| `forbidOnly` missing in `packages/shared/vitest.config.ts` (api/web have it) | S-1 — unchanged |
| TextureGuideCard <6m all-future edge state | S-3 — unchanged; app targets ≥6m |
| REQ-A4 diary per-slot "Sin registro" placeholders | W-1 — unchanged; `T-04-DIARY-GAPS` deferral |
| FoodSearchPage router-injection Vue warning | S-4 — unchanged; add RouterLink stub |
| WarningBadge emoji vs Material-Symbols icon inconsistency | S-5 — unchanged; design pass |

**No WARNING was resolved by PR-13** (PR-13 scope was CRITICAL-1 + CRITICAL-2 only). **No NEW issue appeared** — the PR-13 diff is surgical, all suites green, no new stderr beyond the pre-existing FoodSearchPage warning.

---

## 6. Issues

### CRITICAL (blocks archive)

- **NONE.** Both round-1 CRITICALs (REQ-A3, REQ-D2) are CLOSED with source + real test evidence.

### WARNING (should fix, not blocking) — all carried over, none new

- **W-1** REQ-A4 diary per-slot "Sin registro" gap placeholders deferred (`T-04-DIARY-GAPS`).
- **W-2** REQ-3-A4 tier code 403 `INSUFFICIENT_TIER` vs spec 402 (conscious AD-06 design decision).
- **W-3** Allergen count 9 rendered vs spec 8 (clinical superset; recorded PR-4 pescado/mariscos split + ajonjolí).
- **W-4** No test locks the "all iron foods ≤10m" invariant (holds today).
- **W-5** Orphaned buggy `buildAllergenAlerts` ES/EN path behind `/api/dashboard/allergens` + `dashboardStore.fetchAllergens`, no live UI consumer — delete post-archive.

### SUGGESTION (nice-to-have) — all carried over, none new

- **S-1** `packages/shared/vitest.config.ts` lacks `forbidOnly`.
- **S-2** REQ-4-B3 spec string is stale rioplatense; app uses settled es-MX (refresh spec text only).
- **S-3** TextureGuideCard <6m all-future edge state (cosmetic).
- **S-4** `FoodSearchPage.test.ts` router-injection Vue warning (add RouterLink stub).
- **S-5** WarningBadge ⚠️ emoji vs FoodSearchModal Material-Symbols "warning" icon inconsistency.

---

## 7. Verdict

**READY FOR ARCHIVE.**

Both round-1 blocking CRITICALs are closed with concrete source evidence and genuine (non-vacuous, deterministic) tests:
1. **CRITICAL-1 REQ-A3** — MenuWeekPage `MEALS` is an age-aware computed off `getMealSlotsForAge`; 3/4/5 columns with SNACK columns for ≥10m; 6 real DOM-count tests covering the 10m and 13m clinical boundaries and the age-0 fallback.
2. **CRITICAL-2 REQ-D2** — `StageTipCard.vue` renders in the dashboard below BalanceInsightCard, consumes `useStageTip` which now exports `stage` (dedup); 4 real deterministic tests (exact-tip + reshuffle + stage labels).

Full health: typecheck exit 0; shared 218/218; api 444/444; web 299/299 (+10 as forecast). The 4 previously-passing requirement groups (REQ-02..06 incl. REQ-D1 export stage, REQ-05 plate builder, REQ-06 suggestions) show no PR-13 collateral regression — PR-13 was a surgical frontend change and all their tests remain green.

Remaining WARNINGs/SUGGESTIONs are the same settled product/clinical/design decisions from round 1, all explicitly non-blocking; none were re-opened and none are new. The orchestrator may proceed to **sdd-archive**.

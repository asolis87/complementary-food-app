# Tasks: etapa-10-23-meses

> **Why**: ver `proposal.md`, `specs/`, `design.md`. Esta es la descomposición ejecutable. Cada task = un commit (RED → GREEN → TRIANGULATE → REFACTOR) con TDD estricto.
>
> **Strict TDD**: `openspec/config.yaml` declara `strict_tdd: true`. Cada task de implementación debe:
>
> 1. Escribir el test que falla (RED)
> 2. Implementar el mínimo para hacerlo pasar (GREEN)
> 3. Agregar 2-3 casos de triangulación si la implementación es trivial
> 4. Refactor sin romper tests
>
> **Test runner**: `pnpm --filter <package> test` (Vitest).

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines (código + tests) | ~1700–1900 |
| Estimated changed lines (migrations + seed) | ~150 |
| 400-line budget risk | High (change completo excede budget) |
| Chained PRs recommended | Yes (auto-forecast) |
| Suggested split | 10 PRs (ver §PR Forecast abajo) |
| Delivery strategy | auto-forecast |
| Review workload guard | Apply debe respetar budget; si un PR excede 400 líneas, dividir |

### PR Forecast (auto-forecast grouping)

Tasks se agrupan en PRs por bloque funcional. Si un PR excede 400 líneas, se subdivide.

| PR | Bloques | Tasks | LOC est. | Risk |
|----|---------|-------|---------:|------|
| PR-1 | 0 (foundations) | T-00-01, T-00-04, T-00-05, T-00-06 | ~130 | Low |
| PR-1.5 | 0.5 (docs rename) | (renames T-XX-DIARY-PICKER-AGE-AWARE from Bloque 0.5 to PR-1.5) | ~5 | Low |
| PR-1.6a | 0 (test harness) | T-XX-WEB-TESTS-HARNESS (harness only) | ~105 | Low |
| PR-1.6b | 0 (test harness) | T-XX-WEB-TESTS-HARNESS (forbidOnly + root test) | ~10 | Low |
| PR-1.6c | 0 (test harness) | T-XX-WEB-TESTS-HARNESS (CI workflow + tasks forecast) | ~115 | Low |
| PR-1.7 | 0.5 (diary integration) | T-XX-DIARY-PICKER-AGE-AWARE | ~30 | Low (4R reliability C1 follow-up) |
| PR-1.8 | 0 (test debt) | T-XX-WEB-TESTS-FIX | ~250 | Low (silent rot cleanup) |
| PR-2 | 0 (UI complementaria) | T-00-02, T-00-07, T-00-08, T-00-09, T-00-10, T-00-11, T-00-12 | ~310 | Low |
| PR-3 | 1 (seed) | T-01-01, T-01-02, T-01-03 | ~90 | Low (validación nutriólogo) |
| PR-4 | 2 + 4-D2 (allergens) | T-02-01..05, T-04-01..04 | ~370 | Medium (PRO gate) |
| PR-5 | 3 + 4-B3 (warnings + allergen-mapping move) | T-03-01..04, T-04-11..15 | ~250 | Low (informativo, bundled domain) |
| PR-6 | 4-C1+C2 + 5 (plate) | T-00-03, T-04-05..10, T-05-01..08 | ~390 | Medium (migration) |
| PR-7 | 4-E1+E2 (suggestions) | T-04-16..20 | ~180 | Low |

**Total**: 10 PRs (PR-1 → PR-1.5 → PR-1.6a → PR-1.6b → PR-1.6c → PR-1.7 → PR-1.8 → PR-2 → ... → PR-7), ~1820 LOC. PR-1.6 was split into 3 chained PRs to stay under the 400-line pre-PR review gate (the gentle-ai 4R gate compares the PR diff against `main` rather than the explicit `--base`, so chained PRs is the only way to ship harness + lockfile + CI without exceeding 400 lines per PR). Si al apply se observa que algún PR excede 400 líneas netas, se subdivide (estrategia auto-forecast).

---

## Conventions

- **Task ID**: `T-<bloque>-<NN>` (e.g. T-00-01 = Bloque 0, task 1)
- **Checkbox**: `- [ ]` al crear, `- [x]` al completar (con link al commit)
- **Spec reference**: cada task referencia el `REQ-X-N` que implementa
- **Files affected**: lista explícita de paths
- **TDD evidence**: el PR description debe incluir "RED: <test name>, GREEN: <commit hash>, REFACTOR: <commit hash>"
- **Tests required**: el número de tests que la task debe agregar

---

## Bloque 0 — UI pura, sin schema ni data nueva

Foundations: pure functions en shared + updates a consumers existentes.

### T-00-01: `getMealSlotsForAge()` + `AgeStage` type + tests ✅

- **Spec**: REQ-A1, REQ-A2
- **Files**: `packages/shared/src/constants/dashboard.ts`, `packages/shared/src/constants/dashboard.test.ts`, `packages/shared/src/types/diary.ts`
- **Deliverable**:
  - `AgeStage` union type en `types/diary.ts`: `'SIX_TO_NINE_MONTHS' | 'TEN_TO_TWELVE_MONTHS' | 'THIRTEEN_TO_SEVENTEEN_MONTHS' | 'EIGHTEEN_TO_TWENTY_THREE_MONTHS'`
  - `getMealSlotsForAge(months: number): readonly MealSlotDef[]` en `constants/dashboard.ts`
  - Constantes internas: `SLOTS_3_MEALS` (BREAKFAST, LUNCH, DINNER), `SLOTS_4_MEALS` (BREAKFAST, LUNCH, DINNER, SNACK_1), `SLOTS_5_MEALS` (BREAKFAST, SNACK_1, LUNCH, SNACK_2, DINNER)
  - Deprecar `DASHBOARD_MEAL_SLOTS` (mantener como `LEGACY_MEAL_SLOTS` con `// @deprecated` comment)
- **Tests** (8): 0, 6, 9, 10, 12, 13, 17, 18, 23, 30 (boundary cases)
- **TDD**: test_age_aware_slots.test.ts primero

### T-00-02: `STAGE_TIPS` Record + tests

- **Spec**: REQ-D1
- **Files**: `packages/shared/src/constants/dashboard.ts`, `packages/shared/src/constants/dashboard.test.ts`
- **Deliverable**:
  - `STAGE_TIPS: Record<AgeStage, readonly string[]>` con 4-6 tips por etapa
  - Copy curado basado en PDF guía (no se genera dinámicamente)
  - Cada tip referencia info real (porciones, alérgenos, técnica, etc.)
- **Tests** (5): cada etapa tiene ≥4 tips; no hay tips duplicados cross-stage
- **TDD**: test_stage_tips.test.ts

### T-00-03: `getSuggestedGroupCount()` + tests

- **Spec**: REQ-A2 (plate group count)
- **Files**: `packages/shared/src/constants/dashboard.ts`, `packages/shared/src/constants/dashboard.test.ts`
- **Deliverable**:
  - `getSuggestedGroupCount(months: number): number` retornando 4 si `months < 10`, 5 en caso contrario
  - `getSuggestedStageForAge(months: number): PlateStage` (forward reference a Bloque 5; puede vivir en shared desde el inicio)
- **Tests** (5): 5, 9, 10, 15, 24
- **TDD**: test_suggested_group_count.test.ts

### T-00-04: Update `DashboardPage.vue` para usar `getMealSlotsForAge` ✅

- **Spec**: REQ-A2, REQ-A3
- **Files**: `apps/web/src/modules/dashboard/DashboardPage.vue`, `apps/web/src/modules/dashboard/components/TodayLogsCard.vue`
- **Deliverable**:
  - Reemplazar `DASHBOARD_MEAL_SLOTS` por `getMealSlotsForAge(babyAgeMonths)` en TodayLogsCard
  - Labels en español: "Desayuno", "Comida" (NO "Almuerzo"), "Cena", "Colación 1", "Colación 2"
  - Gaps visibles: slots sin log muestran "Sin registro" en el orden cronológico
- **Tests** (visual regression): screenshot tests si están configurados; sino, manual QA
- **TDD**: no aplica (UI integration). Test de aceptación: la página renderiza con la edad correcta del bebé
- **Depends on**: T-00-01

### T-00-05: Update `MenuWeekPage.vue` con `MEALS` age-aware ⏸️ DEFERRED (Bloque 4)

- **Spec**: REQ-A3
- **Files**: `apps/web/src/modules/menus/MenuWeekPage.vue`
- **Deliverable**:
  - Reemplazar `MEALS` array con `getMealSlotsForAge(babyAgeMonths)`
  - Grilla dinámica: 3 columnas (6-9m) / 4 columnas (10-12m) / 5 columnas (13-23m)
  - Drag & drop funciona en todas las columnas
- **Tests**: 1-2 integration tests del componente
- **TDD**: snapshot del componente con diferentes edades
- **Depends on**: T-00-01
- **DEFERRED — reason**: `MenuWeekPage` uses its own data model with lowercase keys (`'desayuno' | 'comida' | 'cena'`) and `menuStore.getPlate(dayKey, mealKey)` doesn't support `SNACK_1`/`SNACK_2`. Adding snack menu slots requires: new menu store handlers, new picker dialog flow, new export logic. This is a Bloque 4 task, not Bloque 0. The dashboard and diary get the 10-23m upgrade first; the menu upgrade is a separate scope. Tracked for Bloque 4 as a new task (T-04-MENU-SNACKS) — open question to resolve before scheduling.

### T-XX-DIARY-PICKER-AGE-AWARE: Update diary meal-type picker (NEW, PR-1.5)

- **Why**: 4R reliability C1. The diary's `AddMealModal.vue:226` and `EditLogModal.vue:301` still emit `MealType.SNACK` (the legacy enum value). The new dashboard's `getMealSlotsForAge` returns `SNACK_1` / `SNACK_2` slots but never `SNACK`. For any baby ≥10m, a colación logged via the diary is **invisible on the dashboard** because `logs.filter(log => log.mealType === def.mealType)` uses strict equality.
- **Scope**:
  - `AddMealModal.vue:223-228`: replace the 4-option hardcoded list with `getMealSlotsForAge(activeBaby.ageInMonths).map(...)` so 6-9m sees no snack option, 10-12m sees `SNACK_1`, 13+ sees `SNACK_1` + `SNACK_2`.
  - `EditLogModal.vue:301`: same change.
  - `autoSelectMealType` (AddMealModal:261): age-aware (no auto-pick of SNACK for <10m babies).
  - Historical `SNACK` data: pick a policy. Recommend one-time backfill in a migration (SNACK → SNACK_1 or SNACK_2 based on `registeredTime`).
- **Tests**: integration test (Playwright E2E or component test once the web harness is set up) that drives the diary modal for a 14m baby, picks the second-snack option, and asserts the dashboard card flips to "Registrado".
- **Depends on**: T-00-01 (getMealSlotsForAge), T-00-04 (dashboard consumer), T-XX-WEB-TESTS-HARNESS (needs a working test harness to write the integration test)
- **Blocker for**: nothing (it's a regression that was always there; PR-1 just made it more visible by changing the slot shape). Lands as **PR-1.7** after PR-1.6c (CI green required).

### T-00-06: Update `DiaryPage.vue` timeline order ✅ (already correct)

- **Spec**: REQ-A4
- **Files**: `apps/web/src/modules/diary/DiaryPage.vue`
- **Deliverable**:
  - Timeline order usa `getMealSlotsForAge(babyAgeMonths)` para renderizar slots en orden cronológico
  - Slots sin log aparecen como "Sin registro" en el orden correcto
- **Tests**: 1 integration test
- **TDD**: snapshot
- **Depends on**: T-00-01
- **NOTE — already implemented**: `DiaryPage.vue` line ~1270 already has `MEAL_TYPE_ORDER` with `[BREAKFAST]: 1, [SNACK_1]: 2, [LUNCH]: 3, [SNACK_2]: 4, [DINNER]: 5, [SNACK]: 6`. So when a 10-23m baby logs a SNACK_1 entry, it shows in chronological position 2. No code change needed. The "Sin registro" placeholder for missing slots is a separate UI scope (new behavior, not a regression). Tracked as a new task T-04-DIARY-GAPS.

### T-00-07: `useStageTransition` composable + tests

- **Spec**: REQ-B1
- **Files**: `apps/web/src/shared/composables/useStageTransition.ts` (new), `apps/web/src/shared/composables/useStageTransition.test.ts` (new)
- **Deliverable**:
  - `useStageTransition(currentAgeMonths)` retorna `{ transition: AgeStage | null, dismissed: boolean }`
  - Lee `localStorage['pakulab:lastSeenAgeMonths']`, `localStorage['pakulab:stageTransition:10_12']`, `localStorage['pakulab:stageTransition:13_17']`
  - Detección de cruce: `currentAgeMonths >= 10 && lastSeen < 10` → `'TEN_TO_TWELVE_MONTHS'`
  - Hook: `dismiss(stage: AgeStage)` escribe en localStorage
- **Tests** (6): detección de cruce, ya dismissed, no hubo cruce, múltiples devices, missing localStorage, dismiss escribe correctamente
- **TDD**: tests de localStorage con mock

### T-00-08: `StageTransitionBanner.vue` component

- **Spec**: REQ-B2
- **Files**: `apps/web/src/modules/dashboard/components/StageTransitionBanner.vue` (new)
- **Deliverable**:
  - Banner con icono 🎉, copy contextual, CTAs "Ver guía de texturas" y "No mostrar de nuevo"
  - "Ver guía de texturas" smooth-scrollea a `TextureGuideCard` y la expande
  - "No mostrar de nuevo" llama a `useStageTransition.dismiss()`
- **Tests** (3): renderiza con transition, click en dismiss oculta banner, click en CTA scrollea
- **TDD**: render test + interaction test
- **Depends on**: T-00-07

### T-00-09: `TextureGuideCard.vue` stage split

- **Spec**: REQ-C1
- **Files**: `apps/web/src/modules/dashboard/components/TextureGuideCard.vue`
- **Deliverable**:
  - Renderizar 5 etapas: 6m, 7-9m, 10-12m, 13-17m, 18-23m
  - Etapa actual marcada visualmente
  - Etapas futuras con label "Próximamente" o estilo atenuado
- **Tests** (2): render para bebé de 8m (ve 6m, 7-9m marcadas + 10-12m/13-17m/18-23m atenuadas), render para bebé de 14m (marca 13-17m)
- **TDD**: snapshot

### T-00-10: `PerceptiveFeedingCard.vue` component

- **Spec**: REQ-E1
- **Files**: `apps/web/src/modules/dashboard/components/PerceptiveFeedingCard.vue` (new)
- **Deliverable**:
  - Card colapsable con header (icono + título) y body con 5 principios OMS
  - Default colapsado en mobile, expandido en desktop
  - Persistencia en sesión (no en localStorage)
- **Tests** (3): colapsado en mobile, expande en click, persiste en sesión
- **TDD**: render + interaction

### T-00-11: Water reminder en `AddMealModal.vue`

- **Spec**: REQ-F1
- **Files**: `apps/web/src/modules/diary/components/AddMealModal.vue`
- **Deliverable**:
  - Panel no-bloqueante con copy: "Ofrecer agua en vaso abierto o popote (NO mamila, NO vaso entrenador, NO vaso 360°)"
  - Copy: "Después de los alimentos, no durante (orden: leche → alimentos → agua)"
  - Copy: "No reemplazar la leche con agua"
  - Una vez por sesión, dismiss con X
- **Tests** (2): muestra al confirmar, no muestra segunda vez en misma sesión
- **TDD**: render + interaction

### T-00-12: `useStageTip(ageMonths)` en `useDashboardTips.ts`

- **Spec**: REQ-D2
- **Files**: `apps/web/src/shared/composables/useDashboardTips.ts`
- **Deliverable**:
  - `useStageTip(ageMonths)` retorna un tip de `STAGE_TIPS[ageStageFor(months)]` rotado
  - No immediate repeat en misma sesión
- **Tests** (3): retorna tip de etapa correcta, no immediate repeat, cambia con edad
- **TDD**: pure function test
- **Depends on**: T-00-02

---

### T-XX-WEB-TESTS-HARNESS: Add vitest harness to `apps/web` ✅ (chained PR-1.6a + PR-1.6b + PR-1.6c, all merged)

- **Why**: `apps/web` had no test runner, no test config, and no `*.vue` ambient. This made it impossible to write the integration test for `T-XX-DIARY-PICKER-AGE-AWARE` and any other component test. PR-1.6a/b/c ship the harness as 3 chained PRs to stay under the 400-line pre-PR review gate.
- **Scope (PR-1.6a)** — minimal harness:
  - `apps/web/package.json`: devDeps `vitest@^2.1`, `@vue/test-utils@^2.4`, `happy-dom@^20.10.6` (CVE-patched, not 15.x). Scripts `test` / `test:run` / `test:watch`.
  - `apps/web/vitest.config.ts`: extends `vite.config.ts` via `mergeConfig`. `environment: 'happy-dom'`, `globals: false`, `include: ['src/**/*.{test,spec}.ts']`, `exclude` list for 9 pre-existing broken files.
  - `apps/web/env.d.ts`: `declare module '*.vue'` ambient.
  - `apps/web/src/__tests__/harness.test.ts`: 1 sanity test.
  - `apps/web/src/__tests__/AppButton.test.ts`: 6 component tests (slot, variant/size, disabled, loading, emit, no-emit-when-disabled).
  - `pnpm-lock.yaml` deliberately NOT in PR-1.6a — regenerated in PR-1.6b.
- **Scope (PR-1.6b)** — safety belt + root test:
  - `apps/api/vitest.config.ts`: `forbidOnly: !!process.env.CI` (with `@ts-expect-error` because vitest 2.x's `UserConfig['test']` resolves to vite's `InlineConfig`).
  - `apps/web/vitest.config.ts`: same `forbidOnly` line (no `@ts-expect-error` because `mergeConfig` infers the second arg as vitest's `UserConfig`).
  - `apps/api/tsconfig.json`: include `vitest.config.ts`.
  - `package.json` (root): `test: "pnpm --recursive test:run"`.
- **Scope (PR-1.6c)** — CI + forecast:
  - `.github/workflows/test.yml`: Node 20, pnpm 9, frozen lockfile, builds shared, typecheck, test, `CI=true`. Trigger: PRs to `staging` + `release/**`. concurrency cancel-in-progress.
  - `openspec/changes/etapa-10-23-meses/tasks.md`: forecast 8 → 10 PRs, new PR-1.6a/b/c/8 rows.
- **Tests**: 9 files / 65/65 tests passing after the 3 PRs land. vue-tsc clean. CI green required before PR-1.7.
- **Blocker for**: T-XX-DIARY-PICKER-AGE-AWARE (PR-1.7) needs a working test harness to write the integration test.

### T-XX-WEB-TESTS-FIX: Fix 9 pre-existing broken web test files (PR-1.8)

- **Why**: When the vitest harness was first wired up, 9 test files (50 tests) were already broken before this change. They are excluded via `vitest.config.ts` `exclude` and tracked here so the silent-rot trap is at least named. PR-1.8 cleans them up.
- **Files (excluded from PR-1.6a, scheduled for PR-1.8)**:
  - `apps/web/src/modules/dashboard/components/AllergenAlertsCard.test.ts`
  - `apps/web/src/modules/dashboard/components/DashboardErrorBoundary.test.ts`
  - `apps/web/src/modules/dashboard/components/DashboardHeader.test.ts`
  - `apps/web/src/modules/dashboard/components/DashboardSkeleton.test.ts`
  - `apps/web/src/modules/menus/MenuWeekPage.test.ts`
  - `apps/web/src/modules/menus/components/MenuExportFrame.test.ts`
  - `apps/web/src/shared/stores/authStore.email.test.ts`
  - `apps/web/src/shared/stores/dashboardStore.test.ts`
  - `apps/web/src/shared/stores/menuStore.test.ts`
- **Scope (TBD per file)**: open each test file, see what it imports, fix import paths / missing mocks / type errors / pre-existing component changes. Likely mostly stale imports after refactors + missing mocks for stores.
- **Tests**: each fixed file must pass individually AND as part of `pnpm test`. After PR-1.8, remove the 9 entries from `vitest.config.ts` `exclude`.
- **Blocker for**: nothing, but blocking `apps/web` from being a real test-target for Bloque 2-5 work.

---

### T-XX-BACKFILL-SNACK-SAFETY: Safety/idempotency tests for backfill-snack-to-snack1.ts ✅

- **Why**: The backfill script (`prisma/scripts/backfill-snack-to-snack1.ts`) rewrites historical `MealType.SNACK` rows to `SNACK_1`. Safety and idempotency must be verified without touching a production database.
- **Files**: `prisma/scripts/backfill-snack-to-snack1.ts`, `prisma/scripts/backfill-snack-to-snack1.test.ts`, `prisma/vitest.config.ts`
- **Deliverable**:
  - Minimal refactor of the script into exported pure/testable functions (`parseArgs`, `runBackfill`) while preserving CLI behavior via `main()`.
  - `BackfillResult` return type so tests can assert on counts and sample without parsing `console.log`.
  - Guard `main()` execution with `import.meta.url === process.argv[1]` so importing the module in tests does not trigger the CLI.
  - Vitest config under `prisma/vitest.config.ts` so the script test runs without crossing `apps/api` `rootDir`.
- **Tests** (13): dry-run default (no writes), `--apply` rewrites only SNACK→SNACK_1, idempotency, deleted rows excluded, non-SNACK rows untouched, argument parsing fail-closed, dry-run sample, apply skips sample, self-check throws on remaining rows.
- **TDD**: strict TDD — tests written first, script refactored to pass, triangulated with edge cases.

---

## Bloque 1 — Seed audit 10-23m (PR-3) ✅ RE-SCOPED

> **REALITY UPDATE (PR-3, 2026-06-26)**: This block's original plan (written 2026-06-18) was made OBSOLETE by the later 154-food catalog expansion (`feat/food-catalog-pediatrician-guide`). The 6 "new" foods ALREADY EXIST in `prisma/seed.ts`. The original spec also assumed schema fields (`isIronRich`, `warningTags`, `DAIRY` group, `allergenType` as `MILK` enum) that DO NOT EXIST in the current schema — those belong to later Bloques (3/5 migrations). PR-3 was therefore re-scoped to **audit documentation + a DB-free integrity test**, with NO food data changes.
>
> **Clinical/product decisions (user, authoritative)**:
> 1. `ageMonths` KEPT at the seed's current 6-8m values — they follow the Protocolo Beikost / Dra. Trueba guide (`docs/Guia de alimentos_Pau Trueba.pdf`). The spec's 10-12m proposal is obsolete.
> 2. `needsValidation` KEPT at `false` — the 6 foods were validated during the catalog expansion. Not re-flagged.

### T-01-01: ~~Agregar 6 alimentos~~ → Document existing 6 foods ✅ (PR-3)

- **Spec**: REQ-2-A1 (re-scoped)
- **Files**: `prisma/seed.ts`
- **OBSOLETE**: the 6 foods already exist — 'Yogurt natural entero (sin azúcar)', 'Queso panela'/'Queso requesón'/'Queso cottage' (the spec's "queso fresco" maps to 3 cheeses), 'Frijol negro cocido', 'Lenteja cocida', 'Garbanzo cocido', 'Hígado de pollo cocido'. All `group: PROTEIN`, `needsValidation: false`, `ageMonths` 6-8m.
- **DEFERRED to later Bloques** (schema fields don't exist yet): `isIronRich` (REQ-A3) and `warningTags` (REQ-A1, garbanzo choking) → Bloque 3 (PR-5). `allergenType` is a `String` (`'dairy'`), not a `MILK` enum. No `DAIRY` group (PROTEIN covers dairy).
- **Done**: documented the 6 foods + clinical rationale in a seed.ts audit comment block.

### T-01-02: Audit section en seed.ts ✅ (PR-3)

- **Spec**: REQ-2-B1
- **Files**: `prisma/seed.ts`
- **Done**: added a `// ── BLOQUE 1 (PR-3): 10-23m AGE AUDIT ──` comment block documenting that the 6 foods' `ageMonths` (6-8m) follow Protocolo Beikost / Dra. Trueba (not the obsolete 10-12m), that `needsValidation: false` is intentional, and that `isIronRich`/`warningTags` are deferred.
- **Note**: the proposed `ageMonths` backfill for aguacate/mango/plátano was NOT needed — the catalog expansion already categorized them. No data changes made.

### T-01-03: Seed integrity test ✅ (PR-3)

- **Spec**: REQ-2-A1 (re-scoped)
- **Files**: `prisma/scripts/seed-audit.test.ts` (new — DB-free, not `apps/api/test/`)
- **Done**: DB-free test importing the exported `foods` array and asserting the 6 target foods exist with their current `group`/`isAllergen`/`allergenType`/`ageMonths`/`needsValidation` (snapshot-locked so accidental changes are caught), the 3-cheese cluster, and a no-duplicate-names guard. 10 tests. `foods` and `FoodSeed` are now exported from `seed.ts`.
- **Verified**: prisma 24/24, api 381/381.

---

## Bloque 2 — Backend derivado sin schema

### T-02-01: `computeAllergenStatus` pure function

- **Spec**: REQ-3-A1, REQ-3-A2, REQ-3-A3
- **Files**: `apps/api/src/modules/allergens/allergens.service.ts` (new)
- **Deliverable**:
  - Función pura `computeAllergenStatus({ foodLogs, ageMonths, allAllergenTypes, closingWindowAgeMonths })` que retorna `AllergenStatusResponse`
  - Lógica: por cada `allergenType` en `TOP_ALLERGENS`, filtrar FoodLogs, excluir REJECTED, contar exposures, determinar status
  - Status: `introduced` (≥1 exposure válida), `pending` (ageMonths ≥ 10 y no introduced), `in_window` (ageMonths < 10 y no introduced)
- **Tests** (6): 0 exposures, 1 exposure LIKED, 1 exposure REJECTED, 8 exposures, bebé 11m sin leche, bebé 14m todos
- **TDD**: pure function test primero, sin Prisma

### T-02-02: `allergensService.getStatus()` wrapper

- **Spec**: REQ-3-A1
- **Files**: `apps/api/src/modules/allergens/allergens.service.ts`
- **Deliverable**:
  - `getStatus(babyProfileId)` carga FoodLog + Food, llama a `computeAllergenStatus`, retorna shape completo
  - Validación de ownership: `babyProfile.userId === userId`
- **Tests** (3): success, wrong ownership, baby not found
- **TDD**: integration test con Prisma mockeado
- **Depends on**: T-02-01

### T-02-03: `GET /api/allergens/status` route

- **Spec**: REQ-3-A1, REQ-3-A4
- **Files**: `apps/api/src/modules/allergens/allergens.routes.ts`
- **Deliverable**:
  - Ruta con `preHandler: [requireAuth, requireTier('PRO', { code: 'INSUFFICIENT_TIER' })]`
  - Query: `babyProfileId: string` validado con Zod
  - Llama a `allergensService.getStatus`
  - Cache TTL 1h via `DASHBOARD_CACHE_TTL.allergens`
- **Tests** (3): 200 PRO, 403 FREE (INSUFFICIENT_TIER), 401 sin auth
- **TDD**: route test
- **Depends on**: T-02-02

### T-02-04: `allergens.service.test.ts` completo

- **Spec**: REQ-3-A1, REQ-3-A2, REQ-3-A3, REQ-3-A4
- **Files**: `apps/api/src/modules/allergens/allergens.service.test.ts` (new)
- **Deliverable**: tests unitarios de `computeAllergenStatus` + tests de `getStatus` con Prisma mock
- **Tests**: 10+ (incluye edge cases)
- **TDD**: tests primero
- **Depends on**: T-02-01, T-02-02

### T-02-05: Allergens integration test (route + service)

- **Spec**: REQ-3-A4
- **Files**: `apps/api/src/modules/allergens/allergens.routes.test.ts` (new)
- **Deliverable**: integration test que levanta el server, hace GET, verifica shape de respuesta y códigos de error
- **Tests**: 4-5 (200, 403, 401, 400 query invalida, cache hit segundo request)
- **TDD**: test primero
- **Depends on**: T-02-03

---

## Bloque 3 — Schema migration (WarningTag) + ALLERGEN_TYPE_MAPPING move

### T-03-01: Add `WarningTag` enum to schema + shared types mirror (TDD: RED)

- **Spec**: REQ-4-A1
- **Files**: `prisma/schema.prisma`, `packages/shared/src/types/food.ts`, `packages/shared/src/types/food.test.ts` (new)
- **TDD cycle**:
  1. RED: Write test `packages/shared/src/types/food.test.ts` asserting `WARNING_TAGS` array has 4 values and `WarningTag` type is assignable to each. Test fails (types don't exist).
  2. GREEN: Add `WARNING_TAGS` const array and `WarningTag` union type to `packages/shared/src/types/food.ts`. Add `warningTags: readonly WarningTag[]` to `Food` interface. Tests pass.
  3. GREEN: Add Prisma enum to `prisma/schema.prisma`: `enum WarningTag { PROHIBITED_UNDER_24M CHOKING_HAZARD_UNDER_5Y PROHIBITED_PEDIATRIC REQUIRES_PREPARATION }` and `warningTags WarningTag[] @default([])` to `model Food`. Run `pnpm --filter api prisma generate` to regenerate client.
  4. TRIANGULATE: Add test asserting `WARNING_TAGS` matches Prisma enum values exactly (import from generated client, compare). Add test asserting empty array default compiles.
  5. REFACTOR: None needed (pure type addition).
- **Deliverable**:
  - Prisma enum with 4 values: `PROHIBITED_UNDER_24M`, `CHOKING_HAZARD_UNDER_5Y`, `PROHIBITED_PEDIATRIC`, `REQUIRES_PREPARATION`.
  - Shared types: `WARNING_TAGS` const array, `WarningTag` union type, `Food.warningTags` field.
  - Schema convention followed: Prisma enum mirrored into shared types (same pattern as `FoodGroup`, `ALClassification`).
- **Tests** (4): WARNING_TAGS length 4, WarningTag assignability, Prisma-shared sync, default [] compiles.
- **LOC est.**: ~25 (10 schema + 10 types + 5 test).

### T-03-02: Create migration SQL (TDD: GREEN — migration is additive SQL, test via apply)

- **Spec**: REQ-4-A1 (non-destructive constraint)
- **Files**: `prisma/migrations/XXXX_warning_tags/migration.sql` (generated), `prisma/scripts/migration-non-destructive.test.ts` (new)
- **TDD cycle**:
  1. RED: Write DB-free test `prisma/scripts/migration-non-destructive.test.ts` asserting generated SQL contains `CREATE TYPE "WarningTag"`, `ALTER TABLE "Food" ADD COLUMN "warningTags"`, `NOT NULL DEFAULT '{}'`, and does NOT contain `DROP`, `ALTER COLUMN` (destructive), or `DELETE`. Test fails (migration doesn't exist).
  2. GREEN: Run `pnpm --filter api prisma migrate dev --name warning_tags --create-only`. Prisma generates the migration SQL. Apply it via `pnpm --filter api prisma migrate dev`. Test passes (reads the generated file, asserts additive-only SQL).
  3. TRIANGULATE: Add test asserting migration is idempotent (applying twice doesn't error). Use Prisma's `migrate resolve --applied` simulation or a read-only SQL parse.
  4. REFACTOR: None (SQL is generated).
- **Deliverable**:
  - Migration SQL: `CREATE TYPE "WarningTag" AS ENUM ('PROHIBITED_UNDER_24M', 'CHOKING_HAZARD_UNDER_5Y', 'PROHIBITED_PEDIATRIC', 'REQUIRES_PREPARATION');` and `ALTER TABLE "Food" ADD COLUMN "warningTags" "WarningTag"[] NOT NULL DEFAULT '{}';`.
  - DB-free test asserting additive-only SQL (no destructive ops).
- **Tests** (3): SQL contains CREATE TYPE, SQL contains ADD COLUMN with default, SQL has no DROP/DELETE/destructive ALTER.
- **Non-destructive verified**: Existing Food rows get `warningTags = []` default, no data loss.
- **Precedent**: `prisma/scripts/seed-audit.test.ts` (PR-3) is DB-free, imports seed array. This test imports the migration file as text, asserts SQL shape.
- **LOC est.**: ~20 (5 SQL + 15 test).
- **Depends on**: T-03-01 (schema must declare enum before migration).

### T-03-03: Backfill `warningTags` in seed.ts (TDD: RED → GREEN → TRIANGULATE)

- **Spec**: REQ-4-A2 (clinical data from PDF page 7)
- **Files**: `prisma/seed.ts`, `prisma/scripts/seed-audit.test.ts` (extend existing)
- **Clinical data source**: `docs/Guia de alimentos_Pau Trueba.pdf` page 7 ("SUGERENCIAS Y DATOS"). Authoritative. No invented content.
- **TDD cycle**:
  1. RED: Extend `prisma/scripts/seed-audit.test.ts` with a new test suite `describe('WarningTag backfill', ...)` asserting:
     - "Leche de vaca entera" has `warningTags: ['PROHIBITED_UNDER_24M']`.
     - "Miel" has `warningTags: ['PROHIBITED_UNDER_24M']`.
     - "Uvas (sin semilla, en cuartos)" has `warningTags: ['CHOKING_HAZARD_UNDER_5Y']`.
     - "Cacahuate tostado" (peanuts) has `warningTags: ['CHOKING_HAZARD_UNDER_5Y']`.
     - "Garbanzo cocido" is flagged in test comment as "NOT on PDF page 7 verbatim; defer to product confirmation or omit tag". Test fails (foods don't have tags yet).
  2. GREEN: Update `prisma/seed.ts` with a `// ── BLOQUE 3 (PR-5): WARNING TAGS BACKFILL ──` comment block. Map foods to tags using ONLY PDF page 7 data:
     - PROHIBITED_UNDER_24M: leche de vaca entera, yogur griego, miel, azúcar, edulcorantes, embutidos (jamón, salchicha), bebidas vegetales (almendras, coco, soya), jugos, gelatinas, dulces, chocolate, galletas con azúcar.
     - CHOKING_HAZARD_UNDER_5Y: frutos secos (nueces, almendras, cacahuate), pescado con espinas, palomitas, redondos enteros (uvas, arándanos, pasas, cerezas, aceitunas), duros en trozo (jícama cruda, zanahoria cruda, manzana cruda).
     - PROHIBITED_PEDIATRIC: café, té (cafeína), ultraprocesados (explicitly called out on page 7).
     - REQUIRES_PREPARATION: derived for "duros en trozo" foods that need specific prep (e.g., manzana → cook or grate; zanahoria → cook). Use sparingly, only when PDF guidance explicitly mentions prep.
     - GARBANZO: NOT on page 7 verbatim. Add comment: `// NOTE: garbanzo CHOKING_HAZARD deferred per seed.ts:862; not on PDF page 7. Confirm with product/clinical team.` DO NOT tag garbanzo yet.
  3. TRIANGULATE: Add test asserting foods without tags keep `warningTags: []` (e.g., "Aguacate", "Plátano"). Add test asserting multi-tag foods work (e.g., if a food needs both CHOKING + REQUIRES_PREPARATION).
  4. REFACTOR: Extract tag assignment into a helper `assignWarningTag(foodName, tags)` if backfill grows large. Keep it inline for now (under 20 assignments expected).
- **Deliverable**:
  - Seed backfill block with clinical source citation: `// Source: docs/Guia de alimentos_Pau Trueba.pdf page 7`.
  - ~15-20 food tag assignments based on PDF page 7.
  - Test coverage: 6-8 assertions (sample of prohibited, choking, pediatric, and zero-tag foods).
- **Tests** (8): PROHIBITED_UNDER_24M (leche, miel, azúcar), CHOKING_HAZARD_UNDER_5Y (uvas, nueces, cacahuate), PROHIBITED_PEDIATRIC (café), no-tag foods (aguacate), garbanzo flagged for confirmation.
- **LOC est.**: ~40 (30 seed + 10 test).
- **Depends on**: T-03-02 (migration applied, enum exists in DB).

### T-03-04: Move ALLERGEN_TYPE_MAPPING to @pakulab/shared (TDD: RED → GREEN → REFACTOR)

- **Spec**: PR-4 deferred follow-up (state.yaml line 73), same domain as PR-5 (both touch shared food/allergen types).
- **Files**: `packages/shared/src/constants/allergens.ts` (new), `apps/api/src/modules/allergens/allergens.service.ts`, `apps/api/src/modules/allergens/allergens.service.test.ts`
- **Why bundle with PR-5**: Both PR-4 allergens backend and PR-5 warnings touch shared food metadata. Moving the mapping unblocks future dashboard consumption of allergen names without duplicating the English→Spanish bridge. Low risk (~15 LOC move + 2 test updates), same domain.
- **TDD cycle**:
  1. RED: Write test `packages/shared/src/constants/allergens.test.ts` asserting `ALLERGEN_TYPE_MAPPING` is exported, has 9 keys (dairy, egg, peanut, fish, shellfish, soy, gluten, tree_nuts, sesame), and values match `TOP_ALLERGENS` keys. Test fails (constant doesn't exist in shared).
  2. GREEN: Copy `ALLERGEN_TYPE_MAPPING` from `apps/api/src/modules/allergens/allergens.service.ts` to `packages/shared/src/constants/allergens.ts`. Export it. Update `apps/api/src/modules/allergens/allergens.service.ts` to import from `@pakulab/shared`. Tests pass.
  3. TRIANGULATE: Add test asserting celery is NOT in the mapping (explicit exclusion). Add test asserting values are unique (no duplicate Spanish keys).
  4. REFACTOR: Remove old constant block from `allergens.service.ts`. Update `allergens.service.test.ts` to import from shared. Run `pnpm turbo test` to confirm no breaks.
- **Deliverable**:
  - `packages/shared/src/constants/allergens.ts` with `ALLERGEN_TYPE_MAPPING` (9 entries) and clinical comment block.
  - `apps/api/src/modules/allergens/allergens.service.ts` imports from `@pakulab/shared`.
  - No behavior change (pure move).
- **Tests** (5): mapping exists in shared, 9 keys, no celery, unique values, api imports from shared and tests still pass.
- **LOC est.**: ~20 (5 new file + 10 comment + 5 refactor).
- **Depends on**: none (independent, but bundled for domain coherence).

---

**PR-5 subtotal (T-03-01..04)**: ~105 LOC (schema 10 + types 10 + tests 20 + migration 5 + test 15 + seed 30 + test 10 + shared move 5). Under 400-line budget even with UI tasks below.

---

## Bloque 4 — Features (orden: C2 → B3 → C1 → D2 → D3 → E1 → E2)

### Sub-bloque 4.1 (C2 — Serving Amount)

#### T-04-01: Zod schema para `servingAmount`

- **Spec**: REQ-5-B1, REQ-5-B3
- **Files**: `apps/api/src/modules/plates/plates.schemas.ts`
- **Deliverable**:
  - `plateItemSchema.servingAmount`: `z.string().regex(/^[1-4]$/).nullish()`
  - Mensaje de error: "Porción debe ser 1, 2, 3 o 4 cdas"
- **Tests** (3): acepta "1", "2", "3", "4"; rechaza "5", "0", "abc"; acepta null
- **TDD**: test Zod

#### T-04-02: `PlateContents.vue` serving amount selector

- **Spec**: REQ-5-B1
- **Files**: `apps/web/src/modules/plates/components/PlateContents.vue`
- **Deliverable**:
  - Selector de porción (1, 2, 3, 4 cdas) por slot
  - Default 1 cda para slots nuevos
  - Preserva valor existente
- **Tests** (2): default 1, preserva valor
- **TDD**: render + interaction
- **Depends on**: T-04-01

#### T-04-03: `PlateVisualization.vue` "X cdas" indicator

- **Spec**: REQ-5-B2, REQ-5-B3
- **Files**: `apps/web/src/modules/plates/components/PlateVisualization.vue`
- **Deliverable**:
  - Indicador de suma total "X cdas en total" en header
  - Banner warning si algún grupo tiene >4 cdas: "Estás ofreciendo más de 4 cdas por grupo, asegurate de respetar las señales de saciedad"
- **Tests** (3): suma correcta, no warning si ≤4, warning si >4
- **TDD**: render
- **Depends on**: T-04-02

### Sub-bloque 4.2 (B3 — Warnings UI)

#### T-04-11: `WarningBadge.vue` shared component (TDD: RED → GREEN → TRIANGULATE)

- **Spec**: REQ-4-B1, REQ-4-B3 (reusable badge + tooltip)
- **Files**: `apps/web/src/shared/components/atoms/WarningBadge.vue` (new), `apps/web/src/shared/components/atoms/WarningBadge.test.ts` (new)
- **Why extract first**: T-04-12..14 all need the same badge logic (icon + tooltip with tag description + pediatra disclaimer). Extracting a shared atom cuts duplication and ensures consistent copy/styling. Follows Atomic Design (atoms are smallest reusable UI elements).
- **TDD cycle**:
  1. RED: Write test `WarningBadge.test.ts` asserting:
     - Renders ⚠️ icon when `tags` prop is non-empty.
     - Does NOT render when `tags` prop is empty.
     - Tooltip shows Spanish description for `PROHIBITED_UNDER_24M` (e.g., "No recomendado antes de los 2 años. Riesgo de botulismo.").
     - Tooltip shows Spanish description for `CHOKING_HAZARD_UNDER_5Y` (e.g., "Riesgo de atragantamiento en menores de 5 años. Ofrecer cortado/machacado según edad.").
     - Tooltip always ends with "Si tienes dudas, consulta a tu pediatra." (es-MX TUTEO, not voseo). Test fails (component doesn't exist).
  2. GREEN: Create `WarningBadge.vue` with:
     - Props: `tags: readonly WarningTag[]`.
     - Computed `showBadge`: `tags.length > 0`.
     - Computed `tooltipText`: map each tag to Spanish description + append pediatra disclaimer.
     - Template: conditional render of ⚠️ icon (red) with tooltip.
     - Copy (es-MX TUTEO):
       - `PROHIBITED_UNDER_24M`: "No recomendado antes de los 2 años. Consulta la guía de preparación."
       - `CHOKING_HAZARD_UNDER_5Y`: "Riesgo de atragantamiento en menores de 5 años. Ofrece cortado o machacado según edad."
       - `PROHIBITED_PEDIATRIC`: "No recomendado en toda la edad pediátrica. Evita su consumo."
       - `REQUIRES_PREPARATION`: "Requiere preparación específica (cocción, corte). Consulta la guía de texturas."
       - Footer (all): "Si tienes dudas, consulta a tu pediatra."
  3. TRIANGULATE: Add test for multi-tag food (e.g., `[CHOKING_HAZARD_UNDER_5Y, REQUIRES_PREPARATION]`) — tooltip shows both descriptions. Add test for unknown tag (graceful fallback to generic warning).
  4. REFACTOR: Extract tag→description map into a `WARNING_TAG_DESCRIPTIONS` const if it grows. Keep inline for now (4 tags, ~10 lines).
- **Deliverable**:
  - Reusable atom component with props-based rendering.
  - Spanish copy (es-MX TUTEO) for all 4 tags + pediatra disclaimer.
  - Red icon (⚠️) with tooltip (hover/tap).
- **Tests** (6): render with tag, no render without tag, PROHIBITED_UNDER_24M copy, CHOKING_HAZARD_UNDER_5Y copy, multi-tag, pediatra disclaimer present.
- **LOC est.**: ~40 (30 component + 10 test).
- **Depends on**: T-03-01 (WarningTag type exists in shared).

#### T-04-12: Integrate `WarningBadge` in `FoodSearchPage.vue` (TDD: RED → GREEN)

- **Spec**: REQ-4-B1
- **Files**: `apps/web/src/modules/foods/FoodSearchPage.vue`, `apps/web/src/modules/foods/FoodSearchPage.test.ts` (extend or new)
- **TDD cycle**:
  1. RED: Write test asserting food card with `warningTags: ['PROHIBITED_UNDER_24M']` renders `WarningBadge` component. Food card without tags does NOT render badge. Test fails (badge not integrated).
  2. GREEN: Import `WarningBadge` in `FoodSearchPage.vue`. Add `<WarningBadge :tags="food.warningTags" />` to each food card. Test passes.
  3. REFACTOR: None (pure integration).
- **Deliverable**: Food cards in search results show badge when food has tags.
- **Tests** (2): renders badge for tagged food, no badge for clean food.
- **LOC est.**: ~10 (5 template + 5 test).
- **Depends on**: T-04-11 (WarningBadge component), T-03-03 (seed backfill so test data exists).

#### T-04-13: Integrate `WarningBadge` + warning panel in `FoodSearchModal.vue` (TDD: RED → GREEN → TRIANGULATE)

- **Spec**: REQ-4-B2
- **Files**: `apps/web/src/modules/foods/FoodSearchModal.vue`, `apps/web/src/modules/foods/FoodSearchModal.test.ts` (extend or new)
- **TDD cycle**:
  1. RED: Write test asserting modal for food with `warningTags: ['CHOKING_HAZARD_UNDER_5Y']` renders:
     - Badge at top (via `WarningBadge`).
     - Warning panel (red background) below food detail with list of tag descriptions (same Spanish copy as badge tooltip but in panel format).
     - "Agregar al plato" button is NOT disabled (AD-02: informative, not blocking). Test fails (panel doesn't exist).
  2. GREEN: Add `WarningBadge` to modal header. Add conditional panel `<div v-if="food.warningTags.length > 0" class="warning-panel">...</div>` with:
     - List of tag descriptions (reuse same Spanish copy as `WarningBadge`, or call a shared `getWarningDescription(tag)` util).
     - Red background, icon, "Advertencia de seguridad" header.
     - Pediatra disclaimer at bottom.
     - Button remains enabled. Test passes.
  3. TRIANGULATE: Add test asserting food without tags shows NO panel. Add test asserting multi-tag food shows all descriptions in panel.
  4. REFACTOR: Extract `getWarningDescription(tag: WarningTag): string` into `apps/web/src/shared/utils/warning-descriptions.ts` if both badge and panel use it. Keep DRY.
- **Deliverable**: Modal shows badge + red warning panel with full clinical guidance. Selection not blocked.
- **Tests** (4): badge render, panel render with tag, no panel without tag, multi-tag panel.
- **LOC est.**: ~35 (20 template/logic + 15 test).
- **Depends on**: T-04-11 (WarningBadge).

#### T-04-14: Integrate `WarningBadge` in `MenuWeekPage.vue` (TDD: RED → GREEN)

- **Spec**: REQ-4-C1
- **Files**: `apps/web/src/modules/menus/MenuWeekPage.vue`, `apps/web/src/modules/menus/MenuWeekPage.test.ts` (extend or new)
- **TDD cycle**:
  1. RED: Write test asserting menu slot with food having `warningTags` renders `WarningBadge` next to food name. Test fails (badge not integrated).
  2. GREEN: Import `WarningBadge` in `MenuWeekPage.vue`. Add `<WarningBadge :tags="slot.food.warningTags" />` to each slot cell. Test passes.
  3. REFACTOR: None.
- **Deliverable**: Menu week grid shows badge for slots with tagged foods.
- **Tests** (2): badge render for tagged slot, no badge for clean slot.
- **LOC est.**: ~10 (5 template + 5 test).
- **Depends on**: T-04-11 (WarningBadge).
- **NOTE**: MenuWeekPage deferred from Bloque 0 (T-00-05) due to data model mismatch. If menu slots still don't support SNACK_1/SNACK_2 by PR-5, this task integrates badge into existing 3-meal grid only. Full menu upgrade is separate scope.

#### T-04-15: Integrate `WarningBadge` in `PlateBuilderDrawer.vue` (TDD: RED → GREEN)

- **Spec**: REQ-4-C2
- **Files**: `apps/web/src/modules/plates/components/PlateBuilderDrawer.vue`, `apps/web/src/modules/plates/components/PlateBuilderDrawer.test.ts` (extend or new)
- **TDD cycle**:
  1. RED: Write test asserting plate slot with dragged food having `warningTags` renders `WarningBadge` next to food name. Test fails (badge not integrated).
  2. GREEN: Import `WarningBadge` in `PlateBuilderDrawer.vue`. Add `<WarningBadge :tags="item.food.warningTags" />` to each plate item slot. Test passes.
  3. REFACTOR: None.
- **Deliverable**: Plate builder shows badge when food with tags is dropped into a slot.
- **Tests** (2): badge render for tagged item, no badge for clean item.
- **LOC est.**: ~10 (5 template + 5 test).
- **Depends on**: T-04-11 (WarningBadge).

---

**PR-5 subtotal (T-03-01..04 + T-04-11..15)**: ~250 LOC (backend 105 + badge 40 + integrations 65 + tests 40). Under 400-line budget. Tight, but achievable with the shared `WarningBadge` extraction cutting duplication.

---

### Review Workload Forecast (PR-5 specific)

| Field | Value |
|-------|-------|
| Estimated changed lines (schema + types + seed + UI) | ~250 |
| Estimated test lines | ~95 (included in total) |
| Migration lines | ~20 (non-destructive ADD COLUMN) |
| 400-line budget risk | Low (under budget, single-domain scope) |
| Chained PRs recommended | No (self-contained, under review threshold) |
| Clinical data completeness risk | Low (PDF page 7 is authoritative, garbanzo flagged for confirmation) |
| Duplication risk | Low (WarningBadge.vue extracted as atom, reused 4x) |
| Decision needed before apply | No (scope confirmed, clinical data sourced, ALLERGEN_TYPE_MAPPING move approved as same-domain bundling) |

**Open questions for product/clinical before apply**:
1. **Garbanzo CHOKING_HAZARD**: PDF page 7 does NOT list garbanzo verbatim in the choking section. Seed.ts:862 deferred it. Should PR-5 tag garbanzo or wait for clinical confirmation? Recommend: add TODO comment in seed backfill, defer tagging until confirmed.
2. **REQUIRES_PREPARATION enum value**: Not directly sourced from PDF page 7. Design doc AD-04 includes it. Should it stay or be removed from the enum? Recommend: keep it (design decision), use sparingly (e.g., "duros en trozo" foods like jícama/zanahoria cruda that need cooking), document rationale in seed comment.

### Sub-bloque 4.3 (C1 — Plate Group Count Suggestion)

#### T-04-05: `PlateBuilderDrawer.vue` group count selector

- **Spec**: REQ-5-A1, REQ-5-A2
- **Files**: `apps/web/src/modules/plates/components/PlateBuilderDrawer.vue`
- **Deliverable**:
  - Selector de groupCount con opciones 4 y 5 (6 si DAIRY existiera, no aplica)
  - Badge "Sugerido para X meses" junto a la opción recomendada
  - Usa `getSuggestedGroupCount(babyAgeMonths)`
- **Tests** (3): bebé 8m con groupCount 5 ve sugerencia a 4, bebé 11m con 4 ve sugerencia a 5, override manual funciona
- **TDD**: render + interaction
- **Depends on**: T-00-03

### Sub-bloque 4.4 (D2 — Allergen Tracker Card UI)

#### T-04-06: `AllergenTrackerCard.vue` base component

- **Spec**: REQ-3-B1, REQ-3-B2
- **Files**: `apps/web/src/modules/dashboard/components/AllergenTrackerCard.vue` (new)
- **Deliverable**:
  - Card con header "Alérgenos prioritarios"
  - Lista de 8 alérgenos con chip de status (verde/amarillo/rojo)
  - Banner "X alérgenos sin introducir, ventana cerrándose" si `closingWindow && introducedCount < 8`
  - Hidden si bebé < 6m
- **Tests** (4): hidden bebé 4m, render PRO bebé 8m, render con banner, sin banner si no hay closing
- **TDD**: render con mock data
- **Depends on**: T-02-03 (route exists)

#### T-04-07: `AllergenTrackerCard.vue` FREE user CTA

- **Spec**: REQ-3-B3
- **Files**: `apps/web/src/modules/dashboard/components/AllergenTrackerCard.vue`
- **Deliverable**:
  - Si `user.tier === 'FREE'`: muestra header + 8 placeholders grisados + CTA "Activar PRO para ver el detalle"
  - CTA navega a `/billing`
- **Tests** (2): render FREE user, click en CTA navega
- **TDD**: render + interaction
- **Depends on**: T-04-06

#### T-04-08: Wire `AllergenTrackerCard` a `DashboardPage`

- **Spec**: REQ-3-B1
- **Files**: `apps/web/src/modules/dashboard/DashboardPage.vue`
- **Deliverable**: integrar la card en el dashboard layout (posición: debajo de TodayLogs, antes de BalanceInsight)
- **Tests** (1): render condicional por edad
- **TDD**: render
- **Depends on**: T-04-07

#### T-04-09: `AllergenTrackerCard.test.ts` integration

- **Files**: `apps/web/src/modules/dashboard/components/AllergenTrackerCard.test.ts` (new)
- **Deliverable**: integration tests del componente
- **Tests**: 3-4 (render con data mock, FREE user, banner closing window, hidden <6m)

### Sub-bloque 4.5 (D3 — Exposure Reminder)

#### T-04-10: Exposure reminder en dashboard

- **Spec**: REQ-3-B2 (extensión)
- **Files**: `apps/web/src/modules/dashboard/DashboardPage.vue` o componente nuevo
- **Deliverable**:
  - Banner contextual: "Ofrecé [alérgeno] esta semana, ventana cerrándose" si hay alérgenos `pending` con `closingWindow: true`
  - Máximo 1 banner (prioriza el de mayor urgencia)
- **Tests** (1): render con alérgenos pending
- **TDD**: render
- **Depends on**: T-04-08

### Sub-bloque 4.6 (E1 — Iron Priority)

#### T-04-16: `getSuggestedFoods` prioriza hierro

- **Spec**: REQ-6-A1
- **Files**: `apps/api/src/modules/dashboard/dashboard.service.ts`
- **Deliverable**: si `ageMonths >= 10`, rankear alimentos con `isIronRich: true` primero; al menos 30% de la lista final son iron-rich
- **Tests** (4): bebé 11m con iron-rich rankeados primero, bebé 7m sin cambio, fallback si no hay iron-rich, ≥30% iron-rich
- **TDD**: test service

#### T-04-17: `getSuggestedFoods` test extendido

- **Files**: `apps/api/src/modules/dashboard/dashboard.service.test.ts`
- **Deliverable**: agregar tests de prioridad hierro
- **Tests**: 3-4
- **Depends on**: T-04-16

### Sub-bloque 4.7 (E2 — Snack Suggestions)

#### T-04-18: `getSnackSuggestions` en dashboard service

- **Spec**: REQ-6-B1
- **Files**: `apps/api/src/modules/dashboard/dashboard.service.ts`
- **Deliverable**:
  - Si `ageMonths < 10`: `{ available: false, reason: 'SNACKS_NOT_YET' }`
  - Si `ageMonths >= 10`: 5 alimentos apropiados (filtrar `warningTags: ['CHOKING_HAZARD_UNDER_5Y']`)
  - Si `ageMonths >= 12`: incluir galletas sin azúcar, pan suave
- **Tests** (5): bebé 8m, bebé 11m sin choking, bebé 14m con galletas, sin CHOKING en resultados, count de 5
- **TDD**: test service

#### T-04-19: `GET /api/dashboard/snack-suggestions` route

- **Spec**: REQ-6-B1
- **Files**: `apps/api/src/modules/dashboard/dashboard.routes.ts`
- **Deliverable**: ruta FREE con `requireTier('FREE')` (básicamente cualquier user autenticado)
- **Tests** (2): 200, 400 query invalida
- **TDD**: route test
- **Depends on**: T-04-18

#### T-04-20: `SnackSuggestionCard.vue` + integration

- **Spec**: REQ-6-B2, REQ-6-B3
- **Files**: `apps/web/src/modules/dashboard/components/SnackSuggestionCard.vue` (new)
- **Deliverable**:
  - Card con header "Ideas para la colación"
  - 5 sugerencias con icono, nombre, foodGroup
  - Click en "Ver detalle" abre `FoodSearchModal`
  - Hidden si bebé < 10m
- **Tests** (3): render con data, hidden <10m, click abre modal
- **TDD**: render + interaction
- **Depends on**: T-04-19

---

## Bloque 5 — Plate.stageFor + filter + export

### T-05-01: Add `PlateStage` enum to schema

- **Spec**: REQ-5-C1
- **Files**: `prisma/schema.prisma`
- **Deliverable**:

  ```prisma
  enum PlateStage {
    SIX_TO_NINE_MONTHS
    TEN_TO_TWELVE_MONTHS
    THIRTEEN_TO_TWENTY_THREE_MONTHS
    FAMILY_TABLE
  }
  ```

  - `model Plate` agregar `stageFor PlateStage?`
- **Tests**: regenerar Prisma client

### T-05-02: Create migration SQL

- **Spec**: REQ-5-C1
- **Files**: `prisma/migrations/XXXX_plate_stage_for/migration.sql` (new)
- **Deliverable**:

  ```sql
  CREATE TYPE "PlateStage" AS ENUM (...);
  ALTER TABLE "Plate" ADD COLUMN "stageFor" "PlateStage";
  ```

- **Tests**: aplicar migración, plates existentes con `stageFor = null`

### T-05-03: Mirror `PlateStage` in shared types

- **Spec**: REQ-5-C1
- **Files**: `packages/shared/src/types/plate.ts` (new)
- **Deliverable**:
  - `PLATE_STAGES` const array
  - `PlateStage` union type
  - `PLATE_STAGE_LABELS` Record
  - Update `Plate` interface para incluir `stageFor: PlateStage | null`
- **Tests** (2): tipos compilan, exports
- **Depends on**: T-05-01

### T-05-04: Zod schema para `stageFor` en POST /api/plates

- **Spec**: REQ-5-C2
- **Files**: `apps/api/src/modules/plates/plates.schemas.ts`
- **Deliverable**: `createPlateSchema.stageFor: z.enum(PLATE_STAGES).nullish()`
- **Tests** (3): acepta cada valor del enum, acepta null, rechaza valor inválido
- **TDD**: test Zod
- **Depends on**: T-05-03

### T-05-05: Filter en GET /api/plates por `stageFor`

- **Spec**: REQ-5-C3
- **Files**: `apps/api/src/modules/plates/plates.routes.ts`, `apps/api/src/modules/plates/plates.service.ts`
- **Deliverable**:
  - Query param `stageFor` en GET
  - Si se omite, retorna todos los plates del user (backward compat)
  - Si se especifica, filtra `where: { userId, stageFor }`
  - `stageFor=null` filtra los sin stage
- **Tests** (4): sin filter, con filter, con `null`, query invalida
- **TDD**: route test
- **Depends on**: T-05-04

### T-05-06: `PlateBuilderDrawer.vue` selector de `stageFor`

- **Spec**: REQ-5-C2
- **Files**: `apps/web/src/modules/plates/components/PlateBuilderDrawer.vue`
- **Deliverable**:
  - Selector opcional "Etapa objetivo" con 4 opciones + "Sin definir"
  - Al guardar, persiste `stageFor` en el plate
- **Tests** (2): default "Sin definir", selección persiste
- **TDD**: render + interaction
- **Depends on**: T-05-04

### T-05-07: Plate list filter por etapa + default

- **Spec**: REQ-5-C3, REQ-5-C4
- **Files**: `apps/web/src/modules/plates/...` (lugar del listado)
- **Deliverable**:
  - Filtro dropdown con 5 opciones (Todas, 6-9m, 10-12m, 13-23m, 24m+)
  - Default: sugerido por edad del bebé
  - "Sin definir" muestra plates con `stageFor = null`
- **Tests** (3): default sensato, filtro aplica, "Sin definir" funciona
- **TDD**: render + interaction
- **Depends on**: T-05-05

### T-05-08: Export PDF incluye `stageFor`

- **Spec**: REQ-5-D1
- **Files**: ruta de export de menú (probablemente en `apps/api/src/modules/menus/`)
- **Deliverable**: PDF header incluye "Menú semanal — [nombre] — [etapa]"
- **Tests** (1): PDF generado contiene la etapa
- **TDD**: integration test con PDF parse

---

## Definition of Done (criterios de cierre del change completo)

- [ ] Todos los tasks marcados como `- [x]` con links a commits
- [ ] `pnpm --filter shared test` verde
- [ ] `pnpm --filter api test` verde
- [ ] `pnpm --filter web test` verde
- [ ] `pnpm typecheck` verde (todos los paquetes)
- [ ] `pnpm lint` verde
- [ ] Las 2 migraciones aplicadas en dev con alimentos reales
- [ ] `prisma/seed.ts` ejecuta sin error y los 6 alimentos nuevos se insertan
- [ ] Manual QA: bebé de 11m en dashboard ve 4 slots + banner transición + allergen card PRO + texture guide split
- [ ] Manual QA: bebé de 8m en dashboard ve 3 slots + SIN banner (no hubo cruce)
- [ ] Manual QA: usuario FREE ve CTA en allergen card
- [ ] Manual QA: warning badge aparece en "Miel" en FoodSearch
- [ ] Manual QA: groupCount 5 con badge "Sugerido para 11 meses" en plate builder
- [ ] Manual QA: plate guardado con `stageFor = TEN_TO_TWELVE_MONTHS`, filtro lo encuentra
- [ ] Verificación clínica: 6 alimentos del Bloque 1 con `needsValidation: true` esperando nutriólogo
- [ ] Documento `docs/analysis-10-23-months.md` actualizado con el outcome final
- [ ] Engram: memory actualizada con lecciones aprendidas del change (PR review feedback, gotchas de implementación)

---

## TDD Cycle reminder

Para cada task de implementación, sigue RED → GREEN → TRIANGULATE → REFACTOR:

```
1. RED:    Escribir el test que falla. Commit: "test: add failing test for X"
2. GREEN:  Implementar el mínimo. Commit: "feat: implement X to pass test"
3. TRIANGULATE: Si la implementación es trivial, agregar 2-3 casos más. Commit: "test: triangulate X"
4. REFACTOR: Limpiar sin romper tests. Commit: "refactor: clean up X"
```

NO skip RED. NO commit implementation sin test que lo preceda. La excepción es UI integration visual (T-00-04, T-00-05, etc.) donde el test es de aceptación manual o snapshot.

---

## Out of scope reminder

Las siguientes features NO se implementan en este change (ver `proposal.md` §2 Out of scope):

- F2 (sal/condimentos) — SKIP
- DAIRY como 6° grupo — NO
- Tracking de agua consumida — NO
- Tracking de hierro consumido — NO
- Recetas de snacks — NO
- Tabla de alérgenos nueva — NO (se deriva siempre)
- Bloqueos de UI por warning — NO (AD-02)
- Stages de 24m+ (FAMILY_TABLE existe en enum pero sin UI)

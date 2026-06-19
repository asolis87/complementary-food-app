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
| PR-1.5 | 0.5 (diary integration regression rename) | (rename only) | ~0 (docs) | Low (4R reliability C1 follow-up) |
| PR-1.6 | 0.5b (web vitest harness + CI workflow + forbidOnly) | T-XX-WEB-TESTS-HARNESS | ~600 | Low (deps + config + CI + 2 smoke tests) |
| PR-1.7 | 0.5 (diary picker age-aware, real fix) | T-XX-DIARY-PICKER-AGE-AWARE | ~30 | Low |
| PR-1.8 | 0.5c (re-enable pre-existing broken web tests) | T-XX-WEB-TESTS-FIX | ~50-150 | Low (test realignment, no refactor) |
| PR-2 | 0 (UI complementaria) | T-00-02, T-00-07, T-00-08, T-00-09, T-00-10, T-00-11, T-00-12 | ~310 | Low |
| PR-3 | 1 (seed) | T-01-01, T-01-02, T-01-03 | ~90 | Low (validación nutriólogo) |
| PR-4 | 2 + 4-D2 (allergens) | T-02-01..05, T-04-01..04 | ~370 | Medium (PRO gate) |
| PR-5 | 3 + 4-B3 (warnings) | T-03-01..05, T-04-11..15 | ~210 | Low (informativo) |
| PR-6 | 4-C1+C2 + 5 (plate) | T-00-03, T-04-05..10, T-05-01..08 | ~390 | Medium (migration) |
| PR-7 | 4-E1+E2 (suggestions) | T-04-16..20 | ~180 | Low |

**Total**: 10 PRs (PR-1 → PR-1.5 → PR-1.6 → PR-1.7 → PR-1.8 → PR-2 → ... → PR-7), ~1970 LOC. Si al apply se observa que algún PR excede 400 líneas netas, se subdivide (estrategia auto-forecast).

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
- **Depends on**: T-00-01 (getMealSlotsForAge), T-00-04 (dashboard consumer)
- **Blocker for**: nothing (it's a regression that was always there; PR-1 just made it more visible by changing the slot shape). Lands as **PR-1.7** after the harness lands (PR-1.6) so the integration test can run in CI.

### T-XX-WEB-TESTS-HARNESS: Set up vitest harness for `apps/web` (NEW, PR-1.6)

- **Why**: `apps/web` had no vitest setup. Adding one is a strict prerequisite for the T-XX-DIARY-PICKER-AGE-AWARE integration test (PR-1.7) and any future web component test.
- **Scope**:
  - Add `vitest@^2.1`, `@vue/test-utils@^2.4`, `happy-dom@^15` to `apps/web` devDependencies.
  - `apps/web/vitest.config.ts` (new) extends `vite.config.ts` with `test: { environment: 'happy-dom', globals: false }` and excludes pre-existing broken tests.
  - `apps/web/env.d.ts` adds `declare module '*.vue'` ambient declaration (vite/client does not ship one in this setup).
  - Scripts in `apps/web/package.json`: `test`, `test:run`, `test:watch`.
  - Two smoke tests under `apps/web/src/__tests__/`: `harness.test.ts` (sanity) and `AppButton.test.ts` (component mount + props + emit + loading + disabled).
- **Tests**: harness.test.ts (1) + AppButton.test.ts (6) = 7/7 passing.
- **Depends on**: nothing.
- **Blocker for**: T-XX-DIARY-PICKER-AGE-AWARE (PR-1.7) integration test, and any future web test additions.

### T-XX-WEB-TESTS-FIX: Fix pre-existing broken tests in `apps/web` (NEW, follow-up)

- **Why**: PR-1.6's vitest harness discovered 9 pre-existing test files (50 tests) that were already broken before the harness existed — they were not typecheked or executed in CI. PR-1.6 excludes them so the harness can ship clean. They are tracked here for a follow-up PR.
- **Scope** (all under `apps/web/src/`):
  - `modules/dashboard/components/AllergenAlertsCard.test.ts`
  - `modules/dashboard/components/DashboardErrorBoundary.test.ts`
  - `modules/dashboard/components/DashboardHeader.test.ts`
  - `modules/dashboard/components/DashboardSkeleton.test.ts`
  - `modules/menus/MenuWeekPage.test.ts`
  - `modules/menus/components/MenuExportFrame.test.ts`
  - `shared/stores/authStore.email.test.ts`
  - `shared/stores/dashboardStore.test.ts`
  - `shared/stores/menuStore.test.ts`
- **Symptoms observed (representative)**: `MenuExportFrame` overflow-badge and dot rendering expectations mismatch the current template (expects 2/3 dots, gets 0); likely template drift since the tests were written. Other files need audit.
- **Approach**: open the broken files, re-read the SFC they target, update the test expectations to match current contract. NOT a refactor — just realign tests to actual behavior, then re-enable them in `vitest.config.ts` `exclude` list.
- **Estimated scope**: ~50-150 LOC of test updates across 9 files, plus the `exclude` list removal. Fits a single PR well under the 400-LOC budget.
- **Schedule**: **PR-1.8** (see PR Forecast table above). Lands after PR-1.7 once the diary picker integration test is in CI, so we have a known-good signal that the harness still works.

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

## Bloque 1 — Seed audit 10-23m

### T-01-01: Agregar 6 alimentos al seed con `needsValidation: true`

- **Spec**: REQ-2-A1
- **Files**: `prisma/seed.ts`
- **Deliverable**: 6 nuevos alimentos:
  - Yogur natural (sin azúcar), `ageMonths: 10`, `foodGroup: PROTEIN`, `isAllergen: true`, `allergenType: 'MILK'`
  - Queso fresco, `ageMonths: 10`, `foodGroup: PROTEIN`, `isAllergen: true`, `allergenType: 'MILK'`
  - Frijol negro cocido, `ageMonths: 10`, `foodGroup: PROTEIN`, `isIronRich: true`
  - Lenteja cocida, `ageMonths: 10`, `foodGroup: PROTEIN`, `isIronRich: true`
  - Garbanzo cocido, `ageMonths: 12`, `foodGroup: PROTEIN`, `warningTags: ['CHOKING_HAZARD_UNDER_5Y']` (si entero)
  - Hígado de pollo cocido, `ageMonths: 10`, `foodGroup: PROTEIN`, `isIronRich: true`
- **Tests** (2): nombres únicos (constraint), todos con `needsValidation: true`
- **TDD**: integration test que ejecuta seed y verifica filas

### T-01-02: Audit section en seed.ts

- **Spec**: REQ-2-B1
- **Files**: `prisma/seed.ts`
- **Deliverable**:
  - Sección `// 10-23M AUDIT FIXES` con comentarios por cada cambio
  - Backfill de `ageMonths` para alimentos mal categorizados (lista inicial: aguacate, mango, plátano)
- **Tests** (1): cada alimento en audit section tiene comentario explicativo
- **TDD**: integration test que verifica que las filas actualizadas quedan con `ageMonths` correcto

### T-01-03: Seed integrity test

- **Spec**: REQ-2-A1
- **Files**: `apps/api/test/seed-integrity.test.ts` (new)
- **Deliverable**: test que ejecuta el seed y verifica:
  - 6 nuevos alimentos insertados
  - Todos con `needsValidation: true`
  - Alimentos con `isAllergen: true` tienen `allergenType` no-null
  - Alimentos con `isIronRich: true` están en seed (≥3)
- **Tests**: 1-2 integration tests
- **TDD**: test primero, seed ajustarse al test

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

## Bloque 3 — Schema migration (WarningTag)

### T-03-01: Add `WarningTag` enum to schema

- **Spec**: REQ-4-A1
- **Files**: `prisma/schema.prisma`
- **Deliverable**:

  ```prisma
  enum WarningTag {
    PROHIBITED_UNDER_24M
    CHOKING_HAZARD_UNDER_5Y
    PROHIBITED_PEDIATRIC
    REQUIRES_PREPARATION
  }
  ```

  - `model Food` agregar `warningTags WarningTag[] @default([])`
- **Tests**: regenerar Prisma client, verificar tipos

### T-03-02: Create migration SQL

- **Spec**: REQ-4-A1
- **Files**: `prisma/migrations/XXXX_warning_tags/migration.sql` (new)
- **Deliverable**:

  ```sql
  CREATE TYPE "WarningTag" AS ENUM (...);
  ALTER TABLE "Food" ADD COLUMN "warningTags" "WarningTag"[] NOT NULL DEFAULT '{}';
  ```

- **Tests**: aplicar migración en test DB, verificar que alimentos existentes tienen `warningTags = []`

### T-03-03: Mirror enum in shared types

- **Spec**: REQ-4-A1
- **Files**: `packages/shared/src/types/food.ts`
- **Deliverable**:
  - `WARNING_TAGS` const array
  - `WarningTag` union type
  - Update `Food` interface para incluir `warningTags: readonly WarningTag[]`
- **Tests** (2): tipos compilan, export del index
- **Depends on**: T-03-01

### T-03-04: Backfill `warningTags` en seed

- **Spec**: REQ-4-A2
- **Files**: `prisma/seed.ts`
- **Deliverable**:
  - Sección `// WARNING TAGS BACKFILL` con backfill de los alimentos relevantes
  - Ejemplos: Leche vaca entera → `[PROHIBITED_UNDER_24M]`, Miel → `[PROHIBITED_UNDER_24M]`, Uvas → `[CHOKING_HAZARD_UNDER_5Y]`, Maní → `[CHOKING_HAZARD_UNDER_5Y]`
- **Tests** (2): alimentos con tag correcto, alimentos sin tag mantienen `[]`
- **TDD**: integration test verifica backfill
- **Depends on**: T-03-02

### T-03-05: Migration non-destructive test

- **Spec**: REQ-4-A1
- **Files**: `apps/api/test/migrations.test.ts` (new) o similar
- **Deliverable**: test que aplica la migración sobre una DB con alimentos pre-existentes, verifica que ningún alimento se pierde y que `warningTags = []` por default
- **Tests**: 1-2
- **TDD**: test primero
- **Depends on**: T-03-02

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

#### T-04-11: Warning badge en `FoodSearchPage.vue`

- **Spec**: REQ-4-B1
- **Files**: `apps/web/src/modules/foods/FoodSearchPage.vue`
- **Deliverable**:
  - Icono ⚠️ rojo en card de alimento con `warningTags.length > 0`
  - Tooltip con descripción del riesgo (no solo código)
  - Tooltip incluye "Si tenés dudas, consultá a tu pediatra"
- **Tests** (2): render con tag, render sin tag
- **TDD**: render
- **Depends on**: T-03-04 (seed backfill), T-03-03 (types)

#### T-04-12: Warning panel en `FoodSearchModal.vue`

- **Spec**: REQ-4-B2
- **Files**: `apps/web/src/modules/foods/FoodSearchModal.vue`
- **Deliverable**:
  - Panel rojo debajo del detalle con lista de riesgos
  - Tooltip mentions "consultá a tu pediatra"
  - Alimento sigue siendo agregable (no bloquea, AD-02)
- **Tests** (3): render con panel, agregar sin error, copy de tooltip
- **TDD**: render + interaction
- **Depends on**: T-04-11

#### T-04-13: Warning badges en `MenuWeekPage.vue`

- **Spec**: REQ-4-C1
- **Files**: `apps/web/src/modules/menus/MenuWeekPage.vue`
- **Deliverable**: badge ⚠️ en slot con alimento con `warningTags`
- **Tests** (1): render con slot con tag
- **TDD**: render
- **Depends on**: T-04-11

#### T-04-14: Warning badges en `PlateBuilderDrawer.vue`

- **Spec**: REQ-4-C2
- **Files**: `apps/web/src/modules/plates/components/PlateBuilderDrawer.vue`
- **Deliverable**: badge ⚠️ en slot del plate con alimento con `warningTags`
- **Tests** (1): render con slot con tag
- **TDD**: render
- **Depends on**: T-04-11

#### T-04-15: Cross-component "consultá a tu pediatra" copy

- **Spec**: REQ-4-B3
- **Files**: componentes con warning
- **Deliverable**: copy consistente en todos los tooltips
- **Tests**: snapshot del copy
- **TDD**: no aplica (copy review)

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

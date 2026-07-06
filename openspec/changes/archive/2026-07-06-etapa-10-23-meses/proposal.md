# Etapa 10–23 meses — Proposal (PRD)

**Change**: etapa-10-23-meses
**Status**: proposal
**Date**: 2026-06-18

---

## 1. Intent

Cerrar el gap funcional entre lo que Pakulab ofrece hoy (optimizado para 6–9m) y la realidad clínica de un bebé de 10–23 meses. Esto incluye: age-aware meal slots (1 colación a 10–12m, 2 a 13–23m), plate builder sugerido por edad (5–6 grupos), warnings de alimentos prohibidos (<24m) y de atragantamiento (<5y), allergen tracker desestubado (PRO), suggestions de hierro y snacks, y educación contextual (texturas, alimentación perceptiva, tips por etapa).

### Why now

- **Clínico**: la ventana de introducción de alérgenos cierra alrededor de los 10–12 meses. Sin un tracker funcional, Pakulab no acompaña al padre en el momento crítico. Después de los 12m es significativamente más difícil introducir alérgenos.
- **Producto**: el 100% de los bebés registrados en Pakulab que ya cruzaron 9m están viendo UX incorrecta (3 comidas en lugar de 3+1 o 3+2 según edad). Cuanto más tardemos, más papás frustra la app.
- **Conversión**: el allergen tracker con 8 alérgenos pendientes al cruzar 10m es la palanca de conversión a PRO más fuerte del producto (más que menú semanal, que ya entra a los 6m).
- **Foundation lista**: MealType.SNACK_1/SNACK_2 ya existen en Prisma, PlateItem.servingAmount ya existe en schema, useFoodExposure ya está implementado, ALLERGEN_AGE_THRESHOLDS ya están curados. La mayoría del scope es UI/business logic, no infraestructura nueva.

### Why this scope is well-bounded

El análisis en `docs/analysis-10-23-months.md` ya mapeó 17 gaps. La ejecución está organizada en 6 bloques por desbloqueo (sección 4), donde cada paso deja el siguiente sin dependencia pendiente. F2 (sal/condimentos) se skipea explícitamente por no estar ni en el PDF ni en el codebase.

---

## 2. Scope

### In scope

| Bloque | Entregable | Tipo |
|--------|-----------|------|
| **0** | UI age-aware: dashboard slots, menu snacks, texture guide split, STAGE_TIPS, perceptive feeding card, agua reminder | UI + content |
| **1** | Seed: yogur natural, queso fresco, frijol, lenteja, garbanzo, hígado de pollo (con `needsValidation: true`) | Data |
| **2** | Backend derivado: `allergens.service.ts` + ruta `GET /api/allergens/status` derivando de `FoodLog` + `Food.isAllergen` (sin tabla nueva) | API |
| **3** | Schema migration: enum `WarningTag` + array `Food.warningTags` | DB |
| **4** | Features: C2 (porción), B3 (warnings UI), C1 (groupCount sugerido), D2 (allergen card), D3 (exposure reminder), E1 (hierro priority), E2 (snack suggestions) | UI + API |
| **5** | Polish: C3 (Plate.stageFor enum + filtro), F3 (export con etapa). F2 SKIP. | DB + UI |

### Out of scope

- **F2 (sal/condimentos)**: no modelado en codebase ni en PDF. Agregar crea un alcance nuevo que diluye el foco.
- **Re-arquitectura del plate builder**: la decisión de 4/5/6 grupos sigue siendo del padre (AD-02). Solo agregamos sugerencia automática.
- **ML para balance A/L**: sigue siendo función pura determinista (AD-04).
- **Cambios a Stripe/billing**: el allergen tracker entra como PRO feature, pero no se renegocia el flujo de pagos.
- **Otras etapas** (24m+, 4-6m para prematuros): changes futuros separados.
- **Refactor de la advertencia del pediatrician** (la app NO prescribe): la copy existente se mantiene. No agregamos disclaimers nuevos.

### Tier impact

| Feature | Tier | Rationale |
|---------|------|-----------|
| Age-aware meal slots (dashboard, menu) | FREE | Mejora UX core, no es palanca de conversión |
| Texture guide split + STAGE_TIPS + perceptive feeding card | FREE | Educación clínica, parte del valor base |
| Water reminder en AddMealModal | FREE | Educativo, sin upside de paywall |
| Seed audit (alimentos 10-23m) | FREE | Catálogo público, no afecta tier |
| Allergen tracker (status, card, exposure reminder) | **PRO** | **Palanca de conversión a PRO al cruzar 10m** |
| Warnings UI (alimentos prohibidos <24m, choking <5y) | FREE | Seguridad clínica no debe ser paywalled |
| Plate builder age-aware (groupCount sugerido) | FREE | UX core |
| Serving amount UI | FREE | UX core, valor educativo |
| Plate.stageFor + filtro al reusar | FREE | Organización del usuario |
| Sugerencias de hierro (10-23m) | FREE | Educación clínica |
| Snack suggestions (10-23m) | FREE | UX core, no palanca de conversión |

---

## 3. Approach

### 3.1 Execution order (bloques por desbloqueo)

```
Día 1     ──► Bloque 0 — UI pura, sin schema ni data
Día 2     ──► Bloque 1 — Seed 10-23m
Día 3     ──► Bloque 2 — Backend derivado (allergens)
Día 4     ──► Bloque 3 — Schema migration (WarningTag)
Días 5-8  ──► Bloque 4 — Features: C2 → B3 → C1 → D2 → D3 → E1 → E2
Días 9-10 ──► Bloque 5 — Polish (C3, F3; F2 SKIP)
```

Justificación detallada en `docs/analysis-10-23-months.md` sección 4.

### 3.2 Schema migrations (2 total)

**Migración 1 — WarningTag (Bloque 3)**

```prisma
enum WarningTag {
  PROHIBITED_UNDER_24M
  CHOKING_HAZARD_UNDER_5Y
  PROHIBITED_PEDIATRIC
  REQUIRES_PREPARATION
}
model Food {
  ...
  warningTags WarningTag[] @default([])
}
```

Additive. Default `[]` para que los 102 alimentos existentes no requieran backfill inmediato. El Bloque 1 y el PR de Bloque 4 (B3) hacen backfill selectivo.

**Migración 2 — Plate.stageFor (Bloque 5)**

```prisma
enum PlateStage {
  SIX_TO_NINE_MONTHS
  TEN_TO_TWELVE_MONTHS
  THIRTEEN_TO_TWENTY_THREE_MONTHS
  FAMILY_TABLE
}
model Plate {
  ...
  stageFor PlateStage?
}
```

Additive y opcional. Default `null` = etapa desconocida (plate viejo). El PlateBuilderDrawer permite asignar al guardar.

### 3.3 Stage transition UX (cutover suave con banner)

Cuando el bebé cruza 9m o 12m, el dashboard detecta la transición y muestra un **banner descartable**:

> 🎉 Tu bebé entró a la **nueva etapa** (10 meses). Ahora tiene **desayuno + comida + cena + 1 colación** al día. Te recomendamos revisar la guía de texturas para esta edad.

Con dos CTAs:

- **"Ver guía de texturas"** → expande TextureGuideCard
- **"No mostrar de nuevo"** → guarda flag en perfil o localStorage

El banner es visible UNA vez por cruce de etapa. Usa `localStorage` (no requiere schema).

### 3.4 Allergen tracker (PRO, derivado de FoodLog)

No se crea tabla nueva. Se deriva el estado de cada alérgeno de:

- `FoodLog` del bebé × `Food.isAllergen = true` × `Food.allergenType`
- `Food.allergenType` cruza con `ALLERGEN_AGE_THRESHOLDS` para saber si ya se introdujo
- `ReactionType.REJECTED` no cuenta como "introducido" (el bebé lo rechazó, no lo toleró)
- `babyAgeMonths` vs `CLOSING_WINDOW_AGE_MONTHS = 10` define urgency

Endpoint nuevo:

- `GET /api/allergens/status?babyProfileId=X` (PRO) → devuelve `{ introduced: AllergenAlert[], pending: AllergenAlert[], urgency: 'normal' | 'closing_window' }`

### 3.5 Warnings UI (informativas, no bloqueantes)

Las warnings son **informativas** (badge rojo + tooltip). El padre puede override-arlas porque AD-02 dice que la decisión es del padre. La copy del tooltip siempre incluye "consultá a tu pediatra".

### 3.6 Serving amount

`PlateItem.servingAmount` ya existe (`String?`). La UI agrega un selector "1 cda / 2 cdas / 3 cdas / 4 cdas" en `PlateContents`. Default sugerido: 1 cda. No requiere schema.

### 3.7 Age-aware slots — fuente única

Se introduce `getMealSlotsForAge(months: number): MealSlotDef[]` en `packages/shared/src/constants/dashboard.ts`. Es la **única** fuente de verdad. Todos los consumidores (DashboardPage, MenuWeekPage, TodayLogsCard, DiaryPage timeline) la usan.

```ts
function getMealSlotsForAge(months: number): MealSlotDef[] {
  if (months < 10) return [BREAKFAST, LUNCH, DINNER]
  if (months < 13) return [BREAKFAST, LUNCH, DINNER, SNACK_1]
  return [BREAKFAST, SNACK_1, LUNCH, SNACK_2, DINNER]
}
```

(Orden cronológico del día, no alfabético. SNACK_1 va después de BREAKFAST porque es la colación de media mañana.)

### 3.8 Plate groupCount suggestion

`PlateBuilderDrawer` agrega un selector de groupCount con badge "Sugerido para 10 meses":

| Edad | Sugerido | Opciones manuales |
|------|----------|-------------------|
| 6–9m | 4 grupos | 4 / 5 |
| 10–23m | 5 grupos | 4 / 5 |
| 13–23m | 5 grupos (con opción 6) | 4 / 5 / 6 |

6 grupos = 4 base + HEALTHY_FAT + DAIRY (lácteos). Esto requiere:

- Agregar `DAIRY` al enum `FoodGroup` (migración)
- Considerar lácteos como su propio grupo (la guía dice yogur/queso fresco van en Proteínas, pero el plato familiar se beneficia de slot propio para tracking)

**Decisión abierta**: ¿Lácteos como 6° grupo o se mantiene dentro de Proteínas? (se cierra en spec)

### 3.9 Stage tips rotation

Patrón idéntico a `BALANCE_TIPS` (ya implementado):

```ts
export const STAGE_TIPS: Record<AgeStage, readonly string[]> = {
  SIX_TO_NINE_MONTHS: [...],
  TEN_TO_TWELVE_MONTHS: [...],
  THIRTEEN_TO_TWENTY_THREE_MONTHS: [...],
}
```

`useStageTip(ageMonths)` devuelve uno aleatorio del rango. Se muestra en el dashboard en una card dedicada o en el header.

### 3.10 Perceptive feeding card

Card fija en dashboard con header colapsable. Expone los 5 principios OMS con copy contextual a 10–23m. No es modal. Accesible siempre. La card es densa en info pero el header muestra solo el icono y título.

---

## 4. Affected Modules

### Backend (`apps/api`)

| File | Change | Bloque |
|------|--------|--------|
| `src/modules/allergens/allergens.service.ts` (new) | `getAllergenStatus()` derivando de `FoodLog` + `Food` | 2 |
| `src/modules/allergens/allergens.routes.ts` | Agregar `GET /api/allergens/status` | 2 |
| `src/modules/allergens/allergens.service.test.ts` (new) | Tests de derivación | 2 |

### Backend dashboard service (`apps/api/src/modules/dashboard`)

| File | Change | Bloque |
|------|--------|--------|
| `dashboard.service.ts` | `getSuggestedFoods` prioriza hierro si `ageMonths >= 10` | 4 |
| `dashboard.service.ts` | Nuevo `getSnackSuggestions(ageMonths)` | 4 |
| `dashboard.service.ts` | `getDashboardData` computa `ageStage` para que la UI sepa si mostrar banner | 0 |
| `dashboard.routes.ts` | Nuevo `GET /api/dashboard/snack-suggestions` | 4 |

### Shared (`packages/shared/src`)

| File | Change | Bloque |
|------|--------|--------|
| `constants/dashboard.ts` | `getMealSlotsForAge()`, `STAGE_TIPS` por etapa, snack slots config | 0 |
| `constants/food-groups.ts` | (opcional) `DAIRY` group + dual-group logic para yogur/queso | 4 |
| `types/food.ts` | Tipo `AgeStage`, `WarningTag` enum mirror, `PlateStage` mirror | 0, 3, 5 |
| `types/dashboard.ts` | `SnackSuggestion` type | 4 |

### Frontend (`apps/web`)

| File | Change | Bloque |
|------|--------|--------|
| `modules/dashboard/DashboardPage.vue` | Usar `getMealSlotsForAge`, integrar banner de transición, integrar cards nuevas | 0, 4 |
| `modules/dashboard/components/TextureGuideCard.vue` | Split 12+m en 12-17m y 18-23m | 0 |
| `modules/dashboard/components/StageTransitionBanner.vue` (new) | Banner descartable de cruce de etapa | 0 |
| `modules/dashboard/components/AllergenTrackerCard.vue` (new) | Card de alérgenos PRO | 4 |
| `modules/dashboard/components/SnackSuggestionCard.vue` (new) | Sugerencias de colación | 4 |
| `modules/dashboard/components/PerceptiveFeedingCard.vue` (new) | 5 principios OMS | 0 |
| `modules/menus/MenuWeekPage.vue` | `MEALS` array age-aware con snack1/snack2 | 0 |
| `modules/plates/components/PlateVisualization.vue` | Serving amount indicator (X/4 cdas) | 4 |
| `modules/plates/components/PlateBuilderDrawer.vue` | Selector de groupCount age-aware, selector de stageFor | 4, 5 |
| `modules/plates/components/PlateContents.vue` | Selector de porción por slot | 4 |
| `modules/foods/FoodSearchPage.vue` | Badge de warning tag (rojo) | 4 |
| `modules/foods/FoodSearchModal.vue` | Badge de warning tag, badge de exposure count | 4 |
| `modules/diary/DiaryPage.vue` | Timeline order usa `getMealSlotsForAge` | 0 |
| `modules/diary/components/AddMealModal.vue` | Recordatorio de agua | 0 |
| `shared/composables/useStageTransition.ts` (new) | Detecta cruce de etapa, gestiona flag de "no mostrar" en localStorage | 0 |
| `shared/composables/useDashboardTips.ts` | Extender con `useStageTips(ageMonths)` | 0 |

### Database (`prisma/`)

| File | Change | Bloque |
|------|--------|--------|
| `schema.prisma` | `enum WarningTag`, `Food.warningTags`, `enum PlateStage`, `Plate.stageFor`, `enum FoodGroup.DAIRY` | 3, 4, 5 |
| `migrations/XXXX_warning_tags/migration.sql` (new) | Migración additiva | 3 |
| `migrations/XXXX_plate_stage/migration.sql` (new) | Migración additiva | 5 |
| `migrations/XXXX_dairy_group/migration.sql` (new) | Migración additiva (solo si se decide 6 grupos) | 4 |
| `seed.ts` | Agregar yogur, queso fresco, frijol, lenteja, garbanzo, hígado + backfill de warning tags | 1, 4 |

### Tests nuevos (estimado 28-31)

| Bloque | Tests | Tipo |
|--------|-------|------|
| 0 | 5-6 | Pure logic (getMealSlotsForAge, useStageTransition, STAGE_TIPS) |
| 1 | 2-3 | Seed integrity (foods con ageMonths correcto, needsValidation) |
| 2 | 4-5 | getAllergenStatus derivación, edge cases (REJECTED no cuenta, age gating) |
| 3 | 2 | Schema migration reversibility, default empty array |
| 4 | 12-14 | groupCount suggestion, warnings badge, allergen card, exposure badge, snack suggestions, serving amount |
| 5 | 3 | Plate.stageFor filter, export con etapa |

---

## 5. Rollback Plan

### Por bloque

| Bloque | Reversibilidad | Notas |
|--------|---------------|-------|
| 0 | Trivial (revert commit, no data) | UI pura, sin schema, sin data |
| 1 | Revertible (delete seed rows) | `db:seed --reset` o quitar las filas nuevas |
| 2 | Revertible (revert PR) | Sin migración, solo código |
| 3 | `prisma migrate resolve --rolled-back` | Additive: agregar la columna y revertir la columna no rompe data existente |
| 4 | Revertible (revert PR) | Asume que 0-3 están ya deployed |
| 5 | `prisma migrate resolve --rolled-back` para Plate.stageFor | Additive. Los plates existentes quedan con `stageFor = null` |

### Plan general de rollback

1. **Por PR (auto-forecast decide el shape)**: cada PR es revertible individualmente sin breaking changes cross-PR.
2. **Por change completo**: revertir la cadena de PRs. Las 2 migraciones son additive, no requieren backfill.
3. **Feature flag de emergencia**: el banner de transición y el allergen tracker se pueden feature-flag con `VITE_FF_ALLERGEN_TRACKER` y `VITE_FF_STAGE_TRANSITION` si se necesita apagar sin deploy.

### Data loss

**Cero data loss garantizado**:

- WarningTag es array opcional con default `[]` — alimentos existentes siguen funcionando
- Plate.stageFor es opcional con default `null` — plates existentes siguen funcionando
- `getAllergenStatus` se calcula on-demand — no se persiste nada del estado de alérgenos
- Seed additions son additive — no modifican alimentos existentes

---

## 6. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Validación clínica no completada** antes de deploy de Bloque 1 | HIGH | Todos los alimentos nuevos con `needsValidation: true`. Bloque 4.2 (B3) NO muestra warning UI hasta que el nutriólogo valide los 18+ alimentos. |
| **6° grupo DAIRY contradice la guía** (que dice yogur/queso en Proteínas) | MEDIUM | Decisión abierta en spec. Si se rechaza DAIRY, Bloque 4 se reduce a 5 grupos solamente y el Plate sigue funcionando. |
| **Banner de cutover es intrusivo** | MEDIUM | Banner descartable con "no mostrar de nuevo". Aparece UNA vez por cruce. localStorage flag. |
| **Auto-forecast parte en 5-7 PRs cuando el budget es 400 líneas** | LOW | Cada bloque cabe en 1 PR salvo Bloque 4 que se parte. La sub-división 4.1-4.7 ya está planeada. |
| **Alergens tracker expone data clínica sensible** (alergia del bebé) | MEDIUM | Auth PRO. Rate limit. No se loggean alergenos en claro en monitoring. HIPAA-like treatment. |
| **Serving amount UI genera ansiedad** ("¿es muy poco?") | LOW | Default 1 cda. Tooltip explica progresión 1→4 cdas. Copy de la guía original. |
| **Cutover abrupto para bebés que cruzan 9m durante el deploy** | LOW | La edad se computa en runtime (`ageInMonths(birthDate)`). El dashboard refleja la etapa correcta al primer load post-deploy. No hay migración de data. |
| **Stage tips en español/regional** | LOW | Curar con copy validada por el equipo clínico. Patrón BALANCE_TIPS ya funciona. |
| **Perceptive feeding card ocupa mucho espacio en mobile** | LOW | Card colapsable. Header muestra solo icono + título. Body se expande on-demand. |
| **Inconsistencia entre dashboard slots y menu slots** | LOW | Ambos consumen `getMealSlotsForAge()` del shared. Una sola fuente de verdad. |

---

## 7. Open Questions (se cierran en spec o design)

1. **¿Lácteos como 6° grupo (DAIRY) o se mantienen en Proteínas como dice la guía?** — Cerrar en spec.
2. **¿Cuál es la copy exacta del banner de cutover?** — Copy draft en Bloque 0 task; puede ajustarse post-nutriólogo.
3. **¿Plate.stageFor acepta valores libres o enum fijo?** — Decisión preliminar: enum `PlateStage`. Confirmar en design.
4. **¿Las warnings de alimentos prohibidos son bloqueantes o solo informativas?** — Cerrar en spec: **informativas, overrideable**.
5. **¿El banner de cutover usa localStorage o persiste en perfil del bebé?** — Decisión preliminar: localStorage (no requiere migración). Confirmar en design.

---

## 8. Success Metrics (revisar con métricas reales)

- **% de bebés 10-23m con ≥1 colación registrada por día**: meta ≥60% en el primer mes post-launch
- **% de alérgenos introducidos antes de los 12m**: meta mantener ≥80% (baseline actual estimado 40-60%)
- **Reducción de tickets "¿por qué no veo mis snacks?"**: meta -90%
- **Conversión a PRO al cruzar 10m**: meta +15% lift (a medir vs. baseline)
- **Tiempo de armado de plato**: meta -20% (sugerencia automática reduce decisiones)

---

## 9. Next Step

Pasar a **spec.md** (Given/When/Then scenarios para cada requirement). Cuando esté listo, pauso para revisión.

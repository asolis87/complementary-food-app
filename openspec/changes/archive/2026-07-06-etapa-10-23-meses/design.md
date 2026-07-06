# Design: etapa-10-23-meses

> **Why**: ver `proposal.md` y `specs/`. Este documento captura las decisiones arquitectónicas, contratos de endpoints, ubicación de funciones puras, shape de tipos nuevos, y estrategia de migración. Es la base para `tasks.md` (implementación) y `verify-report.md` (verificación).
>
> **Scope**: este change NO renegocia el patrón de autenticación (BetterAuth + cookie session), el motor de plato (función pura determinista), ni la estructura de la monorepo. Solo agrega capacidades nuevas.

---

## 1. Decisiones arquitectónicas

### AD-01: `getMealSlotsForAge` vive en `packages/shared/src/constants/dashboard.ts`

**Por qué ahí**: lo consumen el backend (`dashboard.service.ts` para filtrar sugerencias por `mealType`, `allergens.service.ts` para saber qué slots aplican) y el frontend (`DashboardPage`, `MenuWeekPage`, `DiaryPage`, `TextureGuideCard`, `AllergenTrackerCard`, `SnackSuggestionCard`). `packages/shared` es la única dependencia que ambos targets pueden importar. Mantener la función en el shared package garantiza type-safety end-to-end.

**Por qué una función pura**: la edad es input, los slots son output. No hay side effects, no hay acceso a DB, no hay estado. Es trivial de testear y razonar.

**Tipo de retorno**: array de `MealSlotDef` (interface ya existente en `dashboard.ts`). Se reemplaza la constante `DASHBOARD_MEAL_SLOTS` por un getter que invoca la función con la edad actual.

```ts
// packages/shared/src/constants/dashboard.ts
export type AgeStage =
  | 'SIX_TO_NINE_MONTHS'
  | 'TEN_TO_TWELVE_MONTHS'
  | 'THIRTEEN_TO_SEVENTEEN_MONTHS'
  | 'EIGHTEEN_TO_TWENTY_THREE_MONTHS'

export function getMealSlotsForAge(months: number): readonly MealSlotDef[] {
  if (months < 10) return DASHBOARD_MEAL_SLOTS_BREAKFAST_LUNCH_DINNER
  if (months < 13) return DASHBOARD_MEAL_SLOTS_WITH_SNACK_1
  return DASHBOARD_MEAL_SLOTS_WITH_SNACK_1_AND_2
}
```

**Breaking change internal**: `DASHBOARD_MEAL_SLOTS` se deprecará. La constante actual (con `SNACK` legacy) se mantiene como `LEGACY_MEAL_SLOTS` para backward compat en `today` endpoint que pueda depender de ella, pero el dashboard la reemplaza.

### AD-02: Allergen tracker se DERIVA de `FoodLog`, no se persiste

**Por qué derivar**: la fuente de verdad es el diario de comidas. Si guardamos un estado de alérgenos, hay que mantenerlo en sync con cada `FoodLog` create/update/delete. Derivar elimina ese problema. Costo computacional: una query a `FoodLog` con `where: { babyProfileId, food: { isAllergen: true } }` + agregación en memoria. Para un bebé con <1000 FoodLogs en su ventana, es sub-milisegundo.

**Por qué no una vista materializada**: la cache layer (TTL 1h) ya existe en `DASHBOARD_CACHE_TTL.allergens = 60 * 60`. Suficiente.

**Función pura aislable**:

```ts
// apps/api/src/modules/allergens/allergens.service.ts
export function computeAllergenStatus(args: {
  foodLogs: FoodLogWithFood[]
  ageMonths: number
  allAllergenTypes: AllergenType[]
  closingWindowAgeMonths: number // from shared
}): AllergenStatusResponse {
  // 1. For each allergen type, filter logs of that type
  // 2. Count exposures (exclude REJECTED)
  // 3. Determine status: introduced | pending | in_window
  // 4. Return sorted array
}
```

Testeable en aislamiento, sin tocar Fastify ni Prisma.

### AD-03: `PlateStage` es enum Prisma, no string libre

**Por qué enum**: los valores son curados y finitos. Un string libre abre la puerta a typos (`'TEN_TO_TWELVE'` vs `'10_12'`). Un enum Prisma garantiza type-safety en DB y en TypeScript. Si en el futuro se necesita una nueva etapa, requiere migración explícita — eso es deseable (fuerza una decisión consciente).

**Por qué opcional (`Plate.stageFor?`)**: plates existentes no tienen etapa asignada. Forzar default rompería UX para padres que ya tienen plates guardados. El padre puede etiquetar manualmente; el filtro tiene la opción "Sin definir" explícita.

### AD-04: `WarningTag` es UN solo enum, no enums separados por concern

**Por qué un solo enum**: cada alimento puede tener múltiples tags (e.g. "Pasta espesa" → `[CHOKING_HAZARD_UNDER_5Y, REQUIRES_PREPARATION]`). Un solo array `WarningTag[]` cubre esto naturalmente. Separar en enums (`chokingTags`, `prohibitedTags`) sería modelado redundante.

**Por qué array en Prisma** (no join table): los tags son pocos (4), inmutables, y no necesitan queries complejas (no se busca "alimentos sin tag X", se filtra en memoria). Postgres soporta arrays nativos y Prisma los modela directo. Si en el futuro se necesitan queries tipo `WHERE NOT ('PROHIBITED_UNDER_24M' = ANY(warningTags))`, el operador `@>` y `<@` de Postgres lo cubren.

### AD-05: Banner dismissal en `localStorage`, no en DB

**Por qué localStorage**: el flag es UX-local. Persistirlo en DB requiere una columna nueva en `BabyProfile` o una tabla de flags. El costo no se justifica. localStorage es per-device, lo cual es aceptable (si el padre usa otro device, verá el banner una vez, no es disruptivo).

**Storage key**: `pakulab:stageTransition:10_12` y `pakulab:stageTransition:13_17` (separar por etapa para que dismissed en una no impida ver la próxima).

**Estructura del valor**: `string` con valor `'dismissed'` o `'2026-06-18'` (fecha del dismiss para analytics futuro). Mantener string simple, no JSON.

### AD-06: Tier gating para allergens via `requireTier('PRO', { code: 'INSUFFICIENT_TIER' })` preHandler

**Por qué el patrón existente**: el proyecto ya tiene `requireTier` en `apps/api/src/shared/hooks/requireTier.ts`. Usar el patrón consistente evita custom error handling, mantiene una sola fuente de verdad para el shape del error (`InsufficientTierError` ya se serializa en el response handler global).

**NO 402 manual**: el preHandler lanza la excepción, el error handler global la convierte a la respuesta HTTP correcta. Custom 402 rompería la consistencia.

```ts
// apps/api/src/modules/allergens/allergens.routes.ts
fastify.get('/status',
  { preHandler: [requireAuth, requireTier('PRO', { code: 'INSUFFICIENT_TIER' })] },
  async (request) => {
    const { babyProfileId } = request.query as { babyProfileId: string }
    return await allergensService.getStatus(babyProfileId)
  }
)
```

### AD-07: `STAGE_TIPS` usa un `Record<AgeStage, readonly string[]>` (shape distinto a `BALANCE_TIPS`)

**Por qué Record y no flat array**: `BALANCE_TIPS` es global (no depende de edad). `STAGE_TIPS` sí depende de la etapa. Un `Record<AgeStage, readonly string[]>` es el shape correcto y permite testear cada array de manera independiente.

**Curación de tips**: copy inicial con 4-6 tips por etapa, basados en la guía PDF. Cada tip referencia información real de la base (no se generan dinámicamente). Mismo principio que `BALANCE_TIPS`: "NEVER generate these dynamically".

### AD-08: `PlateItem.servingAmount` (ya existente) se usa tal cual

**Por qué no migración**: el campo ya existe (`String?` opcional). La UI solo necesita agregar un selector (1, 2, 3, 4 cdas) y un display "X cdas en total". El campo persiste el valor como string para flexibilidad (e.g. "1.5" si se quisiera medio-cda en el futuro, aunque no se usa en MVP).

**Validación backend**: agregar al Zod schema de `PlateItem`: `z.string().regex(/^[1-4]$/, 'Porción debe ser 1, 2, 3 o 4 cdas')`. Default `null` permitido.

### AD-09: 5 grupos para 10-23m, NO 6 (DAIRY rechazado para MVP)

**Por qué NO DAIRY**: la guía PDF explícitamente dice que yogur/queso van en Proteínas. Agregar DAIRY como 6° grupo contradice la fuente clínica y abre preguntas sobre el modelo conceptual (¿el queso crema es DAIRY o HEALTHY_FAT?). El beneficio de tener un slot separado para tracking es marginal vs. la confusión conceptual.

**Tradeoff aceptado**: el padre no puede armar un plato 6-grupos con lácteos en su propio slot. Yogur/queso siguen contando en PROTEINS. Si el equipo clínico pide 6 grupos en el futuro, se agrega en un change separado con su propia discusión.

### AD-10: 1er PR es solo `getMealSlotsForAge` + 3 consumidores (scope mínimo)

**Por qué scope mínimo en el primer PR**: establecer la fuente única de verdad antes de tocar los 5+ consumidores evita refactors masivos. Si el 1er PR falla, el rollback es trivial (revertir, los consumers vuelven a la constante vieja). Si se mete más en el 1er PR, el blast radius es mayor y la revisión es más pesada.

**Scope del 1er PR**:

- `packages/shared/src/constants/dashboard.ts` (agregar `getMealSlotsForAge`, `AgeStage` type, `STAGE_TIPS`)
- `apps/api/src/modules/dashboard/dashboard.service.ts` (usar `getMealSlotsForAge` en `getDashboardData`)
- `apps/web/src/modules/dashboard/DashboardPage.vue` (reemplazar `DASHBOARD_MEAL_SLOTS` con getter)
- `apps/web/src/modules/menus/MenuWeekPage.vue` (extender `MEALS` con `SNACK_1`/`SNACK_2` age-aware)
- `apps/web/src/modules/diary/DiaryPage.vue` (timeline order)

~150-200 líneas de cambio + 5-6 tests.

---

## 2. Nuevos tipos en `packages/shared/src/types/`

### `food.ts` (extender)

```ts
// packages/shared/src/types/food.ts
export const WARNING_TAGS = [
  'PROHIBITED_UNDER_24M',
  'CHOKING_HAZARD_UNDER_5Y',
  'PROHIBITED_PEDIATRIC',
  'REQUIRES_PREPARATION',
] as const

export type WarningTag = (typeof WARNING_TAGS)[number]

export interface Food {
  // ... campos existentes
  warningTags: readonly WarningTag[]  // agregado en migración
}

export const ALLERGEN_STATUSES = ['introduced', 'pending', 'in_window'] as const
export type AllergenStatus = (typeof ALLERGEN_STATUSES)[number]

export interface AllergenAlert {
  type: AllergenType
  name: string
  status: AllergenStatus
  introducedAt: string | null
  exposureCount: number
  lastReaction: ReactionType | null
}

export interface AllergenStatusResponse {
  ageMonths: number
  closingWindow: boolean
  allergens: readonly AllergenAlert[]
}
```

### `diary.ts` (extender)

```ts
// packages/shared/src/types/diary.ts
export const AGE_STAGES = [
  'SIX_TO_NINE_MONTHS',
  'TEN_TO_TWELVE_MONTHS',
  'THIRTEEN_TO_SEVENTEEN_MONTHS',
  'EIGHTEEN_TO_TWENTY_THREE_MONTHS',
] as const
export type AgeStage = (typeof AGE_STAGES)[number]
```

### `plate.ts` (nuevo)

```ts
// packages/shared/src/types/plate.ts
export const PLATE_STAGES = [
  'SIX_TO_NINE_MONTHS',
  'TEN_TO_TWELVE_MONTHS',
  'THIRTEEN_TO_TWENTY_THREE_MONTHS',
  'FAMILY_TABLE',
] as const
export type PlateStage = (typeof PLATE_STAGES)[number]

export const PLATE_STAGE_LABELS: Record<PlateStage, string> = {
  SIX_TO_NINE_MONTHS: '6-9 meses',
  TEN_TO_TWELVE_MONTHS: '10-12 meses',
  THIRTEEN_TO_TWENTY_THREE_MONTHS: '13-23 meses',
  FAMILY_TABLE: 'Mesa familiar (24m+)',
}
```

### `dashboard.ts` (extender)

```ts
// packages/shared/src/types/dashboard.ts
export interface SnackSuggestion {
  food: Food
  reason: string  // 'Fruta blanda apta para colación', 'Yogur natural sin azúcar', etc.
}

export interface SnackSuggestionsResponse {
  available: boolean
  reason?: 'SNACKS_NOT_YET'
  suggestions?: readonly SnackSuggestion[]
}
```

---

## 3. Contratos de endpoints nuevos

### `GET /api/allergens/status?babyProfileId=X`

**Auth**: BetterAuth session cookie. **Tier**: PRO (via `requireTier('PRO', { code: 'INSUFFICIENT_TIER' })`).

**Response 200**:

```ts
{
  data: {
    ageMonths: number
    closingWindow: boolean
    allergens: AllergenAlert[]
  }
}
```

**Response 401**: usuario no autenticado (`UnauthorizedError` del error handler global).

**Response 403** (con `code: 'INSUFFICIENT_TIER'`): usuario FREE. El cliente usa el código para mostrar CTA a `/billing` en vez de un error genérico.

**Cache**: TTL 1h via `DASHBOARD_CACHE_TTL.allergens` (ya existe la constante).

### `GET /api/dashboard/snack-suggestions?babyProfileId=X`

**Auth**: BetterAuth. **Tier**: FREE (educación clínica).

**Response 200**:

```ts
{
  data: {
    available: true,
    suggestions: SnackSuggestion[]
  }
}
```

**Response 200 (bebé <10m)**:

```ts
{
  data: {
    available: false,
    reason: 'SNACKS_NOT_YET'
  }
}
```

**No se filtra por tier** — es educación clínica FREE.

### `GET /api/plates` — extiende con `?stageFor=PLATE_STAGE`

**Auth**: BetterAuth. **Tier**: FREE.

**Query params**:

- `stageFor` (opcional): uno de los `PLATE_STAGES` o `null` para plates sin stage. Si se omite, retorna todos los plates del usuario.

**Comportamiento**:

- Sin `stageFor`: retorna todos los plates del usuario (backward compat)
- Con `stageFor=X`: filtra `where: { userId, stageFor: X }`
- Con `stageFor=null`: filtra `where: { userId, stageFor: null }`

### `POST /api/plates` — extiende con `stageFor` en el body

**Body schema (Zod)**:

```ts
const plateItemSchema = z.object({
  foodId: z.string(),
  foodGroup: z.nativeEnum(FoodGroup),
  servingAmount: z.string().regex(/^[1-4]$/).nullish(),
  // ... otros campos existentes
})

const createPlateSchema = z.object({
  name: z.string().min(1).max(100),
  groupCount: z.number().int().min(4).max(6),
  stageFor: z.enum(PLATE_STAGES).nullish(),  // NUEVO
  items: z.array(plateItemSchema).min(1),
})
```

---

## 4. Estrategia de migración

### Migración 1: `WarningTag` (Bloque 3)

```sql
-- prisma/migrations/XXXX_warning_tags/migration.sql
CREATE TYPE "WarningTag" AS ENUM (
  'PROHIBITED_UNDER_24M',
  'CHOKING_HAZARD_UNDER_5Y',
  'PROHIBITED_PEDIATRIC',
  'REQUIRES_PREPARATION'
);

ALTER TABLE "Food" ADD COLUMN "warningTags" "WarningTag"[] NOT NULL DEFAULT '{}';
```

**Reversibilidad**: `ALTER TABLE "Food" DROP COLUMN "warningTags"; DROP TYPE "WarningTag";`. Aditiva, no rompe data existente (default `[]`).

**Backfill**: el seed (Bloque 1 + Bloque 4) actualiza `warningTags` de los alimentos relevantes. La app funciona sin backfill (los alimentos sin tags simplemente no muestran warnings).

**Orden de deploy**: migration primero, código después. La app nueva puede leer `warningTags` antes de que el seed haga el backfill — funciona con array vacío.

### Migración 2: `Plate.stageFor` (Bloque 5)

```sql
-- prisma/migrations/XXXX_plate_stage_for/migration.sql
CREATE TYPE "PlateStage" AS ENUM (
  'SIX_TO_NINE_MONTHS',
  'TEN_TO_TWELVE_MONTHS',
  'THIRTEEN_TO_TWENTY_THREE_MONTHS',
  'FAMILY_TABLE'
);

ALTER TABLE "Plate" ADD COLUMN "stageFor" "PlateStage";
```

**Reversibilidad**: `ALTER TABLE "Plate" DROP COLUMN "stageFor"; DROP TYPE "PlateStage";`. Aditiva, no rompe data existente (default `null`).

**Backfill**: NO se backfillea automáticamente. Los plates existentes quedan con `stageFor = null`. El padre puede etiquetar manualmente.

**Orden de deploy**: migration primero, código después. La app nueva puede leer/escribir `stageFor` con `null` permitido.

### Migración 3 (OPCIONAL, decisión pendiente): `FoodGroup.DAIRY`

**Decisión**: NO se hace en este change. Se documenta en el `Out of scope` del spec.

---

## 5. Cambios file-level

### `packages/shared/src/`

| Archivo | Cambio | LOC |
|---------|--------|----:|
| `constants/dashboard.ts` | `getMealSlotsForAge()`, `AgeStage` type, `STAGE_TIPS` Record, slot constants | ~80 |
| `constants/dashboard.test.ts` | Tests de las nuevas funciones | ~50 |
| `types/food.ts` | `WarningTag` enum, `AllergenAlert` interface, `AllergenStatusResponse` | ~40 |
| `types/food.test.ts` | Type tests (compile-time) | ~10 |
| `types/diary.ts` | `AGE_STAGES`, `AgeStage` type | ~5 |
| `types/plate.ts` (new) | `PLATE_STAGES`, `PlateStage`, `PLATE_STAGE_LABELS` | ~20 |
| `types/dashboard.ts` | `SnackSuggestion`, `SnackSuggestionsResponse` | ~20 |
| `index.ts` | Re-exports | ~5 |

**Total shared**: ~230 LOC + ~60 LOC tests.

### `apps/api/src/`

| Archivo | Cambio | LOC |
|---------|--------|----:|
| `modules/allergens/allergens.service.ts` (new) | `computeAllergenStatus`, `getAllergenStatus` (con auth) | ~120 |
| `modules/allergens/allergens.service.test.ts` (new) | Tests de derivación | ~120 |
| `modules/allergens/allergens.routes.ts` | Agregar `GET /status` con `requireTier('PRO')` | ~25 |
| `modules/dashboard/dashboard.service.ts` | `getSuggestedFoods` prioriza hierro si `ageMonths >= 10`; `getSnackSuggestions`; usa `getMealSlotsForAge` | ~80 |
| `modules/dashboard/dashboard.routes.ts` | Nueva ruta `GET /snack-suggestions` | ~15 |
| `modules/plates/plates.routes.ts` | Query param `stageFor` en GET; validación de `stageFor` en POST | ~30 |
| `modules/plates/plates.service.ts` | Filtro por `stageFor` en query | ~15 |

**Total API**: ~400 LOC + ~120 LOC tests.

### `apps/web/src/`

| Archivo | Cambio | LOC |
|---------|--------|----:|
| `modules/dashboard/DashboardPage.vue` | Usa `getMealSlotsForAge`; integra `StageTransitionBanner`, `AllergenTrackerCard`, `SnackSuggestionCard`, `PerceptiveFeedingCard` | ~80 |
| `modules/dashboard/components/StageTransitionBanner.vue` (new) | Banner descartable | ~60 |
| `modules/dashboard/components/AllergenTrackerCard.vue` (new) | Card de alérgenos | ~140 |
| `modules/dashboard/components/SnackSuggestionCard.vue` (new) | Card de snacks | ~100 |
| `modules/dashboard/components/PerceptiveFeedingCard.vue` (new) | Card colapsable | ~80 |
| `modules/dashboard/components/TextureGuideCard.vue` | Split 12+m en 10-12m, 13-17m, 18-23m | ~40 |
| `modules/menus/MenuWeekPage.vue` | `MEALS` age-aware con `SNACK_1`/`SNACK_2` | ~30 |
| `modules/plates/components/PlateVisualization.vue` | Indicator "X/4 cdas" | ~25 |
| `modules/plates/components/PlateBuilderDrawer.vue` | Selector de `groupCount` con sugerencia; selector de `stageFor` | ~50 |
| `modules/plates/components/PlateContents.vue` | Selector de porción por slot | ~60 |
| `modules/foods/FoodSearchPage.vue` | Badge de warning tag | ~20 |
| `modules/foods/FoodSearchModal.vue` | Badge de warning tag, panel de warning | ~50 |
| `modules/diary/DiaryPage.vue` | Timeline order con `getMealSlotsForAge` | ~15 |
| `modules/diary/components/AddMealModal.vue` | Recordatorio de agua | ~30 |
| `shared/composables/useStageTransition.ts` (new) | Detección de cruce + localStorage | ~60 |
| `shared/composables/useDashboardTips.ts` | Extender con `useStageTip(ageMonths)` | ~20 |

**Total web**: ~860 LOC.

### `prisma/`

| Archivo | Cambio | LOC |
|---------|--------|----:|
| `schema.prisma` | `enum WarningTag`, `Food.warningTags`, `enum PlateStage`, `Plate.stageFor` | ~15 |
| `migrations/XXXX_warning_tags/migration.sql` (new) | SQL de migración 1 | ~5 |
| `migrations/XXXX_plate_stage_for/migration.sql` (new) | SQL de migración 2 | ~5 |
| `seed.ts` | 6 alimentos nuevos (Bloque 1) + backfill de warning tags (Bloque 4) | ~80 |

**Total prisma**: ~105 LOC.

### Tests totales (estimación)

| Área | Tests | LOC |
|------|------:|----:|
| Shared constants/types | 6-8 | 60 |
| Backend services | 8-10 | 240 |
| Backend routes (integration) | 4-5 | 80 |
| Frontend composables | 4-5 | 60 |
| Frontend components | 6-8 | 100 |
| **Total** | **28-36** | **~540** |

### Estimación total del change

- **Archivos modificados**: ~25
- **Archivos nuevos**: ~10
- **Líneas de código**: ~1700-1900 (incluyendo tests)
- **Migraciones**: 2
- **Tests**: 28-36
- **PRs estimados (auto-forecast)**: 4-6

---

## 6. Diagramas de secuencia

### 6.1 Cutover suave (Stage Transition)

```
[Mount DashboardPage]
  │
  ├─► useStageTransition(currentAgeMonths)
  │     │
  │     ├─► read localStorage['pakulab:lastSeenAgeMonths']
  │     ├─► read localStorage['pakulab:stageTransition:10_12']
  │     │
  │     ├─► if (currentAgeMonths >= 10 && lastSeen < 10 && !dismissed):
  │     │     return { transition: 'TO_TEN_TWELVE', dismissed: false }
  │     │
  │     └─► return { transition: null, dismissed: false }
  │
  ├─► if (transition && !dismissed): render <StageTransitionBanner>
  │
  └─► [User clicks "No mostrar de nuevo"]
        │
        ├─► write localStorage['pakulab:stageTransition:10_12'] = '2026-06-18'
        └─► banner.hide()
```

### 6.2 Allergen tracker load

```
[Mount AllergenTrackerCard with babyProfileId]
  │
  ├─► useQuery(['allergenStatus', babyProfileId])
  │     │
  │     └─► GET /api/allergens/status?babyProfileId=X
  │           │
  │           ├─► [Fastify preHandler chain]
  │           │     ├─► requireAuth → check session cookie
  │           │     └─► requireTier('PRO', { code: 'INSUFFICIENT_TIER' })
  │           │           └─► if !tierAtLeast(user.tier, 'PRO'):
  │           │                throw new InsufficientTierError('PRO', user.tier)
  │           │           [error handler converts to 403 with code]
  │           │
  │           └─► allergensService.getStatus(babyProfileId)
  │                 │
  │                 ├─► prisma.babyProfile.findUnique({ birthDate })
  │                 ├─► compute ageMonths from birthDate
  │                 ├─► prisma.foodLog.findMany({
  │                 │     where: {
  │                 │       babyProfileId,
  │                 │       food: { isAllergen: true }
  │                 │     },
  │                 │     include: { food: true }
  │                 │   })
  │                 │
  │                 └─► computeAllergenStatus({  // pure function
  │                       foodLogs, ageMonths,
  │                       allAllergenTypes: TOP_ALLERGENS,
  │                       closingWindowAgeMonths: 10
  │                     })
  │                       │
  │                       ├─► for each allergen type:
  │                       │     ├─► filter logs of that type
  │                       │     ├─► exclude reaction = REJECTED
  │                       │     ├─► count exposures
  │                       │     ├─► determine status
  │                       │     └─► push AllergenAlert
  │                       │
  │                       └─► return { ageMonths, closingWindow, allergens }
  │
  └─► Card renders 8 chips
        ├─► 3 introduced (green)
        └─► 5 pending (red, closing window alert)
```

### 6.3 Save plate with stageFor

```
[User edits plate in PlateBuilderDrawer]
  │
  ├─► Selects groupCount = 5 (badge "Sugerido para 11 meses")
  ├─► Adds 5 items, sets servingAmount per slot
  ├─► Selects stageFor = 'TEN_TO_TWELVE_MONTHS'
  │
  └─► Click "Guardar"
        │
        └─► POST /api/plates
              Body: { name, groupCount: 5, stageFor: 'TEN_TO_TWELVE_MONTHS', items: [...] }
              │
              ├─► [preHandler: requireAuth, requireTier('FREE')]
              ├─► Zod validation: createPlateSchema.parse(body)
              │     ├─► stageFor: z.enum(PLATE_STAGES).nullish() ✓
              │     ├─► items: z.array(plateItemSchema).min(1) ✓
              │     └─► each item: servingAmount: z.string().regex(/^[1-4]$/) ✓
              │
              └─► platesService.create({ userId, ...body })
                    │
                    └─► prisma.plate.create({ data: { userId, ...body, items: { create: items } } })
                          │
                          └─► return { data: plate }
```

### 6.4 Filter plates by stage

```
[User opens plates list with baby of 11 months]
  │
  ├─► useBabyAge(babyProfileId) → 11
  ├─► default filter = getSuggestedStageForAge(11) = 'TEN_TO_TWELVE_MONTHS'
  │
  └─► GET /api/plates?stageFor=TEN_TO_TWELVE_MONTHS
        │
        ├─► [preHandler: requireAuth, requireTier('FREE')]
        ├─► Zod validation: listQuerySchema (extends with stageFor)
        │
        └─► platesService.list({ userId, stageFor: 'TEN_TO_TWELVE_MONTHS' })
              │
              └─► prisma.plate.findMany({
                    where: { userId, stageFor: 'TEN_TO_TWELVE_MONTHS' }
                  })
                    │
                    └─► return { data: plates }
```

---

## 7. Test strategy

### 7.1 Pure functions (highest coverage priority)

- `getMealSlotsForAge(months)` — tabla de tests para cada rango de edad (0, 6, 9, 10, 12, 13, 17, 18, 23, 24, 30)
- `getSuggestedGroupCount(months)` — mismo patrón
- `getSuggestedStageForAge(months)` — mismo patrón
- `computeAllergenStatus(...)` — casos:
  - Bebé con 0 exposures
  - Bebé con 1 exposure (LIKED → introduced)
  - Bebé con 1 exposure (REJECTED → no introduced)
  - Bebé con 8 exposures (todos los alérgenos)
  - Bebé de 14m con `closingWindow: true` y 3 introducidos
- `STAGE_TIPS` — cada etapa tiene al menos 4 tips; `useStageTip` no repite en la misma sesión

### 7.2 Backend services

- `allergensService.getStatus()` — test de integración con Prisma mockeado (verificar shape de respuesta, tier gating via `InsufficientTierError`)
- `dashboardService.getSnackSuggestions()` — test de filtrado por `warningTags` y `ageMonths`
- `dashboardService.getSuggestedFoods()` — test de prioridad de hierro cuando `ageMonths >= 10`

### 7.3 Frontend composables

- `useStageTransition()` — test de localStorage (mock), test de detección de cruce
- `useDashboardTips.useStageTip()` — test de selección aleatoria sin repeat

### 7.4 Frontend components (smoke tests)

- `AllergenTrackerCard` — renderiza con data, renderiza con empty, renderiza con FREE user (CTA)
- `StageTransitionBanner` — visible, dismissed, scrollea a texture
- `PlateBuilderDrawer` — muestra sugerencia de groupCount, permite override

### 7.5 Integration tests (E2E)

- Bebé 11m, agregar nuevo alimento, ver que la card de alérgenos refleja el cambio
- Bebé 9m → 10m, ver el banner de transición
- Guardar plate con `stageFor`, filtrar lista por `stageFor`

### 7.6 Regression

- Suite completa de tests existentes debe seguir verde
- `pnpm --filter api test` (Vitest)
- `pnpm --filter web test`
- `pnpm --filter shared test`

---

## 8. Open questions (se cierran en tasks o se escalan)

1. **Copy exacta del banner de cutover** — draft en `STAGE_TIPS`, ajustable post-nutriólogo. Decisión: usar draft ahora, refinar en iteración.
2. **¿Persiste el último `lastSeenAgeMonths` en localStorage?** — Sí, para detectar cruces entre sesiones. Key: `pakulab:lastSeenAgeMonths`.
3. **¿Se filtra por `warningTags` en `MenuWeekPage` o solo se muestra el badge?** — Spec dice badge. Filtrar (esconder) contradice AD-02.
4. **¿El "X/4 cdas" se muestra en cada slot individual o solo en el header?** — En cada slot (más granular). Header muestra total.
5. **¿`AllergenTrackerCard` se muestra a FREE user con CTA o no se muestra?** — Se muestra con CTA (awareness → conversión). El padre ve qué está perdiendo al no tener PRO.
6. **¿Snack suggestions se filtran por `foodGroup` o solo por `ageMonths`?** — Solo por `ageMonths` + `warningTags` exclusion. No filtrar por group (un snack puede ser fruta, yogur, galleta, etc.).

---

## 9. Riesgos y mitigaciones

| Risk | Mitigation |
|------|------------|
| Tier gating rompe clientes que asumen endpoint siempre disponible | El cliente ya está acostumbrado al patrón (diary usa `requireTier`). El código de error `INSUFFICIENT_TIER` es explícito para que el cliente muestre el CTA correcto. |
| `getMealSlotsForAge` cambia la cantidad de slots y rompe TodayLogsCard | Tests visuales de regresión: el card sigue mostrando slots correctos, con gaps visibles si el bebé no logueó snacks. |
| `computeAllergenStatus` es O(n) en memoria — para bebés con >10k FoodLogs podría ser lento | TTL 1h. Query SQL con `where: { food: { isAllergen: true } }` ya filtra. Para 10k logs, el filter en memoria es sub-50ms. |
| Seed backfill de `warningTags` toca alimentos ya validados | Backfill es solo en alimentos NO validados (sin `needsValidation: true`). Para validados, se requiere consulta explícita al nutriólogo. |
| Banner aparece 2+ veces si el padre tiene múltiples dispositivos | localStorage es per-device. Aceptable. Si se vuelve problema, se mueve a DB (futuro). |
| 5 grupos vs 6 grupos cambia entre devices | Decisión lockeada en este change. No hay diferencia entre devices. |
| `STAGE_TIPS` se desactualiza y muestra tips de 6m a un bebé de 18m | La función `getStageForAge(months)` filtra por etapa. Test explícito. |

---

## 10. Next step

Pasar a **tasks.md** con la descomposición en tareas por bloque, en orden de ejecución. Cada tarea referencia el spec (REQ-X-Y) que implementa y el archivo específico. Pauso para revisión.

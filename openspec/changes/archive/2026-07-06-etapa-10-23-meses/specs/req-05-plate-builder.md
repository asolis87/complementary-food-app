# Spec: Plate Builder Enhancements (Bloques 4 + 5)

> **Why**: ver `proposal.md` §3.8 y `analysis-10-23-months.md` G6, G7, G16. El plate builder actual no sugiere groupCount por edad, no muestra la porción (1-4 cdas según la guía), y no etiqueta los platos con la etapa objetivo. Esto oculta la progresión clínica.
>
> **Bloque**: 4 (groupCount + serving amount) + 5 (plate.stageFor). Tier: **FREE**.
>
> **Decisión abierta**: ¿`FoodGroup.DAIRY` como 6° grupo independiente? Spec asume **NO por ahora** (mantener yogur/queso en PROTEINS como dice la guía). Si el equipo clínico pide DAIRY como 6° grupo en una iteración futura, se agrega en un change separado.

---

## Capability A: Group Count Suggestion (MODIFIED)

`PlateBuilderDrawer` actualmente permite al padre elegir 4 o 5 grupos libremente. Se agrega una sugerencia age-aware con badge "Sugerido para X meses".

### REQ-A1

`PlateBuilderDrawer` SHALL mostrar un selector de groupCount con la siguiente lógica:

| Edad del bebé | Sugerido | Opciones permitidas |
|---------------|----------|---------------------|
| 6-9m | 4 | 4 / 5 |
| 10-23m | 5 | 4 / 5 / (6 si FoodGroup.DAIRY existe) |

Si la sugerencia es distinta del valor actual, mostrar un **badge "Sugerido"** con icono junto a la opción sugerida.

#### Scenario: Bebé de 10 meses con plato de 4 grupos ve sugerencia a 5

- GIVEN bebé de 10 meses, `groupCount: 4` (default heredado)
- WHEN `PlateBuilderDrawer` renderiza
- THEN el selector muestra las opciones 4 y 5
- AND la opción 5 tiene badge "Sugerido para 10 meses" con icono
- AND el padre puede seguir eligiendo 4 si quiere (AD-02)

#### Scenario: Bebé de 8 meses con plato de 5 grupos ve sugerencia a 4

- GIVEN bebé de 8 meses, `groupCount: 5`
- WHEN `PlateBuilderDrawer` renderiza
- THEN el selector muestra 4 y 5
- AND la opción 4 tiene badge "Sugerido para 8 meses"

---

### REQ-A2

La sugerencia SHALL ser determinista, no usar ML. La función pura es `getSuggestedGroupCount(ageMonths): number`.

```ts
function getSuggestedGroupCount(ageMonths: number): number {
  return ageMonths < 10 ? 4 : 5
}
```

#### Scenario: Función pura testable

- GIVEN `getSuggestedGroupCount`
- WHEN se llama con `5`, `9`, `10`, `15`, `24`
- THEN retorna `4, 4, 5, 5, 5` respectivamente

---

### Out of scope — Capability A

- Sugerencia adaptativa basada en historial de platos del bebé
- Auto-sugerir los alimentos para llenar los grupos (la selección es del padre)
- Forzar el groupCount sugerido (siempre es overrideable)

---

## Capability B: Serving Amount Indicator (NEW)

Cada slot del plato muestra un selector de porción (1, 2, 3 o 4 cucharadas) y un indicador visual "X/4 cdas" que se acumula.

### REQ-B1

`PlateContents` SHALL agregar un selector de porción a cada slot con valores: 1, 2, 3, 4 cucharadas. Default: **1 cda** para alimentos nuevos, preserva el valor existente si el slot ya tenía `servingAmount`.

#### Scenario: Slot nuevo con default 1 cda

- GIVEN slot recién agregado al plato
- WHEN renderiza
- THEN el selector de porción muestra "1 cda" como default
- AND el slot persiste `servingAmount: "1"` en `PlateItem.servingAmount` al guardar

#### Scenario: Slot existente preserva porción

- GIVEN slot con `servingAmount: "3"` previamente guardado
- WHEN se edita el plato
- THEN el selector muestra "3 cdas"

---

### REQ-B2

La UI SHALL mostrar la suma total de porciones del plato en formato "X cdas" cerca del header del plate.

#### Scenario: Plato con 3 slots ve total

- GIVEN plate con 3 slots: 1 cda + 2 cdas + 1 cda
- WHEN renderiza el header del plate
- THEN muestra "4 cdas en total" (o similar, copy específica en design)

#### Scenario: Plato con 6 slots ve total

- GIVEN plate con 6 slots, cada uno con 1 cda
- THEN muestra "6 cdas en total"

---

### REQ-B3

La suma SHALL considerar la sugerencia clínica de la guía PDF: 1-4 cdas por grupo/comida. Si el plato excede 4 cdas por grupo, mostrar un **aviso no-bloqueante** "Estás ofreciendo más de 4 cdas por grupo, asegurate de respetar las señales de saciedad".

#### Scenario: Plato con 5 cdas en un grupo dispara aviso

- GIVEN plate con un slot `PROTEINS` con `servingAmount: "5"`
- WHEN renderiza
- THEN aparece un banner amarillo "Estás ofreciendo más de 4 cdas por grupo, asegurate de respetar las señales de saciedad"
- AND el plato se guarda igual (no bloquea)

#### Scenario: Plato con 4 cdas en cada grupo no dispara aviso

- GIVEN plate con 5 slots, cada uno con 4 cdas
- WHEN renderiza
- THEN no aparece el banner

---

### Out of scope — Capability B

- Tracking histórico de cuántas cdas comió realmente (es plan vs. real, distinto scope)
- Conversión a gramos o mililitros (la guía usa cucharadas como unidad)
- Porciones en onzas/libras (asumimos mercado hispano, métrica/cucharas)
- Sugerir porción automática basada en edad (siempre elige el padre)

---

## Capability C: Plate Stage For (NEW)

`Plate.stageFor` permite etiquetar un plato con la etapa objetivo. Útil para reusar y filtrar.

### REQ-C1

`PlateStage` SHALL ser un `enum` Prisma:

- `SIX_TO_NINE_MONTHS`
- `TEN_TO_TWELVE_MONTHS`
- `THIRTEEN_TO_TWENTY_THREE_MONTHS`
- `FAMILY_TABLE` (24m+)

`Plate.stageFor: PlateStage?` SHALL ser opcional. Default para plates existentes: `null`.

#### Scenario: Migración agrega la columna

- GIVEN `prisma/schema.prisma` con `enum PlateStage` y `Plate.stageFor?`
- WHEN se ejecuta `pnpm --filter api prisma migrate dev --name plate_stage_for`
- THEN la columna existe con default `null`
- AND los plates existentes mantienen `stageFor = null`

---

### REQ-C2

`PlateBuilderDrawer` SHALL incluir un selector opcional "Etapa objetivo" con las 4 opciones + "Sin definir". Al guardar un plato nuevo, el padre puede elegir la etapa o dejarla sin definir.

#### Scenario: Padre etiqueta plato como 10-12m

- GIVEN padre edita un plato nuevo
- WHEN selecciona la etapa "10-12 meses" en el selector
- AND guarda el plato
- THEN `Plate.stageFor = 'TEN_TO_TWELVE_MONTHS'`

#### Scenario: Padre guarda sin etapa

- GIVEN padre edita un plato
- WHEN guarda sin seleccionar etapa
- THEN `Plate.stageFor = null`

---

### REQ-C3

Al listar plates (en el dashboard o en la lista de plates reutilizables), SHALL existir un **filtro opcional por etapa**. El filtro tiene 5 opciones: Todas, 6-9m, 10-12m, 13-23m, 24m+.

#### Scenario: Filtro por etapa funciona

- GIVEN lista de plates con stages variados (algunos con `TEN_TO_TWELVE_MONTHS`, otros con `null`)
- WHEN el usuario selecciona filtro "10-12 meses"
- THEN solo se muestran los plates con `stageFor = 'TEN_TO_TWELVE_MONTHS'`
- AND los plates con `null` se ocultan (no se incluyen en "Sin definir")

#### Scenario: Filtro "Sin definir" muestra los sin stage

- GIVEN filtro "Sin definir" seleccionado
- WHEN se aplica
- THEN solo se muestran los plates con `stageFor = null`

---

### REQ-C4

El filtro SHALL sugerir la etapa del bebé actual como default. Si el bebé tiene 11 meses, el filtro por default es "10-12 meses".

#### Scenario: Default sensato por edad del bebé

- GIVEN bebé de 11 meses
- WHEN abre la lista de plates
- THEN el filtro está pre-seleccionado a "10-12 meses"

---

### Out of scope — Capability C

- Migrar plates existentes inferiendo la etapa (quedan en `null`, el padre los puede etiquetar manualmente)
- Auto-asignar `stageFor` basándose en `ageMonths` al guardar
- Plates con múltiples etapas (un plate puede ser para 10-23m, no para múltiples etapas disjuntas)
- Edición masiva de `stageFor`

---

## Capability D: Plate Export with Stage (NEW)

`F3` del proposal: el export PDF del menú semanal incluye la etapa objetivo del bebé.

### REQ-D1

El endpoint de export de menú SHALL incluir `stageFor` en el PDF header.

#### Scenario: Export PDF incluye etapa

- GIVEN menú semanal del bebé "Tomás" de 14 meses
- WHEN se genera el PDF
- THEN el header del PDF muestra "Menú semanal — Tomás — 13-23 meses" (basado en `babyProfile.ageMonths` actual)

---

### Out of scope — Capability D

- Export por plate individual (solo menú semanal)
- Watermark en PRO vs FREE (ya existe, no se renegocia)
- Templates múltiples del export

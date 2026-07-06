# Spec: Warning Tags (Bloques 3 + 4)

> **Why**: ver `proposal.md` §3.2 y `analysis-10-23-months.md` G9. Los alimentos prohibidos <24m (leche vaca entera, yogur griego, miel, azúcar, embutidos, bebidas vegetales) y los de atragantamiento <5y (frutos secos enteros, uvas/pasas/cerezas enteras, palomitas) actualmente no se distinguen visualmente en FoodSearch. El padre los puede elegir sin advertencia.
>
> **Bloque**: 3 (schema migration) + 4 (UI badges). Tier: **FREE** (seguridad clínica no se paywalled).
>
> **Decisión arquitectónica**: las warnings son **informativas**, no bloqueantes. AD-02 dice que la decisión es del padre. La UI muestra un badge + tooltip; el alimento sigue siendo seleccionable.

---

## Capability A: WarningTag Schema (NEW)

### REQ-A1

`WarningTag` SHALL ser un `enum` Prisma con los valores:

- `PROHIBITED_UNDER_24M` — leche vaca entera, yogur griego, miel, azúcar añadida, embutidos, bebidas vegetales
- `CHOKING_HAZARD_UNDER_5Y` — frutos secos enteros, uvas/pasas/aceitunas/arándanos enteros, palomitas, pescado con espinas
- `PROHIBITED_PEDIATRIC` — cafeína, ultraprocesados (toda edad pediátrica)
- `REQUIRES_PREPARATION` — alimentos que requieren machacado/cocción específica para la edad

#### Scenario: Migration crea el enum

- GIVEN `prisma/schema.prisma` con el enum agregado
- WHEN se ejecuta `pnpm --filter api prisma migrate dev --name warning_tags`
- THEN el enum existe en la DB
- AND `Food.warningTags: WarningTag[]` se crea con default `[]`

#### Scenario: Migración es no-destructiva

- GIVEN alimentos existentes en la tabla `Food` antes de la migración
- WHEN se aplica la migración
- THEN todos los alimentos existentes tienen `warningTags = []` (default)
- AND ningún alimento se pierde

---

### REQ-A2

`Food.warningTags` SHALL ser un array (`WarningTag[]`). El cliente puede usar los valores del enum para filtrar o mostrar badges.

#### Scenario: Backfill de tags en seed

- GIVEN seed actualizado con los tags apropiados
- WHEN se ejecuta `pnpm --filter api db:seed`
- THEN los alimentos relevantes tienen sus tags asignados

Ejemplos de backfill:

- "Leche de vaca entera" → `[PROHIBITED_UNDER_24M]`
- "Miel" → `[PROHIBITED_UNDER_24M]`
- "Uvas" → `[CHOKING_HAZARD_UNDER_5Y]`
- "Café" → `[PROHIBITED_PEDIATRIC]`
- "Maní" → `[CHOKING_HAZARD_UNDER_5Y]` (frutos secos enteros)
- "Pasta espesa" → `[CHOKING_HAZARD_UNDER_5Y, REQUIRES_PREPARATION]`

#### Scenario: Alimento sin tag

- GIVEN "Manzana" (cruda permitida desde 12m con supervisión)
- WHEN se consulta `warningTags`
- THEN `[]` (sin tags, o se le agrega `REQUIRES_PREPARATION` si requiere corte específico)

---

### Out of scope — Capability A

- Tags custom por el usuario
- Tags por edad (actualmente los tags son absolutos, no `CHOKING_HAZARD_UNDER_5Y` se aplica a partir de los 5 años)
- Internacionalización de los tags
- Auditoría de cambios en tags (cuándo se agregó un tag a un alimento)

---

## Capability B: Warning Tags UI (NEW)

### REQ-B1

`FoodSearchPage` SHALL renderizar un **icono de warning** (⚠️ rojo) en cada card de alimento que tenga al menos un `WarningTag`. El icono SHALL tener un tooltip con la descripción del riesgo (no solo el código del tag).

#### Scenario: Alimento con tag muestra warning visible

- GIVEN "Miel" con `warningTags: ['PROHIBITED_UNDER_24M']`
- WHEN se busca "miel" en `/foods`
- THEN la card del resultado muestra el icono ⚠️ en rojo
- AND al hacer hover/tap, un tooltip explica: "No recomendada antes de los 2 años. Riesgo de botulismo."

#### Scenario: Alimento sin tag no muestra warning

- GIVEN "Yogur natural" con `warningTags: []`
- WHEN se busca "yogur" en `/foods`
- THEN la card NO muestra icono de warning

---

### REQ-B2

`FoodSearchModal` SHALL mostrar el mismo icono de warning con tooltip + un **panel de warning** debajo del detalle del alimento con la lista de riesgos y la copy de la guía.

#### Scenario: Modal muestra panel de warning

- GIVEN usuario tap en "Uvas" en FoodSearchModal
- WHEN el modal se abre
- THEN muestra: nombre, foodGroup, preparación, Y un panel rojo "⚠️ Riesgo de atragantamiento (<5 años)"
- AND el panel incluye: "Ofrecer cortadas en cuartos a lo largo, sin semillas. Nunca enteras."

#### Scenario: Padre puede confirmar y agregar igual

- GIVEN modal con panel de warning
- WHEN el usuario clickea "Agregar al plato" sin override
- THEN el alimento se agrega normalmente (AD-02: decisión del padre)

---

### REQ-B3

`warnings` SHALL tener una copy que siempre incluya "consultá a tu pediatra" para reforzar AD-02.

#### Scenario: Tooltip menciona pediatra

- GIVEN cualquier tooltip de warning
- WHEN se renderiza
- THEN la última línea dice: "Si tenés dudas, consultá a tu pediatra."

---

### Out of scope — Capability B

- Bloquear la selección (AD-02: decisión del padre)
- Tracking de cuántas veces el padre ignoró un warning
- Override explícito "lo agregué de todos modos" (no se requiere, la selección es libre)
- Mostrar warnings en otros lugares (bitácora, menú semanal) — solo FoodSearch/MenuWeek

---

## Capability C: Cross-Component Warning Visibility (NEW)

Las warnings SHALL aparecer también en `MenuWeekPage` y en el plate builder (cuando el padre arrastra un alimento con tag al plato).

### REQ-C1

`MenuWeekPage` SHALL mostrar el icono de warning en cada slot que tenga un alimento con `warningTags`.

#### Scenario: Slot con alimento con tag muestra warning

- GIVEN menú semanal con "Uvas" en la colación del lunes
- WHEN renderiza la grilla
- THEN ese slot muestra ⚠️ al lado de "Uvas"

---

### REQ-C2

`PlateBuilderDrawer` SHALL mostrar el icono de warning cuando el padre arrastra un alimento con `warningTags` al slot.

#### Scenario: Alimento con tag arrastrado muestra warning

- GIVEN padre arrastra "Miel" a un slot del plato
- WHEN el drop se completa
- THEN el slot muestra ⚠️ con tooltip

---

### Out of scope — Capability C

- Acumulación de warnings por plato (no se suman, se muestran individualmente)
- Bloquear el guardado del plato
- Resaltar el plato entero como "con warnings" (solo los alimentos individuales)

# Spec: Dashboard Suggestions (Bloque 4)

> **Why**: ver `proposal.md` §3.5 y `analysis-10-23-months.md` G10, G11. Las sugerencias del dashboard actualmente no priorizan hierro para 10-23m (riesgo de anemia) ni sugieren alimentos apropiados para colaciones (snacks). La guía clínica es explícita sobre ambos.
>
> **Bloque**: 4 — Features. Tier: **FREE** (educación clínica, no paywall).

---

## Capability A: Iron-Rich Priority for 10–23m (MODIFIED)

`getSuggestedFoods` en `dashboard.service.ts` SHALL priorizar alimentos con `isIronRich: true` cuando el bebé tiene `ageInMonths >= 10`.

### REQ-A1

`getSuggestedFoods(babyProfileId, mealType)` SHALL:

1. Calcular `ageMonths` del bebé
2. Si `ageMonths >= 10`, filtrar alimentos con `isIronRich: true` y rankearlos primero
3. Mantener el resto de sugerencias (vegetales, frutas, cereales) en la rotación existente
4. La lista final SHALL tener al menos 30% de alimentos iron-rich cuando `ageMonths >= 10`

#### Scenario: Bebé de 11 meses recibe sugerencias con hierro

- GIVEN bebé de 11 meses
- WHEN `getSuggestedFoods` se ejecuta
- THEN las primeras 3 sugerencias son alimentos con `isIronRich: true`
- AND el resto son vegetales, frutas, cereales (rotación normal)

#### Scenario: Bebé de 7 meses sigue con lógica actual

- GIVEN bebé de 7 meses (no aplica la regla)
- WHEN `getSuggestedFoods` se ejecuta
- THEN la respuesta es la actual (sin prioridad de hierro)

---

### REQ-A2

Si NO hay alimentos con `isIronRich: true` disponibles (caso edge de seed incompleto), la sugerencia SHALL caer al comportamiento actual sin error.

#### Scenario: Fallback gracioso

- GIVEN bebé de 11 meses, seed sin alimentos iron-rich
- WHEN `getSuggestedFoods` se ejecuta
- THEN retorna las sugerencias normales (no rompe, no retorna array vacío)

---

### Out of scope — Capability A

- Tracking de hierro consumido (es plan vs. real, scope distinto)
- Recomendaciones específicas de mg/día (no prescribimos, AD-02)
- Suplementos de hierro (no aplica, solo alimentos)
- Alertas de deficiencia (out of scope, no es función de la app)

---

## Capability B: Snack Suggestions (NEW)

`getSnackSuggestions(babyProfileId)` SHALL devolver alimentos apropiados para colaciones cuando el bebé tiene 1 o 2 snacks en su día.

### REQ-B1

`getSnackSuggestions(babyProfileId)` SHALL:

1. Calcular `ageMonths` del bebé
2. Si `ageMonths < 10`: retornar `{ available: false, reason: 'SNACKS_NOT_YET' }` (el bebé aún no tiene snacks)
3. Si `ageMonths >= 10`: retornar 5 alimentos apropiados para colación con `available: true`

Los alimentos apropiados para colación son:

- `ageMonths >= 10`: frutas blandas (plátano, mango, papaya), yogur natural, queso fresco en trozos pequeños, verduras cocidas en palitos (zanahoria, calabaza)
- `ageMonths >= 12`: agregar galletas sin azúcar, pan suave, cereal de arroz inflado
- Excluir siempre: alimentos con `warningTags: ['CHOKING_HAZARD_UNDER_5Y']` (uvas, frutos secos enteros, palomitas)

#### Scenario: Bebé de 8 meses no recibe snack suggestions

- GIVEN bebé de 8 meses
- WHEN `getSnackSuggestions` se ejecuta
- THEN retorna `{ available: false, reason: 'SNACKS_NOT_YET' }`

#### Scenario: Bebé de 11 meses recibe 5 sugerencias

- GIVEN bebé de 11 meses
- WHEN `getSnackSuggestions` se ejecuta
- THEN retorna 5 alimentos
- AND ninguno tiene `warningTags: ['CHOKING_HAZARD_UNDER_5Y']`
- AND al menos 3 son frutas blandas o yogur/queso

#### Scenario: Bebé de 14 meses recibe sugerencias con galletas y pan

- GIVEN bebé de 14 meses
- WHEN `getSnackSuggestions` se ejecuta
- THEN al menos 1 sugerencia es galleta sin azúcar, pan suave o cereal de arroz

---

### REQ-B2

`getSnackSuggestions` SHALL ser consumido por `SnackSuggestionCard.vue` en el dashboard. La card SHALL aparecer solo si el bebé tiene 1 o 2 slots de snack en su día (`getMealSlotsForAge` retorna `SNACK_1` o `SNACK_2`).

#### Scenario: Card visible para bebé de 11 meses

- GIVEN bebé de 11 meses (tiene 1 snack)
- WHEN `DashboardPage` renderiza
- THEN `SnackSuggestionCard` se monta con las sugerencias
- AND la card muestra el header "Ideas para la colación"

#### Scenario: Card no visible para bebé de 8 meses

- GIVEN bebé de 8 meses (no tiene snacks)
- WHEN `DashboardPage` renderiza
- THEN `SnackSuggestionCard` no se monta

---

### REQ-B3

La card SHALL mostrar los 5 alimentos con icono, nombre, foodGroup, y opción de "Ver detalle" que abre `FoodSearchModal`. NO permite "Agregar directamente al plato" (las colaciones son registros del diario, no del plate builder).

#### Scenario: Click en sugerencia abre detalle

- GIVEN `SnackSuggestionCard` renderizada
- WHEN el usuario clickea "Ver detalle" en "Yogur natural"
- THEN `FoodSearchModal` se abre con el detalle del yogur

---

### Out of scope — Capability B

- Tracking de snacks consumidos (queda cubierto por la bitácora de comidas existente)
- Sugerencias de snacks específicas por hora (mañana vs tarde)
- Recetas de snacks (es comida, no receta)
- Snacks para 24m+ (out of scope, el cambio es 10-23m)

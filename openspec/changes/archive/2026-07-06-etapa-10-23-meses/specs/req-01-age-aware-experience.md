# Spec: Age-Aware Experience (Bloque 0)

> **Why**: ver `proposal.md` §3.7 y `analysis-10-23-months.md` §4 Bloque 0. La app actualmente muestra slots hardcoded (3 comidas + 1 snack fijo), un TextureGuideCard sin granularidad para 12m+, sin stage tips, sin educación de alimentación perceptiva, y sin recordatorio de agua. Para bebés 10–23m esto oculta el cambio de distribución de comidas (1–2 colaciones) y la progresión de texturas.
>
> **Bloque**: 0 — UI pura, sin schema migration, sin data nueva. Source: `getMealSlotsForAge()` en `packages/shared/src/constants/dashboard.ts`.

---

## Capability A: Age-Aware Meal Slots (NEW)

Una sola fuente de verdad calcula los slots de comida según la edad del bebé. Todos los consumidores (dashboard, menú semanal, bitácora, today-logs) usan esta función.

### REQ-A1

`getMealSlotsForAge(months)` SHALL devolver un array de `MealSlotDef` ordenado cronológicamente por hora del día:

- `months < 10` → `[BREAKFAST, LUNCH, DINNER]`
- `10 <= months < 13` → `[BREAKFAST, LUNCH, DINNER, SNACK_1]`
- `months >= 13` → `[BREAKFAST, SNACK_1, LUNCH, SNACK_2, DINNER]`

(Orden cronológico: SNACK_1 después de BREAKFAST = colación de media mañana; SNACK_2 después de LUNCH = colación de tarde.)

#### Scenario: Bebé de 8 meses ve 3 slots

- GIVEN que el bebé tiene `ageInMonths = 8`
- WHEN `getMealSlotsForAge(8)` se ejecuta
- THEN retorna `[{ key: 'BREAKFAST', ...}, { key: 'LUNCH', ...}, { key: 'DINNER', ...}]`

#### Scenario: Bebé de 10 meses ve 4 slots con SNACK_1

- GIVEN que el bebé tiene `ageInMonths = 10`
- WHEN `getMealSlotsForAge(10)` se ejecuta
- THEN retorna `[BREAKFAST, LUNCH, DINNER, SNACK_1]` en ese orden

#### Scenario: Bebé de 15 meses ve 5 slots con SNACK_1 y SNACK_2

- GIVEN que el bebé tiene `ageInMonths = 15`
- WHEN `getMealSlotsForAge(15)` se ejecuta
- THEN retorna `[BREAKFAST, SNACK_1, LUNCH, SNACK_2, DINNER]` en ese orden

#### Scenario: Edad negativa o cero cae al primer caso

- GIVEN que `ageInMonths = 0` o negativo (recién nacido o fecha futura)
- WHEN `getMealSlotsForAge(0)` se ejecuta
- THEN retorna `[BREAKFAST, LUNCH, DINNER]` (no rompe)

---

### REQ-A2

`DASHBOARD_MEAL_SLOTS` SHALL ser reemplazado por un getter que llama a `getMealSlotsForAge(currentBabyAgeMonths)`. El label visible SHALL ser **"Comida"** (no "Almuerzo") en español rioplatense/latinoamericano neutro.

#### Scenario: Dashboard usa slots age-aware

- GIVEN que el bebé tiene 14 meses y `selectedDate = "2026-06-18"`
- WHEN `DashboardPage` renderiza TodayLogsCard
- THEN muestra 5 cards de comida en este orden: Desayuno, Colación 1, Comida, Colación 2, Cena
- AND cada card muestra la label local ("Desayuno", "Comida", "Cena", "Colación 1", "Colación 2")

#### Scenario: Terminología consistente con MenuWeekPage

- GIVEN `MenuWeekPage` con bebé de 14 meses
- WHEN renderiza los slots de comida
- THEN la label para `LUNCH` es **"Comida"** (mismo string que en dashboard)

---

### REQ-A3

`MenuWeekPage.MEALS` SHALL ser age-aware. Aplica la misma función `getMealSlotsForAge()` y extiende el array de slots.

#### Scenario: MenuWeekPage de bebé 11 meses incluye SNACK_1

- GIVEN bebé de 11 meses
- WHEN el usuario abre `/menus`
- THEN la grilla del menú semanal muestra 4 columnas por día: Desayuno, Comida, Cena, Colación
- AND el padre puede arrastrar alimentos a cada slot

#### Scenario: MenuWeekPage de bebé 8 meses no muestra snacks

- GIVEN bebé de 8 meses
- WHEN el usuario abre `/menus`
- THEN la grilla muestra solo 3 columnas: Desayuno, Comida, Cena

---

### REQ-A4

`DiaryPage` SHALL ordenar el timeline de comidas del día usando `getMealSlotsForAge()`. Si el bebé tiene 15 meses y solo se logueó Desayuno y Cena, los slots faltantes (SNACK_1, LUNCH, SNACK_2) aparecen como "Sin registro" en el orden cronológico.

#### Scenario: Timeline de bitácora con gaps visibles

- GIVEN bebé de 15 meses con `selectedDate = "2026-06-18"`
- AND solo existen logs de Desayuno y Cena
- WHEN `DiaryPage` renderiza
- THEN muestra en orden: Desayuno, [Colación 1 — Sin registro], Comida, [Colación 2 — Sin registro], Cena

---

### Out of scope — Capability A

- Reordenar slots por hora (sigue siendo orden semántico: desayuno/comida/cena)
- Configuración manual del orden de slots por el usuario
- Slots custom (e.g. "merienda" en lugar de "colación")
- Cambio retroactivo de logs viejos (los logs existentes no se modifican)

---

## Capability B: Stage Transition UX (NEW)

Cuando el bebé cruza una etapa (6→10m o 12→13m), el dashboard muestra un banner descartable que comunica el cambio.

### REQ-B1

`useStageTransition(currentAgeMonths)` SHALL detectar cruces de etapa. La edad en meses se computa al mount del dashboard desde `birthDate` del `BabyProfile`. La transición se considera "ocurrida" cuando `currentAgeMonths >= 10 && lastSeenAgeMonths < 10` o `currentAgeMonths >= 13 && lastSeenAgeMonths < 13`.

#### Scenario: Detectar cruce a 10m en sesión nueva

- GIVEN bebé con `birthDate = "2025-08-01"`, `currentDate = "2026-06-18"`, último `lastSeenAgeMonths = 9` (guardado en localStorage)
- WHEN `useStageTransition(10)` corre al mount
- THEN retorna `{ transition: 'TO_TEN_TWELVE', dismissed: false }`

#### Scenario: No disparar si ya está dismissed

- GIVEN que el usuario descartó el banner en la sesión anterior (`localStorage['pakulab:stageTransition:10_12'] = 'dismissed'`)
- WHEN `useStageTransition(10)` corre
- THEN retorna `{ transition: 'TO_TEN_TWELVE', dismissed: true }` y el banner no renderiza

#### Scenario: No disparar si no hubo cruce

- GIVEN bebé de 14 meses, `lastSeenAgeMonths = 14`
- WHEN `useStageTransition(14)` corre
- THEN retorna `{ transition: null, dismissed: false }` y el banner no renderiza

---

### REQ-B2

`StageTransitionBanner.vue` SHALL renderizar dentro del `DashboardPage`, arriba de los cards, solo cuando `useStageTransition` retorna `transition != null && !dismissed`.

El banner SHALL incluir:

- Icono (🎉 o equivalente del design system)
- Copy contextual: "Tu bebé entró a la nueva etapa (X meses). Ahora tiene [slots de comida] al día."
- CTA primario: "Ver guía de texturas" → smooth-scroll a `TextureGuideCard` y la expande si está colapsada
- CTA secundario: "No mostrar de nuevo" → marca el flag de la etapa como dismissed en localStorage

#### Scenario: Banner visible al cruzar a 10m

- GIVEN bebé de 10 meses sin banner dismissed en localStorage
- WHEN `DashboardPage` monta
- THEN el banner es visible arriba de los cards
- AND el copy dice: "Tu bebé entró a la **nueva etapa** (10 meses). Ahora tiene **desayuno + comida + cena + 1 colación** al día."

#### Scenario: Click en "No mostrar de nuevo" oculta el banner

- GIVEN banner visible
- WHEN el usuario clickea "No mostrar de nuevo"
- THEN `localStorage['pakulab:stageTransition:10_12']` se setea a `'dismissed'`
- AND el banner desaparece de la UI

#### Scenario: Click en "Ver guía de texturas" scrollea y expande

- GIVEN banner visible y `TextureGuideCard` colapsada (si está colapsable) o scrolled fuera de viewport
- WHEN el usuario clickea "Ver guía de texturas"
- THEN el viewport scrollea a la card de texturas
- AND si está colapsable, se expande automáticamente

---

### Out of scope — Capability B

- Persistir el flag de "no mostrar de nuevo" en el perfil del bebé (es localStorage por ahora)
- Disparar el banner por otros motivos (cumpleaños del bebé, hitos clínicos, etc.)
- Banner para el cruce 9→10m inverso (el bebé es cada vez más grande)
- Animaciones de confeti u otras celebraciones

---

## Capability C: Texture Guide Stage Split (MODIFIED)

`TextureGuideCard` actualmente agrupa todo 12+m en una sola etapa. Se separa en 10–12m, 13–17m, 18–23m con copy específica.

### REQ-C1

`TextureGuideCard` SHALL renderizar 4 etapas en vez de 3: 6m, 7–9m, 10–12m, 13–17m, 18–23m (5 si contamos 6m).

#### Scenario: Card muestra 5 etapas para bebé de 14m

- GIVEN bebé de 14 meses
- WHEN `TextureGuideCard` renderiza
- THEN muestra tabs/secciones para 6m, 7-9m, 10-12m, 13-17m, 18-23m
- AND la etapa actual (13-17m) está visualmente marcada como "actual"

#### Scenario: Bebé de 8m ve solo 6m y 7-9m

- GIVEN bebé de 8 meses
- WHEN `TextureGuideCard` renderiza
- THEN las etapas 10-12m, 13-17m, 18-23m se muestran pero con label "Próximamente" o estilo atenuado
- AND la etapa actual (7-9m) está marcada

---

### Out of scope — Capability C

- Cambiar el contenido de la etapa 6-9m (queda como está)
- Agregar texturas nuevas (mantener el set actual)
- Internacionalización (sigue siendo solo español)

---

## Capability D: Stage Tips Rotation (NEW)

Card "Tip de la etapa" en el dashboard que rota aleatoriamente entre tips curados para la edad actual. Patrón idéntico a `BALANCE_TIPS`.

### REQ-D1

`STAGE_TIPS` SHALL ser un `Record<AgeStage, readonly string[]>` con al menos 4 tips por etapa (6-9m, 10-12m, 13-17m, 18-23m). Los tips SHALL ser copys curados que respeten AD-02 (la app sugiere, no prescribe) y que cubran temas de la guía PDF (porciones, alérgenos, técnica de cuchara, agua, sal, etc.).

#### Scenario: useStageTip devuelve tip de la etapa correcta

- GIVEN bebé de 11 meses
- WHEN `useStageTip(11)` se ejecuta
- THEN retorna un string del array `STAGE_TIPS.TEN_TO_TWELVE_MONTHS` (no de otra etapa)

#### Scenario: Tip rota entre renders

- GIVEN múltiples renders del dashboard para el mismo bebé
- WHEN se llama `useStageTip(11)` consecutivamente sin cambio de edad
- THEN cada llamada puede devolver un tip distinto (random dentro del array)
- AND un tip no se repite en la misma sesión (no immediate repeat)

---

### REQ-D2

El card "Tip de la etapa" SHALL renderizar el tip en el dashboard, debajo de la card de balance, con icono contextual y label "Tip para [etapa]".

#### Scenario: Card visible en dashboard

- GIVEN bebé de 12 meses
- WHEN `DashboardPage` renderiza
- THEN un card "Tip para 10–12 meses" aparece con uno de los tips de `STAGE_TIPS.TEN_TO_TWELVE_MONTHS`

---

### Out of scope — Capability D

- Personalización de tips por el usuario
- Tips de otras fuentes (blog, redes sociales)
- Tips en otros idiomas

---

## Capability E: Perceptive Feeding Card (NEW)

Card fija colapsable en el dashboard con los 5 principios de alimentación perceptiva (OMS), contextualizados a 10–23m.

### REQ-E1

`PerceptiveFeedingCard.vue` SHALL renderizar un card colapsable en el dashboard con los 5 principios:

1. Reconocer las señales de hambre y saciedad del bebé
2. Alimentar al bebé con paciencia, sin forzarlo
3. Ofrecer variedad de alimentos apropiados para la edad
4. No usar la comida como premio o castigo
5. Crear un ambiente positivo y sin distracciones durante la comida

#### Scenario: Card colapsada por defecto en mobile

- GIVEN viewport mobile (≤767px) y bebé de 11 meses
- WHEN `DashboardPage` renderiza
- THEN `PerceptiveFeedingCard` muestra solo el header (icono + título)
- AND el body (5 principios) está oculto

#### Scenario: Click expande el body

- GIVEN card colapsada
- WHEN el usuario clickea el header
- THEN el body se expande con los 5 principios listados
- AND un click adicional lo colapsa

#### Scenario: Body persiste expandido en la sesión

- GIVEN card expandida en la sesión
- WHEN el usuario navega a otra tab y vuelve
- THEN el card sigue expandido (en la misma sesión, no se persiste entre días)

---

### Out of scope — Capability E

- Editar los principios (son fijos desde la fuente OMS)
- Versión en otros idiomas
- Vincular cada principio a alimentos o recetas
- Tracking de cuál principio aplicó el padre

---

## Capability F: Water Reminder (NEW)

`AddMealModal` muestra un recordatorio contextual sobre cómo ofrecer agua al bebé.

### REQ-F1

`AddMealModal` SHALL mostrar un recordatorio no-bloqueante sobre agua cuando se confirma una comida. El copy SHALL mencionar explícitamente:

- Ofrecer agua en **vaso abierto** o con **popote** (NO mamila, NO vaso entrenador, NO vaso 360°)
- Ofrecer después de los alimentos, no durante (orden: leche → alimentos → agua)
- No reemplazar la leche con agua

#### Scenario: Recordatorio visible al confirmar comida

- GIVEN `AddMealModal` abierto para registrar una comida
- WHEN el usuario confirma la comida
- THEN un panel de recordatorio aparece con título "💧 Sobre el agua" y el copy de la guía
- AND el panel es cerrable con X pero NO bloquea el guardado

#### Scenario: Panel de agua persiste entre comidas

- GIVEN el panel ya fue visto en la sesión actual
- WHEN se registra una segunda comida
- THEN el panel NO vuelve a aparecer automáticamente (solo se muestra una vez por sesión, configurable para el usuario)

---

### Out of scope — Capability F

- Tracking de cuánta agua se ofrece
- Validar que el bebé toma suficiente agua
- Notificaciones push para recordar agua
- Configuración de qué vaso usa el padre (mamila/popote)

---

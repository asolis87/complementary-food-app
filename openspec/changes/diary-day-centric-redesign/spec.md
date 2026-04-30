# Spec: diary-day-centric-redesign

> **Why**: ver `proposal.md` — reacciones digestivas/cutáneas son fenómenos de día, no de comida puntual.
> **Decisions locked**: D1–D9 (no se redebaten aquí).

---

## Capability A: Meal Entry Reactions (MODIFIED)

Restringe la reacción de una comida a aceptación pura. Elimina los valores clínicamente incorrectos del nivel comida.

### REQ-A1

El sistema MUST aceptar únicamente los valores `LIKED | DISLIKED | NEUTRAL | REJECTED` como `ReactionType` válido en un `FoodLog`.

#### Scenario: Registrar reacción válida

- GIVEN que existe un `FoodLog` para el bebé "Tomás" el 2025-06-10
- WHEN el usuario elige la reacción `LIKED`
- THEN el sistema guarda `reaction = LIKED` sin error

#### Scenario: Reacción con valor prohibido rechazada

- GIVEN que la API recibe un payload `{ reaction: "ALLERGIC" }` para un `FoodLog`
- WHEN se procesa la solicitud
- THEN el sistema devuelve HTTP 422 y no persiste el valor

---

### REQ-A2

El usuario MUST poder limpiar la reacción de una comida (establecerla en `null`).

#### Scenario: Limpiar reacción existente

- GIVEN que un `FoodLog` tiene `reaction = DISLIKED`
- WHEN el usuario selecciona "sin reacción" en el modal de edición
- THEN el sistema persiste `reaction = null` y la comida aparece sin indicador de reacción en la UI

#### Scenario: Limpiar reacción ya nula (idempotente)

- GIVEN que un `FoodLog` tiene `reaction = null`
- WHEN el usuario confirma sin seleccionar reacción
- THEN el sistema persiste `reaction = null` sin error

---

### REQ-A3

La migración MUST nullificar cualquier `FoodLog` existente cuya `reaction` sea `ALLERGIC`, `GAS` o `RASH`.

#### Scenario: Migración nulea valores obsoletos

- GIVEN que existe un `FoodLog` con `reaction = ALLERGIC` antes de ejecutar la migración
- WHEN se aplica la migration de base de datos
- THEN ese `FoodLog` queda con `reaction = null`

#### Scenario: Migración preserva valores válidos

- GIVEN que existe un `FoodLog` con `reaction = LIKED` antes de ejecutar la migración
- WHEN se aplica la migration
- THEN ese `FoodLog` mantiene `reaction = LIKED` sin cambios

---

### Out of scope — Capability A

- Historial de auditoría de reacciones anteriores.
- UI de confirmación para valores migrados a null.
- Reacciones a nivel ingrediente.

---

## Capability B: Day Observations (NEW)

Nueva entidad `DayObservation` que captura el estado digestivo/cutáneo del bebé para un día completo.

### REQ-B1

El sistema MUST garantizar que existe a lo sumo una `DayObservation` por `(babyProfileId, date)`.

#### Scenario: Crear observación del día

- GIVEN que no existe `DayObservation` para el bebé "Tomás" el 2025-06-10
- WHEN se envía `PUT /api/day-observation` con `{ babyProfileId, date: "2025-06-10", stool: "NORMAL", symptoms: [], notes: null }`
- THEN el sistema crea la observación y responde HTTP 200 con la entidad creada

#### Scenario: Segunda operación upsert en el mismo día

- GIVEN que ya existe `DayObservation` para el bebé "Tomás" el 2025-06-10 con `stool: "LOOSE"`
- WHEN se envía `PUT /api/day-observation` con `{ babyProfileId, date: "2025-06-10", stool: "NORMAL" }`
- THEN el sistema actualiza la observación existente (no crea duplicado) y responde HTTP 200

---

### REQ-B2

La `DayObservation` MUST aceptar los campos: `stool` (single-select, opcional), `symptoms` (array, opcional), `notes` (texto libre, opcional). Todos los campos son opcionales — una observación puede guardarse vacía.

Valores válidos:
- `stool`: `NORMAL | LOOSE | HARD | NONE`
- `symptoms`: array de `ALLERGY_SUSPECT | RASH | GAS | VOMITING | FEVER` (enum `SymptomType`, diseño finalizado)

#### Scenario: Guardar observación completa

- GIVEN que el usuario ingresa `stool: "LOOSE"`, `symptoms: ["RASH", "GAS"]`, `notes: "Comió kiwi por primera vez"`
- WHEN se confirma la observación
- THEN el sistema persiste los tres campos y los devuelve íntegros en la respuesta

#### Scenario: Guardar observación vacía

- GIVEN que el usuario abre el sheet de observación y confirma sin completar ningún campo
- WHEN se envía la solicitud
- THEN el sistema persiste `{ stool: null, symptoms: [], notes: null }` sin error

---

### REQ-B3

El array `symptoms` MUST ser deduplicado y MUST NOT superar 10 elementos.

#### Scenario: Deduplicación de síntomas

- GIVEN un payload con `symptoms: ["RASH", "GAS", "RASH"]`
- WHEN el sistema procesa la solicitud
- THEN persiste `symptoms: ["RASH", "GAS"]` (sin duplicados)

#### Scenario: Límite de síntomas excedido

- GIVEN un payload con 11 valores distintos en `symptoms`
- WHEN se procesa la solicitud
- THEN el sistema devuelve HTTP 422 con mensaje de validación

---

### REQ-B4

El usuario MUST poder eliminar la `DayObservation` de un día.

#### Scenario: Eliminar observación existente

- GIVEN que existe `DayObservation` para el bebé "Tomás" el 2025-06-10
- WHEN se envía `DELETE /api/day-observation?babyProfileId=X&date=2025-06-10`
- THEN el sistema elimina el registro y responde HTTP 204

#### Scenario: Eliminar observación inexistente

- GIVEN que no existe `DayObservation` para el bebé "Tomás" el 2025-06-15
- WHEN se envía `DELETE /api/day-observation?babyProfileId=X&date=2025-06-15`
- THEN el sistema responde HTTP 404

---

### REQ-B5

> **Decisión de diseño aceptada**: La observación del día NO se incluye en la respuesta de `GET /api/diary`. El cliente web obtiene la observación en paralelo vía `GET /api/day-observation`, usando `Promise.all` en el store. Esta es una desviación deliberada del contrato original — se documenta aquí para que futuros consumidores de la API no dependan de un campo `observation` en `GET /api/diary`.

El cliente MUST obtener la `DayObservation` del día mediante una llamada paralela al endpoint dedicado, no enriqueciendo el endpoint de bitácora diaria.

**Motivación**: mantener cada endpoint con responsabilidad única simplifica el caché, evita joins adicionales en `GET /api/diary` y permite que la observación sea consultada independientemente.

#### Scenario: Cliente obtiene logs y observación en paralelo

- GIVEN que el bebé "Tomás" tiene 3 comidas y una `DayObservation` el 2025-06-10
- WHEN el cliente llama `Promise.all([GET /api/diary?date=2025-06-10&babyProfileId=X, GET /api/day-observation?date=2025-06-10&babyProfileId=X])`
- THEN la primera respuesta contiene `{ data: [...3 comidas], meta }` y la segunda contiene `{ data: { stool, symptoms, notes } }`

#### Scenario: Cliente obtiene logs y ausencia de observación en paralelo

- GIVEN que el bebé "Tomás" tiene comidas pero no `DayObservation` el 2025-06-11
- WHEN el cliente llama en paralelo ambos endpoints
- THEN `GET /api/diary` retorna las comidas y `GET /api/day-observation` retorna `{ data: null }`

#### Contrato de `GET /api/diary` (real)

La respuesta es `{ data: FoodLog[], meta: { date, babyProfileId } }`. El campo `observation` no existe en este endpoint.

---

### Out of scope — Capability B

- Histórico de cambios / versiones de la observación.
- Severidad o timestamp por síntoma.
- Adjuntar fotos a la observación.
- Notificaciones para recordar registrar la observación.

---

## Capability C: Diary Export to PDF (NEW)

El usuario puede generar un PDF del día o de la semana directamente en el dispositivo, sin procesamiento en servidor.

### REQ-C1

El sistema MUST permitir exportar la bitácora de un día específico a PDF, incluyendo: header con nombre y fecha de nacimiento del bebé, fecha del día, lista de comidas con reacción y notas por comida, observación del día (stool, síntomas, notas) si existe, y footer con disclaimer de uso clínico.

#### Scenario: Exportar día con datos completos

- GIVEN que el bebé "Tomás" tiene 3 comidas con reacciones y una observación el 2025-06-10
- WHEN el usuario toca "Exportar este día"
- THEN el navegador descarga un archivo `bitacora-tomas-2025-06-10.pdf` que contiene todas las secciones definidas

#### Scenario: Exportar día sin observación

- GIVEN que el bebé "Tomás" tiene comidas pero no registró observación el 2025-06-11
- WHEN el usuario toca "Exportar este día"
- THEN el PDF se genera sin la sección de observación (o con la sección vacía marcada como "Sin registrar") y la descarga ocurre sin error

---

### REQ-C2

El sistema MUST permitir exportar un rango de 7 días a PDF. El PDF MUST incluir cada día como sección separada; los días sin registros SHOULD incluirse como "Sin registros" (no omitirse).

#### Scenario: Exportar semana con todos los días con datos

- GIVEN que la semana 2025-06-09 a 2025-06-15 tiene datos en los 7 días
- WHEN el usuario toca "Exportar esta semana"
- THEN el PDF contiene 7 secciones de día en orden cronológico

#### Scenario: Exportar semana con días vacíos

- GIVEN que la semana 2025-06-09 a 2025-06-15 solo tiene datos en 3 días
- WHEN el usuario toca "Exportar esta semana"
- THEN el PDF contiene 7 secciones; los 4 días sin datos muestran "Sin registros"

---

### REQ-C3

La generación del PDF MUST ocurrir completamente en el cliente. El sistema MUST NOT enviar contenido del PDF al servidor ni almacenarlo en ningún backend.

#### Scenario: Export sin conexión a internet

- GIVEN que el dispositivo pierde conectividad después de cargar la pantalla del día
- WHEN el usuario toca "Exportar este día" (datos ya en memoria)
- THEN el PDF se genera y descarga sin realizar llamadas de red adicionales

#### Scenario: No queda rastro en el servidor

- GIVEN que se exporta un PDF de la semana
- WHEN se revisan los logs del servidor
- THEN no hay ningún endpoint de generación PDF invocado; solo el `GET /api/diary/range` de carga de datos

---

### REQ-C4

El layout del PDF MUST ser A4 portrait, con layout plano (sin `position: fixed/sticky`, sin `transform`), fuentes del sistema, pensado para legibilidad en impresión.

#### Scenario: PDF renderiza sin artefactos en iOS Safari

- GIVEN que el usuario exporta desde un iPhone con Safari
- WHEN `html2canvas` captura el template DOM off-screen
- THEN el PDF resultante no contiene artefactos visuales ni secciones cortadas

#### Scenario: PDF con iconos de síntomas

- GIVEN que la observación tiene `symptoms: ["RASH", "GAS"]`
- WHEN se genera el PDF
- THEN los síntomas se representan con emojis Unicode o PNGs embebidos (no SVG inline)

---

### Out of scope — Capability C

- Generación de PDF en el servidor (sin PDF rendering backend).
- Compartir el PDF por link público o cloud.
- Exportar rangos de más de 7 días.
- Historial de PDFs exportados.
- Internacionalización del PDF (sale en español).

---

## Capability D: Suspected Food Signal (MODIFIED)

La señal "alimento sospechoso" se deriva de `DayObservation`, no de `FoodLog.reaction`.

### REQ-D1

El sistema MUST derivar el flag `hasSuspectedReaction` para un alimento de la siguiente regla: un alimento en un día dado es sospechoso si existe una `DayObservation` para el mismo `(babyProfileId, date)` cuyo array `symptoms` contiene `ALLERGY_SUSPECT` o `RASH`.

#### Scenario: Alimento sospechoso por observación del día

- GIVEN que el bebé "Tomás" comió "Kiwi" el 2025-06-10 y tiene `DayObservation.symptoms = ["RASH"]` ese día
- WHEN se consulta el historial de alimentos para "Kiwi"
- THEN el registro del 2025-06-10 tiene `hasSuspectedReaction = true`

#### Scenario: Alimento no sospechoso — síntoma no relevante

- GIVEN que el bebé "Tomás" comió "Banana" el 2025-06-11 y tiene `DayObservation.symptoms = ["GAS"]` ese día
- WHEN se consulta el historial de alimentos para "Banana"
- THEN el registro del 2025-06-11 tiene `hasSuspectedReaction = false` (GAS no activa la señal)

---

### REQ-D2

El sistema MUST NOT usar el valor de `FoodLog.reaction` para derivar `hasSuspectedReaction`. Los valores `ALLERGIC | GAS | RASH` ya no existen en `ReactionType`.

#### Scenario: Ningún FoodLog activa sospecha por sí solo

- GIVEN que el bebé "Tomás" comió "Mango" el 2025-06-12 con `reaction = DISLIKED` y no tiene `DayObservation` ese día
- WHEN se consulta el historial de alimentos para "Mango"
- THEN el registro del 2025-06-12 tiene `hasSuspectedReaction = false`

#### Scenario: Día sin observación no genera sospecha

- GIVEN que el bebé "Tomás" comió "Frutilla" el 2025-06-13 y no existe `DayObservation` para ese día
- WHEN se calcula `hasSuspectedReaction`
- THEN el resultado es `false`

---

### REQ-D3

El plate builder MUST consumir el campo `hasSuspectedReaction` (renombrado desde `hasAllergyReaction`). El nombre `hasAllergyReaction` MUST NOT aparecer en ningún módulo tras esta change.

#### Scenario: Plate builder recibe flag correcto

- GIVEN que `aggregateFoodHistory` devuelve `{ foodId: "kiwi", hasSuspectedReaction: true }`
- WHEN el plate builder renderiza el alimento
- THEN muestra el indicador visual de sospecha usando el campo `hasSuspectedReaction`

#### Scenario: Nombre legacy ausente en codebase

- GIVEN que se aplica la change completa
- WHEN se busca `hasAllergyReaction` en el código fuente
- THEN no aparece ninguna ocurrencia (ni en tipos, ni en utils, ni en UI)

---

### Out of scope — Capability D

- Severidad de la sospecha (no hay escala).
- Notificación al usuario cuando un alimento se vuelve sospechoso.
- Señal de sospecha en el catálogo global de alimentos.

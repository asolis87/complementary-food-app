# Proposal: diary-day-centric-redesign

## 1. Why

La bitácora de hoy no le sirve al padre ni al pediatra. Como solo se introduce **un alimento nuevo por día**, las reacciones reales (gases, sarpullidos, deposiciones raras) se observan a lo largo del día — no en una comida puntual. Hoy le pedimos al padre que clasifique cada comida con `ALLERGIC | GAS | RASH`, lo que es clínicamente incorrecto y genera datos engañosos. Además no hay una vista consolidada del día ni forma de mandarle al pediatra el resumen por WhatsApp.

## 2. Goals

- Mover las observaciones digestivas/cutáneas del nivel **comida** al nivel **día**.
- Que la pestaña Bitácora muestre un resumen del día con todo lo que un pediatra querría ver (alimentos ofrecidos, aceptación, deposiciones, síntomas, notas).
- Permitir exportar el día o la semana a PDF desde el dispositivo, sin backend, listo para compartir.
- Limpiar el modelo: la "reacción" en una comida vuelve a ser solo aceptación.

## 3. Non-goals

- No se construye sistema de notificaciones ni recordatorios.
- No se permite adjuntar fotos a la observación del día.
- No se implementa compartir por link / cloud / nube — el PDF se genera y queda en el dispositivo.
- No se cambia el flujo de armado de plato ni el catálogo de alimentos.
- No se introduce vista calendario mensual ni gráficos longitudinales.

## 4. Approach summary

- Nueva entidad **`DayObservation`** (tabla Prisma) con `(babyProfileId, date)` único, que guarda deposición, síntomas y nota del día.
- **Recortar `ReactionType`** a `LIKED | DISLIKED | NEUTRAL | REJECTED` — reacción = aceptación, nada más. Eliminar `ALLERGIC | GAS | RASH`.
- Rediseñar `DiaryPage.vue` in-place: el card-resumen del día crece para incluir el bloque de observación + nota, con CTA propio para registrarla. El FAB sigue siendo para agregar comidas.
- **Export PDF cliente** (día y semana) usando `jspdf` + `html2canvas` (ya instalado), renderizando un template DOM off-screen pensado para impresión A4.
- Nuevo endpoint `GET /api/diary/range?from=&to=` para alimentar el export semanal con `{ logs, observations }`.

## 5. Decisions

### D1 — DayObservation: tabla Prisma separada con `(babyProfileId, date)` único
**Acepto la recomendación.** Es la opción normalizada, encaja con screaming architecture (entidad de dominio nueva), y deja queryable cada campo. El costo de una tabla extra es trivial frente a meter un JSON sucio en `FoodLog`.

### D2 — Stool: enum single-select `NORMAL | LOOSE | HARD | NONE`
**Acepto.** Clínicamente el día tiene un patrón dominante; multi-select complica la UI sin aportar señal real. Si en el futuro aparece la necesidad de "tuvo dos tipos en el día", se migra a array sin romper consumidores.

### D3 — Symptoms: PostgreSQL `String[]` de enum
**Acepto.** Para MVP es lo correcto: simple, indexable con GIN si hace falta, sin tabla join prematura. El enum vive en Prisma (`SymptomType`) y en el shared types. Si crece el dominio (severidad, duración, hora) se promueve a entidad.

### D4 — ReactionType: migración rompedora
**Acepto.** Pre-launch, casi cero data real. Se hace un único migration: `ALTER TYPE` para crear el enum nuevo, `UPDATE` para nullear filas con valores obsoletos, drop del enum viejo. Más limpio que arrastrar valores deprecados ocultos en UI.

### D5 — `hasAllergyReaction` → derivar (Opción β)
**Acepto Opción β con un matiz.** Derivar el "alimento sospechoso" cruzando `FoodLog` con `DayObservation` del mismo día (síntomas que contengan `RASH` o `ALLERGY_SUSPECT`) es lo correcto: no carga UI extra al padre, no agrega columna, y refleja el modelo mental real ("ese día comió X y le salió sarpullido"). El matiz: esto se resuelve en `aggregateFoodHistory` con un join/lookup por `(babyProfileId, date)`; la design phase debe definir si se hace en SQL o en memoria — dado el volumen esperado por bebé (~cientos de FoodLogs en 6 meses), in-memory es aceptable. El campo de salida pasa a llamarse `hasSuspectedReaction` para reflejar la semántica nueva.

### D6 — Layout: rediseño in-place de `DiaryPage.vue`, sin sub-ruta
**Acepto.** Una sub-ruta `/diary/:date` agregaría navegación sin valor — el chip selector ya cumple esa función. El card-resumen incorpora el bloque de observación y una sección expandible "Detalle del día" que sirve también como template visual del export. Segundo CTA en el card: "Registrar observación del día" (bottom sheet).

### D7 — Export: día y semana
**Acepto.** Día reusa `GET /api/diary?date=` + nuevo `GET /api/day-observation?date=`. Semana requiere `GET /api/diary/range?from=&to=` que devuelve `{ logs, observations }` en una sola llamada — evita N+1 round trips desde el cliente.

### D8 — PDF: `jspdf` + `html2canvas`
**Acepto con caveat de iOS Safari.** El template DOM off-screen debe ser **layout plano** (block, sin `position: fixed/sticky`, sin `transform`, fuentes del sistema, ancho A4 = 794px @ 96dpi). html2canvas en iOS rompe con SVG inline complejos: usar emojis Unicode o PNG embebidos para iconos de síntomas. La design phase fija el layout exacto.

### D9 — Cleanup: eliminar `Reaction` legacy de `packages/shared/src/types/user.ts`
**Acepto.** Es código muerto identificado en la exploración. Se borra junto a `REACTION_LABELS` y cualquier import huérfano.

## 6. Out-of-scope

- Notificaciones / reminders para registrar la observación.
- Fotos adjuntas a la observación o a comidas.
- Compartir el PDF vía link público o cloud storage.
- Sync de PDFs históricos en el backend.
- Vista mensual / gráficos de tendencias.
- Edición masiva multi-día.
- Modificar el catálogo de Food o el sistema de Plate.
- Internacionalización del PDF (sale en español, igual que la app).

## 7. Open questions for design phase

1. Superficie exacta de la API `DayObservation` (¿`PUT` idempotente por fecha o `POST/PATCH` separados?).
2. Layout final del PDF: paginación cuando un día tiene muchas comidas, header con datos del bebé, footer con disclaimer, tipografía.
3. Iconografía de síntomas: ¿emoji unicode, set de PNGs embebidos, o SVG inline (con riesgo iOS)?
4. Bottom sheet vs inline edit dentro del card para registrar observación — definir según patrón actual de la app.
5. Estrategia exacta de `hasSuspectedReaction`: in-memory join en `aggregateFoodHistory` vs query SQL con lateral join.
6. Si la semana tiene días sin data, ¿se incluyen como "sin registros" en el PDF o se omiten?
7. Migración Prisma: pasos concretos del SQL para `ALTER TYPE ReactionType` (PostgreSQL no permite drop directo de valores).
8. Validación Zod para `symptoms: SymptomType[]` — límite máximo, deduplicación.

## 8. Affected areas (ref `explore.md`)

- `prisma/schema.prisma` — nueva tabla `DayObservation`, recorte de `ReactionType`, nuevo enum `StoolType`, `SymptomType`.
- `prisma/migrations/` — migration breaking con SQL crudo para enum.
- `packages/shared/src/types/diary.ts` — tipos nuevos y enum recortado.
- `packages/shared/src/types/user.ts` — borrar `Reaction` legacy + `REACTION_LABELS`.
- `apps/api/src/modules/diary/diary.routes.ts` — endpoints CRUD `DayObservation` + `GET /api/diary/range`.
- `apps/api/src/modules/diary/diary.schemas.ts` — Zod nuevos.
- `apps/api/src/modules/diary/diary.utils.ts` — `aggregateFoodHistory` re-derivada, rename a `hasSuspectedReaction`.
- `apps/api/src/modules/diary/diary.utils.test.ts` — actualizar fixtures sin `ALLERGIC/GAS/RASH`.
- `apps/web/src/modules/diary/DiaryPage.vue` — rediseño card + sección detalle.
- `apps/web/src/modules/diary/components/AddMealModal.vue` — solo 4 reacciones (incluye `REJECTED`).
- `apps/web/src/modules/diary/components/EditLogModal.vue` — idem.
- `apps/web/src/modules/diary/components/DayObservationSheet.vue` — nuevo (bottom sheet).
- `apps/web/src/modules/diary/components/DayDetailSection.vue` — nuevo (consolidado + template export).
- `apps/web/src/modules/diary/export/` — nuevo módulo: `pdfTemplate.ts`, `exportDayPdf.ts`, `exportWeekPdf.ts`.
- `apps/web/src/shared/stores/diaryStore.ts` — estado y acciones para `DayObservation` + range fetch.
- `apps/web/package.json` — agregar `jspdf`.

## 9. Migration plan summary

1. Crear migration Prisma:
   - `CREATE TYPE StoolType`, `CREATE TYPE SymptomType`.
   - `ALTER TYPE ReactionType RENAME TO ReactionType_old`; crear nuevo `ReactionType` con `LIKED | DISLIKED | NEUTRAL | REJECTED`.
   - `ALTER TABLE FoodLog ALTER COLUMN reaction TYPE ReactionType USING ...` con `CASE` que mapea valores válidos y nulea `ALLERGIC | GAS | RASH`.
   - `DROP TYPE ReactionType_old`.
   - `CREATE TABLE DayObservation` con FK a `BabyProfile` y unique `(babyProfileId, date)`.
2. Regenerar Prisma client; actualizar shared types.
3. Actualizar API + tests.
4. Actualizar UI + nuevo módulo de export.
5. Borrar `Reaction` legacy de `user.ts`.

Pre-launch, sin data real → no hay backfill, no hay scripts de remediación.

## 10. Rollout

- POC pre-launch: ship en **un solo PR**, atómico (schema + API + UI + cleanup).
- Verificación manual: flujo de registrar comida con reacción nueva, registrar observación del día, exportar PDF día, exportar PDF semana.
- Tests: unit para `aggregateFoodHistory` re-derivada, unit para schemas Zod, e2e ligero del export es nice-to-have (no bloqueante).
- No feature flag — el cambio es la nueva normalidad del producto.

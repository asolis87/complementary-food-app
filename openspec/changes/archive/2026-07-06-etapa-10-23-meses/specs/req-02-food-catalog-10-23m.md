# Spec: Food Catalog 10–23m (Bloque 1)

> **Why**: ver `proposal.md` §2 Bloque 1 y `analysis-10-23-months.md` §4. El seed actual tiene solo 3 alimentos con `ageMonths: 10` y 3 con `ageMonths: 12`. Faltan alimentos clave de la etapa 10–23m que la guía clínica destaca (yogur natural, queso fresco, frijol, lenteja, garbanzo, hígado de pollo).
>
> **Bloque**: 1 — Data seed. Requiere validación clínica (todos los nuevos con `needsValidation: true`).

---

## Capability A: Seed Additions for 10–23m (NEW)

Se agregan al seed los alimentos clave de la etapa 10–23m.

### REQ-A1

El seed SHALL agregar los siguientes alimentos con `needsValidation: true`:

| Alimento | ageMonths | foodGroup | isAllergen | allergenType | warningTags |
|----------|-----------|-----------|------------|--------------|-------------|
| Yogur natural (sin azúcar) | 10 | DAIRY (o PROTEINS si DAIRY rechazado) | true | MILK | [] |
| Queso fresco (tipo ricotta, requesón) | 10 | DAIRY (o PROTEINS) | true | MILK | [] |
| Frijol negro cocido y machacado | 10 | PROTEINS | false | null | [] |
| Lenteja cocida | 10 | PROTEINS | false | null | [] |
| Garbanzo cocido (machacado o entero blando) | 12 | PROTEINS | false | null | [CHOKING_HAZARD_UNDER_5Y si entero] |
| Hígado de pollo cocido y desmenuzado | 10 | PROTEINS | false | null | [] |

#### Scenario: Seed ejecuta sin error

- GIVEN el archivo `prisma/seed.ts` actualizado
- WHEN se ejecuta `pnpm --filter api db:seed`
- THEN los 6 alimentos nuevos se insertan en `Food`
- AND cada uno tiene `needsValidation: true` en `Food` y `isAllergen` correcto

#### Scenario: Alimentos visibles en FoodSearchPage con badge de validación pendiente

- GIVEN el bebé es del usuario autenticado
- WHEN el usuario busca "yogur" en `/foods`
- THEN aparece "Yogur natural" en los resultados
- AND tiene un badge visible "Pendiente de validación clínica" (warning tag para el usuario)

#### Scenario: Alimentos con tag de choking no se sirven a bebés <12m

- GIVEN garbanzo entero con `warningTags: ['CHOKING_HAZARD_UNDER_5Y']`
- WHEN el usuario intenta agregar garbanzo a un bebé de 9 meses en FoodSearchModal
- THEN el modal muestra un warning visual (icono + tooltip)
- AND el alimento sigue siendo seleccionable (AD-02: el padre decide, la app sugiere)

---

### REQ-A2

Los nuevos alimentos SHALL tener `name` único en español, `category` apropiado (sólido, semisólido, etc.), y `preparationNotes` curado.

#### Scenario: Nombres únicos sin colisiones

- GIVEN los 6 alimentos nuevos
- WHEN se ejecuta el seed
- THEN el constraint unique de `Food.name` se respeta (no se duplican nombres)

#### Scenario: preparationNotes no vacíos

- GIVEN yogur natural agregado
- WHEN se inspecciona la fila
- THEN `preparationNotes` contiene al menos "Sin azúcar añadida. Servir natural."

---

### REQ-A3

Los alimentos de la etapa SHALL tener `isIronRich: true` cuando aplique (hígado de pollo, lenteja, frijol).

#### Scenario: Hígado marcado como iron-rich

- GIVEN hígado de pollo agregado
- WHEN se inspecciona la fila
- THEN `isIronRich: true`

#### Scenario: Yogur NO marcado como iron-rich

- GIVEN yogur natural agregado
- WHEN se inspecciona la fila
- THEN `isIronRich: false` (es fuente de calcio, no de hierro)

---

### Out of scope — Capability A

- Agregar más allá de estos 6 alimentos (siguiente iteración: salmón, atún, verduras adicionales)
- Modificar los 102 alimentos existentes
- Cambiar `needsValidation: true` en alimentos ya validados (decisión del nutriólogo)
- Internacionalización de los nombres

---

## Capability B: Seed Audit for 10–23m (NEW)

Auditoría del seed actual para identificar y backfillear `ageMonths` de alimentos que ya están en la base pero mal categorizados.

### REQ-B1

El seed SHALL backfillear `ageMonths` de alimentos existentes cuando estén mal categorizados. Lista inicial (verificable con el nutriólogo):

- Aguacate → `ageMonths: 6` (ya está)
- Mango → `ageMonths: 6` (verificar)
- Plátano → `ageMonths: 6` (verificar)

(La lista exacta se discute con el nutriólogo. Este spec exige que el seed tenga una sección explícita de "audit fixes" comentada, no silenciosa.)

#### Scenario: Audit fixes son visibles y revisables

- GIVEN el archivo `prisma/seed.ts` con sección `// 10-23M AUDIT FIXES`
- WHEN un revisor (humano o AI) abre el archivo
- THEN puede ver claramente qué alimentos existentes se modifican y por qué

---

### Out of scope — Capability B

- Cambiar `ageMonths` de alimentos ya validados sin consulta
- Agregar alimentos con `ageMonths: 18-23m` en este bloque (esperar validación de guía para esa etapa)
- Modificar alimentos marcados como `PROHIBITED_*` en `warningTags`

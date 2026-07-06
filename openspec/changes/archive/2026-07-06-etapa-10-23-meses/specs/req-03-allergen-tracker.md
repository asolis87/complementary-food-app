# Spec: Allergen Tracker (Bloques 2 + 4)

> **Why**: ver `proposal.md` §3.4 y `analysis-10-23-months.md` G5. La ruta `GET /api/allergens` es un stub que retorna `{ data: [], message: 'implementado en Fase 9' }`. La ventana de introducción de alérgenos cierra alrededor de los 10–12 meses. Sin tracker funcional, Pakulab no acompaña al padre en el momento crítico.
>
> **Bloque**: 2 (backend) + 4 (UI card). Tier: **PRO** — palanca de conversión.
>
> **Decisión arquitectónica**: el estado se DERIVA de `FoodLog` + `Food.isAllergen` + `Food.allergenType`. No se crea tabla nueva. Esto evita migración y mantiene el tracker "vivo" sin necesidad de sincronización.

---

## Capability A: Allergen Status Endpoint (NEW)

### REQ-A1

`GET /api/allergens/status?babyProfileId=X` SHALL devolver el estado de los 8 alérgenos prioritarios (Leche, Huevo, Soya, Trigo, Maní, Nueces, Pescado, Mariscos) para el bebé dado.

**Response shape**:

```ts
{
  data: {
    ageMonths: number,
    closingWindow: boolean, // true si ageMonths >= 10
    allergens: Array<{
      type: AllergenType,
      name: string,
      status: 'introduced' | 'pending' | 'in_window',
      introducedAt: ISODate | null,
      exposureCount: number,
      lastReaction: ReactionType | null
    }>
  }
}
```

#### Scenario: Bebé de 8 meses con 2 alérgenos introducidos

- GIVEN bebé "Tomás" con 8 meses
- AND FoodLogs previos: 3× "Huevo" (introducido), 1× "Leche" (introducido)
- WHEN `GET /api/allergens/status?babyProfileId=tomas`
- THEN retorna 8 alérgenos en `allergens`
- AND Huevo tiene `status: 'introduced'`, `exposureCount: 3`
- AND Leche tiene `status: 'introduced'`, `exposureCount: 1`
- AND los 6 restantes tienen `status: 'in_window'`, `exposureCount: 0`
- AND `closingWindow: false`

#### Scenario: Bebé de 11 meses sin Leche introducida → `pending` + `closingWindow: true`

- GIVEN bebé "Lucía" con 11 meses
- AND no hay FoodLogs de Leche
- WHEN `GET /api/allergens/status?babyProfileId=lucia`
- THEN Leche tiene `status: 'pending'` (no en ventana, ventana cerrándose)
- AND `closingWindow: true`

#### Scenario: Bebé de 14 meses con todo introducido → `introduced` para todos

- GIVEN bebé "Mateo" con 14 meses y los 8 alérgenos ya introducidos al menos 1 vez
- WHEN `GET /api/allergens/status?babyProfileId=mateo`
- THEN los 8 alérgenos tienen `status: 'introduced'`
- AND `closingWindow: true` (informativo, ya no aplica para esos)

---

### REQ-A2

`exposureCount` SHALL contar `FoodLog` únicos (por `Food.id`) que tengan `Food.isAllergen = true` y `Food.allergenType = X`. Un `FoodLog` con `reaction = REJECTED` SHALL NO contar como exposición exitosa (el bebé lo rechazó, no lo toleró).

#### Scenario: Rejection no cuenta como exposición

- GIVEN bebé "Ana" con 2 FoodLogs de "Maní"
- AND uno con `reaction = LIKED`, otro con `reaction = REJECTED`
- WHEN se consulta el status de Maní
- THEN `exposureCount: 1` (solo el LIKED)
- AND `status: 'in_window'` (no se considera introducido todavía)

#### Scenario: Múltiples exposures al mismo alimento

- GIVEN bebé "Ana" con 5 FoodLogs de "Huevo" en distintos días
- WHEN se consulta el status de Huevo
- THEN `exposureCount: 5`
- AND `introducedAt: <fecha del primer FoodLog>`

---

### REQ-A3

`status` SHALL calcularse así:

- `introduced`: `exposureCount >= 1 && lastReaction != REJECTED` (reaccionar LIKED, NEUTRAL o DISLIKED al menos una vez)
- `pending`: `ageMonths >= CLOSING_WINDOW_AGE_MONTHS` (10) && `status != 'introduced'`
- `in_window`: `ageMonths < 10` && `status != 'introduced'`

(El `CLOSING_WINDOW_AGE_MONTHS = 10` ya está configurado en `packages/shared/src/constants/allergen-age-thresholds.ts`.)

#### Scenario: Cálculo de status para todos los 8 alérgenos

- GIVEN bebé "Sofía" de 7 meses con exposures a Huevo y Leche
- WHEN se consulta el status completo
- THEN Huevo y Leche: `introduced`
- AND Pescado, Mariscos, Soya, Trigo, Maní, Nueces: `in_window`

---

### REQ-A4

El endpoint SHALL requerir tier **PRO**. Si el usuario es FREE, retorna HTTP 402 con `{ error: 'TIER_REQUIRED', upgradeUrl: '/billing' }`.

#### Scenario: Usuario FREE recibe 402

- GIVEN usuario con `subscriptionStatus = 'FREE'`
- WHEN `GET /api/allergens/status?babyProfileId=X`
- THEN HTTP 402 con `{ error: 'TIER_REQUIRED', upgradeUrl: '/billing' }`

#### Scenario: Usuario PRO recibe 200

- GIVEN usuario con `subscriptionStatus = 'PRO'`
- WHEN `GET /api/allergens/status?babyProfileId=X`
- THEN HTTP 200 con el payload completo

---

### Out of scope — Capability A

- Persistir el estado de alérgenos en una tabla nueva (se deriva siempre)
- Tracking de alergias diagnosticadas (es un feature distinto, scope: free tracker de introducciones)
- Exportar el estado de alérgenos a PDF
- Notificaciones push cuando un alérgeno entra en ventana por cerrar
- Recordatorios programados de "ofrecer X esta semana"

---

## Capability B: Allergen Tracker Card UI (NEW)

### REQ-B1

`AllergenTrackerCard.vue` SHALL renderizar en el dashboard solo si el bebé tiene `ageInMonths >= 6` (la ventana empieza a los 6m). Para bebés más jóvenes, la card NO se renderiza.

#### Scenario: Card no visible para bebé de 4 meses

- GIVEN bebé de 4 meses
- WHEN `DashboardPage` renderiza
- THEN `AllergenTrackerCard` no se monta (early return)

#### Scenario: Card visible para bebé de 8 meses

- GIVEN bebé de 8 meses
- WHEN `DashboardPage` renderiza
- THEN `AllergenTrackerCard` se monta con los 8 alérgenos

---

### REQ-B2

La card SHALL mostrar:

- Header: "Alérgenos prioritarios" + badge "PRO" si usuario PRO, botón "Activar PRO" si FREE
- Lista de los 8 alérgenos con icono, status (chip: verde=introducido, amarillo=en ventana, rojo=pendiente), y exposure count si > 0
- Si `closingWindow = true && introducedCount < 8`: banner "X alérgenos sin introducir, ventana cerrándose"

#### Scenario: Bebé de 11 meses con 3 alérgenos introducidos

- GIVEN bebé de 11 meses, 3 alérgenos introducidos (Huevo, Leche, Soya)
- AND otros 5 sin introducir
- WHEN renderiza la card
- THEN muestra 3 chips verdes (introducidos) y 5 chips rojos (pendientes)
- AND un banner "5 alérgenos sin introducir, ventana cerrándose"

#### Scenario: Bebé de 7 meses con 0 introducidos

- GIVEN bebé de 7 meses, 0 introducidos
- WHEN renderiza la card
- THEN 8 chips amarillos (en ventana) y sin banner (la ventana no está cerrándose todavía)

---

### REQ-B3

Para usuario FREE, el card SHALL mostrar un CTA "Activar PRO para ver el detalle" en lugar del detalle de alérgenos. La card sigue siendo visible (genera awareness), pero los datos están detrás del upgrade.

#### Scenario: FREE user ve CTA

- GIVEN usuario FREE
- WHEN renderiza la card
- THEN muestra header + 8 placeholders grisados + CTA "Activar PRO para ver el detalle"
- AND clickear el CTA navega a `/billing`

---

### Out of scope — Capability B

- Detalle drill-down de cada alérgeno (qué alimentos específicos, qué reacciones tuvo)
- Timeline visual de exposición
- Compartir con pediatra
- Recordatorios push
- Editar manualmente el estado de un alérgeno

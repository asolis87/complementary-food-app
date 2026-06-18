# Spec: etapa-10-23-meses (índice)

> **Why**: ver `proposal.md` y `analysis-10-23-months.md`.
>
> **Organización**: este spec se divide en 6 archivos en `specs/` por área funcional. Cada archivo contiene las capabilities y requirements con escenarios Given/When/Then.

---

## Índice de specs

| Archivo | Bloque | Capability principal | Tier |
|---------|--------|----------------------|------|
| [`specs/req-01-age-aware-experience.md`](specs/req-01-age-aware-experience.md) | 0 | Age-aware meal slots, stage transition banner, texture guide split, stage tips, perceptive feeding, water reminder | FREE |
| [`specs/req-02-food-catalog-10-23m.md`](specs/req-02-food-catalog-10-23m.md) | 1 | Seed: yogur, queso fresco, frijol, lenteja, garbanzo, hígado de pollo | FREE |
| [`specs/req-03-allergen-tracker.md`](specs/req-03-allergen-tracker.md) | 2 + 4 | Allergen status endpoint + UI card | **PRO** |
| [`specs/req-04-warning-tags.md`](specs/req-04-warning-tags.md) | 3 + 4 | WarningTag schema + UI badges | FREE |
| [`specs/req-05-plate-builder.md`](specs/req-05-plate-builder.md) | 4 + 5 | Group count suggestion, serving amount, plate stage for | FREE |
| [`specs/req-06-suggestions.md`](specs/req-06-suggestions.md) | 4 | Iron-rich priority + snack suggestions | FREE |

---

## Capabilities cross-spec

### C1. Source of truth única: `getMealSlotsForAge(months)`

Ubicación: `packages/shared/src/constants/dashboard.ts`.

Consumidores (todos usan la misma función):

- `DashboardPage` (today logs)
- `MenuWeekPage` (grilla de slots)
- `DiaryPage` (timeline)
- `AllergenTrackerCard` (cierre de ventana)
- `SnackSuggestionCard` (visibilidad condicional)

### C2. Ad-02: la app sugiere, no prescribe

Toda UI nueva (warnings, group count, serving amount, plate stage) DEBE ser overrideable por el padre. Ningún valor es bloqueante. Toda copy que sugiera un comportamiento DEBE terminar en "Si tenés dudas, consultá a tu pediatra" cuando aplique.

### C3. Tier gating consistente

Toda nueva ruta en `apps/api` DEBE especificar su tier explícitamente. Por convención del proyecto, los endpoints en `apps/api/src/modules/<module>/<module>.routes.ts` declaran el tier en el prefijo del path o en metadata. Ver `packages/shared/src/constants/tiers.ts` para la matriz actual.

### C4. i18n

Todos los strings en español. Sin internacionalización en este change.

### C5. Offline-first

Cualquier feature nueva DEBE funcionar offline (PWA con Workbox). El cacheo se valida en la fase verify.

---

## Dependencies (cross-spec)

```
req-01 (age-aware-experience)   ──┐
req-02 (food-catalog)            ──┼──► req-03 (allergen-tracker)
                                  │   (req-03 depende del seed de req-02)
req-03 (allergen-tracker)        ──┐
                                  ├──► req-04 (warning-tags)
req-04 (warning-tags)            ──┘
                                  │
req-05 (plate-builder)           ──┘
req-06 (suggestions)              ── independiente, depende solo de req-01 (slots)
```

---

## Next step

Pasar a **design.md** con las decisiones arquitectónicas (location de funciones puras, contratos de endpoints, shape de los nuevos types en shared, decisiones de migration reversibility). Pauso para revisión.

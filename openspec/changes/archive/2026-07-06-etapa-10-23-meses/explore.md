# Etapa 10–23 meses — Exploration

**Change**: etapa-10-23-meses
**Status**: explore
**Date**: 2026-06-18

---

## 1. Domain Context

Pakulab es una PWA para padres en México que inician la alimentación complementaria de sus bebés (6m–2 años). Resuelve tres problemas: balance A/L del plato, bitácora de alimentos, menú semanal. El producto está implementado y operativo para la etapa 6–9 meses pero no cubre la etapa 10–23 meses que la guía clínica (Dra. Paulina Trueba) considera un punto de inflexión clínico (cierre de ventana de alérgenos, introducción de colaciones, aumento de comidas principales).

### Source of truth clínica

- **PDF**: `docs/Guia de alimentos_Pau Trueba.pdf` (11 páginas, Grupo Pediátrico Starkids, Clínica Calle 60 No 329B, Mérida)
- **Análisis completo**: `docs/analysis-10-23-months.md` (8 secciones, 17 gaps, plan por desbloqueo)
- **Decisiones locked** (preflight SDD + product questions):
  - Mode: interactive
  - Storage: openspec
  - PR strategy: auto-forecast
  - Review budget: 400 changed lines/PR
  - Allergen tier: **PRO**
  - Plate stage tag (C3): **in scope** (migración adicional Plate.stageFor)
  - Stage transition UX: **cutover suave con banner + CTA a texture guide**
  - Perceptive feeding (E4): **card fija + expandable en dashboard**

---

## 2. Current State (codebase)

### Lo que YA está disponible (no requiere trabajo)

| Capacidad | Ubicación | Notas |
|-----------|-----------|-------|
| `MealType.SNACK_1`, `MealType.SNACK_2` en Prisma enum | `prisma/schema.prisma` | Ya existe. No requiere migración. |
| `PlateItem.servingAmount: String?` | `prisma/schema.prisma` | Ya existe. Solo UI para C2. |
| `useFoodExposure` (10-15 exposiciones) | `apps/web/src/shared/composables/useFoodExposure.ts` | Ya implementado. |
| `ALLERGEN_AGE_THRESHOLDS` + `CLOSING_WINDOW_AGE_MONTHS = 10` | `packages/shared/src/constants/allergen-age-thresholds.ts` | Ya configurado. |
| `TOP_ALLERGENS` (9 alérgenos) | `packages/shared/src/constants/allergens.ts` | Ya listo. |
| `BALANCE_TIPS` (rotación aleatoria) | `packages/shared/src/constants/dashboard.ts` | Patrón a reusar para STAGE_TIPS. |
| Plate builder 5-grupos (HEALTHY_FAT) | `apps/web/src/modules/plates/components/PlateVisualization.vue` | Ya funcional. |
| `DUAL_GROUP_FOODS` (aguacate, frutos secos) | `packages/shared/src/constants/food-groups.ts` | Lógica ya escrita. |

### Lo que FALTA (los 17 gaps del análisis)

**Críticos (5):**

- G1: `MenuWeekPage` sin slot snack1/snack2
- G2: `DASHBOARD_MEAL_SLOTS` no age-aware
- G3: terminology mismatch ("Almuerzo" vs "Comida")
- G4: seed incompleto para 10-23m (yogur, queso fresco, frijol, lenteja, garbanzo, hígado)
- G5: `allergens.routes.ts` es stub

**Importantes (6):**

- G6: no 6° grupo (Lácteos) en plate
- G7: sin indicador de porción (1-4 cdas)
- G8: `TextureGuideCard` 12+m sin granularidad
- G9: sin warnings UI (alimentos prohibidos <24m, choking <5y)
- G10: suggestions no priorizan hierro para 10-23m
- G11: suggestions no sugieren snacks para 13-23m

**Polish (6):**

- G12: sin sección "Alimentación perceptiva"
- G13: sin recordatorio de orden (leche → alimentos → agua)
- G14: sin recordatorio de técnica de cuchara
- G15: sin aviso de vaso abierto/popote
- G16: plate sin etiqueta de etapa
- G17: allergen alerts sin CTA

---

## 3. Constraints (técnicas y de producto)

### Técnicas

- **Stack**: Vue 3 + Fastify 5 + Prisma 6 + PostgreSQL 16 + BetterAuth + Stripe (existente, no se renegocia)
- **Monorepo**: pnpm workspaces. Cambios coordinados entre `apps/api`, `apps/web`, `packages/shared`
- **Strict TDD**: `openspec/config.yaml` declara `strict_tdd: true`. Tests en vitest
- **Offline-first**: PWA con Workbox. Cualquier feature nueva debe funcionar offline
- **i18n**: Todos los strings en español (convención del proyecto)

### Producto

- **Modelo de negocio**: freemium sin ads. Tier FREE permite 3 platos, 1 bebé, bitácora 7 días. Tier PRO ilimitado + menú semanal + export sin watermark
- **AD-02**: la app NO prescribe, sugiere. El plato configurable es decisión del padre
- **Tiers**: `packages/shared/src/constants/tiers.ts` define matriz. Nuevas features deben asignar tier explícitamente
- **Validación clínica**: 18 alimentos con `needsValidation: true` ya esperando nutriólogo. Los nuevos del Bloque 1 deben agregarse con ese flag

### Clínicas

- **Ventana de alérgenos**: 6-12m (cierre a los 10m). Después es más difícil introducir
- **Hierro crítico 10-23m**: hígado de pollo, carne de res (prevenir anemia)
- **Prohibidos <24m**: leche vaca entera, yogur griego, miel, azúcar, embutidos, bebidas vegetales
- **Choking <5y**: frutos secos enteros, uvas/pasas/cerezas enteras, palomitas, alimentos duros
- **Sal**: prohibida <1 año
- **Agua**: vaso abierto o popote, NUNCA mamila/vaso entrenador/360°

---

## 4. Success Metrics

### North star

- **% de bebés 10-23m con al menos 1 colación registrada por día** (proxy de engagement con el nuevo flujo)
- **% de alérgenos introducidos antes de los 12m** (proxy de que la ventana se está respetando)

### Leading indicators

- Reducción de tickets de soporte "¿por qué no veo mis snacks?"
- Aumento de conversión a PRO en el momento de cruzar a 10m (cuando aparece allergen tracker con 8 alérgenos pendientes)
- Tiempo de armado de plato (debe BAJAR con sugerencia automática de groupCount por edad)

### Quality gates

- 100% de los alimentos con flag `needsValidation: true` se siguen mostrando como tales
- 0% de falsos positivos en warnings de atragantamiento (sobrewarning genera ansiedad)
- A11y: todas las nuevas cards con aria-label, role, focus management

---

## 5. Out of Scope (explícitamente)

- **F2 (sal/condimentos)**: SKIP. No está en el PDF ni en el codebase. Modelar condimentos abre un alcance nuevo.
- **Re-arquitectura del Plate builder**: la decisión de 4/5/6 grupos es manual del padre (AD-02). Solo agregamos sugerencia automática por edad.
- **ML para predecir balance A/L**: sigue siendo función pura determinista (AD-04).
- **Cambios a Stripe/billing**: este change no toca el flujo de pagos.
- **Re-arquitectura de BetterAuth**: no se renegocia el sistema de auth.
- **Otras etapas nuevas** (24m+, 4-6m para prematuros): fuera de scope. Pueden ser changes futuros.

---

## 6. Open Questions (se cierran en proposal/spec)

- ¿Cuántos PRs va a generar? (auto-forecast decide al llegar a apply; preflight dijo auto-forecast con budget 400)
- ¿Cuál es la copia exacta del banner de cutover? (pendiente copy con nutriólogo si se requiere)
- ¿Plate.stageFor acepta valores libres o enum? (preliminar: enum `PlateStage` con 10_12 / 13_23, decisión en design)
- ¿Las warnings de alimentos prohibidos son bloqueantes o solo informativas? (decisión en spec: informativas, el padre puede override)

---

## 7. References

- `docs/analysis-10-23-months.md` — análisis completo con 17 gaps
- `docs/Guia de alimentos_Pau Trueba.pdf` — fuente clínica
- `openspec/specs/weekly-menu-plate-builder/` — spec existente del plate builder (relevante para C1/C2/C3)
- `openspec/changes/dashboard-implementation/proposal.md` — formato de proposal a seguir
- `openspec/changes/diary-day-centric-redesign/spec.md` — formato de Given/When/Then a seguir
- `prisma/schema.prisma` — schema actual
- `packages/shared/src/constants/` — constantes de food-groups, allergens, mealType

# Pakulab — Complementary Food App | Project Context

> Documento generado desde Engram memory para continuidad entre equipos/sesiones.
> Fecha: 2026-03-27

---

## 1. Descripción del Proyecto

**Pakulab** es una PWA para padres primerizos en **México** que inician la alimentación complementaria de sus bebés (6 meses a 2 años). Resuelve 3 problemas:

1. **Balancear el plato del bebé** — visualizar si los alimentos son astringentes o laxantes
2. **Bitácora de alimentos** — registrar qué se ofreció y si hubo reacciones
3. **Menús semanales** — planear y compartir con la familia/pediatra

### Diferenciador único
**NINGUNA app competidora ofrece balance astringente/laxante.** Validado contra 9 competidores (Solid Starts, PekeBocados, Alicia.mx, My Smart Solids, etc.). Pakulab es el único. PekeBocados tiene una reseña de enero 2026 pidiendo exactamente esta feature.

---

## 2. Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Vue 3 + Vite (PWA) |
| Backend | Fastify 5 (monolito modular) |
| Auth | BetterAuth (anonymous → registered → pro) |
| Database | PostgreSQL 16 + Prisma ORM |
| Payments | Stripe (MXN) |
| Package Manager | pnpm (monorepo workspaces) |
| Node | 20+ (usa `--env-file=.env` nativo) |

### Estructura del monorepo
```
pakulab/
├── apps/
│   ├── api/                    ← Fastify modular monolith (puerto 3002)
│   │   └── src/modules/        ← 9 módulos (screaming architecture)
│   │       ├── foods/          ← CRUD alimentos + búsqueda
│   │       ├── plates/         ← Builder de platos + balance
│   │       ├── auth/           ← BetterAuth config + routes
│   │       ├── diary/          ← Bitácora (SHOULD-HAVE, scaffolded)
│   │       ├── menus/          ← Menú semanal (SHOULD-HAVE, scaffolded)
│   │       ├── billing/        ← Stripe integration
│   │       ├── profiles/       ← Perfiles de bebé CRUD
│   │       ├── allergens/      ← Tracker alérgenos (SHOULD-HAVE)
│   │       └── health/         ← Health check
│   └── web/                    ← Vue 3 PWA (puerto 5174)
│       └── src/
│           ├── modules/        ← Screaming architecture espejada
│           │   ├── plates/components/  ← PlateVisualization, FoodSearchModal, BalanceIndicator...
│           │   ├── auth/       ← Login, Signup
│           │   ├── billing/    ← Pricing, Checkout success/cancel
│           │   ├── profiles/   ← Baby profiles
│           │   ├── foods/      ← Food catalog search
│           │   ├── home/       ← Landing page
│           │   └── legal/      ← Privacy, Terms
│           └── shared/
│               ├── stores/     ← Pinia (auth, food, plate, billing, profile, ui)
│               ├── composables/ ← useBalance, useOnlineStatus, useTier
│               ├── services/   ← offlineStorage (IndexedDB), syncQueue
│               ├── components/ ← TierGate, UpgradePrompt, MedicalDisclaimer, OfflineIndicator...
│               └── api/        ← fetch client con OfflineError
├── packages/
│   └── shared/                 ← @pakulab/shared — Tipos, constantes, utils compartidos
│       └── src/
│           ├── types/          ← Food, Plate, PlateBalance, User, UserTier
│           ├── constants/      ← tiers, food-groups, balance thresholds, allergens
│           └── utils/          ← calculateBalance(), ageInMonths(), formatAgeEs()
├── prisma/
│   ├── schema.prisma           ← 10+ modelos, enums, indexes
│   └── seed.ts                 ← 102 alimentos mexicanos 🇲🇽
├── docker-compose.yml
└── README.md
```

---

## 3. Decisiones de Arquitectura

### AD-01: Fastify sobre NestJS
**Decisión**: Fastify monolito modular en vez de NestJS.
**Razón**: Dev solo, MVP. NestJS es overkill — mucho boilerplate. Fastify es más rápido de desarrollar y la arquitectura modular permite migrar después si es necesario.

### AD-02: Plato configurable 4/5 grupos — selección MANUAL
**Decisión**: El usuario elige manualmente si su plato tiene 4 o 5 grupos. Sin sugerencia automática por edad.
**Razón**: El padre ya sabe cuántos grupos tiene su plato porque viene de consulta con su pediatra. La app NO es el pediatra — es la herramienta que usa DESPUÉS. Sugerir por edad podría contradecir al pediatra.
- 4 grupos base: Frutas, Verduras, Proteínas, Cereales/Tubérculos
- 5to grupo opcional: Grasas Saludables

### AD-03: 1 alimento por zona del plato
**Decisión**: Solo un alimento por sección del plato. Si agregás otro, reemplaza al existente.
**Razón**: Simplifica la UX. Es UN plato de comida, no un buffet.

### AD-04: Balance A/L como función pura determinista
**Decisión**: `(astringent_count - laxative_count) / total_items`. Score de -1.0 a +1.0. Semáforo: verde (|score| ≤ 0.34), amarillo (0.34-0.67), rojo (>0.67).
**Razón**: Sin ML. Determinista, testeable, funciona offline. Compartido en packages/shared.
**Nota**: Necesita validación de nutriólogo para los thresholds clínicos.

### AD-05: BetterAuth anonymous plugin
**Decisión**: Usuarios empiezan anónimos. Construyen platos sin registrarse. Cuando quieren guardar, se registran. BetterAuth mergea datos automáticamente.
**Razón**: Zero-friction entry es core del producto. El plate builder anónimo es el hook viral.

### AD-06: SVG plate con HTML overlay buttons
**Decisión**: El plato es SVG visual puro (`pointer-events: none`). Los clicks se capturan con `<button>` HTML invisibles posicionados con `position: absolute` encima de cada zona.
**Razón**: SVG click handlers + foreignObject son unreliable across browsers. HTML buttons son 100% confiables.

### AD-07: Offline-first con IndexedDB
**Decisión**: Catálogo de alimentos (<50KB) se cachea en IndexedDB. Balance se calcula client-side. Platos offline se encolan para sync.
**Razón**: Los padres usan la app en la cocina sin WiFi.

---

## 4. Modelo de Negocio (Freemium sin ads)

| Tier | Features | Precio |
|------|----------|--------|
| **Anónimo** | Plate builder + balance A/L + export con watermark | $0 |
| **Gratis (registrado)** | + 5 platos guardados + bitácora 7 días + 1 bebé | $0 |
| **Pro mensual** | Todo ilimitado + menú semanal + 3 bebés + sin watermark | $99 MXN/mes |
| **Pro anual** | Igual | $799 MXN/año |

Pakulab opera bajo modelo freemium sin publicidad.

### Palancas de conversión
1. **Bitácora 7 días** — padres registran una semana, crean hábito, no quieren perder historial
2. **Límite 5 platos** — generoso pero se llega rápido
3. **Watermark** — cada imagen compartida es marketing gratis
4. **Trial Pro** — se activa con ≥3 platos O ≥3 días de bitácora (comportamental, no automático)

---

## 5. Base de Datos de Alimentos

- **102 alimentos mexicanos** curados con clasificación astringente/laxante
- **18 marcados `needsValidation: true`** — necesitan validación de nutriólogo
- Cada alimento tiene: nombre, grupo, clasificación A/L, score (-1 a +1), alérgeno (sí/no + tipo), edad mínima, descripción con instrucciones de preparación
- Fuentes: AAP, ESPGHAN, IMSS, NOM-043-SSA2-2012, INCMNSZ

### Distribución
| Grupo | Cantidad |
|-------|----------|
| FRUIT | 26 |
| VEGETABLE | 23 |
| PROTEIN | 24 |
| CEREAL_TUBER | 17 |
| HEALTHY_FAT | 12 |

---

## 6. Estado de Implementación

### ✅ Completado (MUST-HAVE para soft launch)
- Phase 0: Scaffolding monorepo, Prisma schema, 102 alimentos seed
- Phase 1: Foods API CRUD + Plates API CRUD + Balance A/L engine
- Phase 2: Plate Builder UI (SVG, gauge animado, export PNG, modal interactivo)
- Phase 3: BetterAuth (anónimo→free→pro), baby profiles CRUD, TierGate
- Phase 4: Stripe MXN (checkout, webhooks, portal, trial, grace period 3 días)
- Phase 5: PWA (manifest, Workbox, IndexedDB cache, offline sync queue)
- Phase 6: Disclaimers médicos, a11y, LFPDPPP privacy, legal, homepage, Dockerfiles, README
- Bug fixes post-testing: búsqueda API, cache offline, modal UX, clicks SVG, 1 alimento por zona

### 🔲 Pendiente (SHOULD-HAVE para full launch)
- Phase 7: Bitácora/Food Log (T-035 a T-038) — backend scaffolded, UI pendiente
- Phase 8: Menú semanal planner (T-039 a T-041) — backend scaffolded, UI pendiente
- Phase 9: Allergen tracker (T-042 a T-043) — backend scaffolded, UI pendiente
- Phase 10: Full launch prep (T-044 a T-045)

### 🔲 Pendiente (pre-launch)
- Validación con nutriólogo (18 alimentos con `needsValidation: true`)
- Configurar Stripe real (productos/precios en Dashboard)
- Deploy a producción (Dockerfiles listos)
- Pruebas end-to-end con usuarios reales

---

## 7. Gotchas y Discoveries (IMPORTANTE para el próximo dev)

### Fastify
- **Plugins version**: `@fastify/cors@11`, `@fastify/helmet@13`, `@fastify/rate-limit@10` para Fastify 5. Las versiones anteriores causan `FST_ERR_PLUGIN_VERSION_MISMATCH`
- **Route order**: endpoints estáticos (`/foods/search`, `/foods/groups`) DEBEN registrarse ANTES de `/:id`
- **Webhook raw body**: Stripe necesita body sin parsear → `addContentTypeParser` con `parseAs: 'buffer'`
- **Auth plugin**: debe registrarse DESPUÉS del prisma plugin (dependency order)
- **.env loading**: usa `--env-file=.env` en scripts (Node 20.6+ nativo), NO dotenv

### Stripe
- **SDK v21 breaking changes** (API `2026-03-25.dahlia`):
  - `Subscription.current_period_end` → REMOVIDO. Ahora en `SubscriptionItem`: `subscription.items.data[0]?.current_period_end`
  - `Invoice.subscription` → REMOVIDO. Ahora en `invoice.parent?.subscription_details?.subscription`
- Grace period: `PAST_DUE` + 3 días = sigue siendo PRO en tier resolution

### Vue/Pinia
- `storeToRefs()` necesario para obtener `Ref` real que composables esperan
- `store.property = value` sin `.value` — Pinia desenvuelve refs
- Scoped styles NO penetran el namespace xhtml de SVG foreignObject

### SVG + Interactividad
- `foreignObject` + click handlers = UNRELIABLE. Solución: HTML overlay buttons invisibles
- `pointer-events: none` en todo el SVG, `pointer-events: auto` solo en overlays
- Para contenido dentro del SVG: `foreignObject` con `xmlns="http://www.w3.org/1999/xhtml"`
- Food names: `line-clamp: 2`, `white-space: normal`, layout vertical centrado

### Offline/PWA
- Cache offline-first NO debe bloquear llamadas a API cuando está online
- `isUsingCache = true` SOLO cuando realmente falla la conexión (OfflineError)
- `setFilter` debe llamar `fetchFoods` con los filtros (API), no solo actualizar estado local

---

## 8. Configuración Local

### Prerequisitos
- Node 20+
- pnpm
- PostgreSQL (Docker recomendado)

### Setup rápido
```bash
git clone <repo>
cd pakulab
pnpm install

# Crear .env files (ver apps/api/.env.example y apps/web/.env.example)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Editar apps/api/.env con:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pakulab_dev"
# PORT=3002
# BETTER_AUTH_SECRET="pakulab-dev-secret-key-at-least-32-characters-long"

# Base de datos
docker exec <postgres-container> psql -U postgres -c "CREATE DATABASE pakulab_dev;"
# O crear DB manualmente

pnpm db:push     # Crear tablas
pnpm db:seed     # Cargar 102 alimentos

# Levantar
pnpm dev:api     # Terminal 1 → http://localhost:3002
pnpm dev:web     # Terminal 2 → http://localhost:5174
```

### Variables de entorno importantes
```
# API (.env)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pakulab_dev
PORT=3002
BETTER_AUTH_SECRET=<min 32 chars>
BETTER_AUTH_URL=http://localhost:3002
CORS_ORIGIN=http://localhost:5174
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Web (.env)
VITE_API_URL=http://localhost:3002
```

---

## 9. SDD Artifacts (en Engram)

Todos los artefactos de Spec-Driven Development están persistidos en Engram:

| Artefacto | Topic Key | ID |
|-----------|-----------|-----|
| Project context | `sdd-init/pakulab` | #158 |
| Exploration (dominio) | `sdd/pakulab-mvp/explore-domain` | — |
| Exploration (competencia) | `sdd/pakulab-mvp/explore-competition` | — |
| Exploration (MVP scope) | `sdd/pakulab-mvp/explore-mvp-scope` | — |
| Proposal | `sdd/pakulab-mvp/proposal` | — |
| Spec (26 reqs, 41 scenarios) | `sdd/pakulab-mvp/spec` | — |
| Design (12 arch decisions) | `sdd/pakulab-mvp/design` | — |
| Tasks (45 tasks) | `sdd/pakulab-mvp/tasks` | — |
| Apply progress | `sdd/pakulab-mvp/apply-progress` | #193 |

Para recuperar cualquier artefacto:
```
mem_search(query: "<topic_key>", project: "pakulab") → get ID
mem_get_observation(id: <ID>) → full content
```

---

## 10. Competencia Analizada

| App | Mercado | A/L Balance | Plato Visual | Español MX | Precio |
|-----|---------|:-----------:|:------------:|:----------:|--------|
| Solid Starts | Global | ❌ | ❌ | ❌ | $2,000 MXN/año |
| PekeBocados | MX/ES | ❌ | ❌ | ✅ | ~$100 MXN/mes |
| Alicia.mx | MX | ❌ | ❌ | ✅ | ? |
| My Smart Solids | Global | ❌ | ❌ | ❌ | ~$80-140 MXN/mes |
| **Pakulab** | **MX** | **✅ ÚNICO** | **✅ ÚNICO** | **✅** | **$99 MXN/mes** |

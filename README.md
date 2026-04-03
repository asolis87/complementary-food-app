# Pakulab — Complementary Food App

**La primera app de alimentación complementaria con balance astringente/laxante para padres en México.**

Pakulab ayuda a los padres a armar platos balanceados para sus bebés durante la etapa de alimentación complementaria (6–24 meses), mostrando en tiempo real si el plato es astringente, laxante o equilibrado.

> ⚕️ **Aviso**: Pakulab es informativa. No sustituye la consulta con tu pediatra.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| API | Fastify 5, Prisma 6, PostgreSQL 16, BetterAuth, Stripe SDK v21 |
| Frontend | Vue 3, Vite, Pinia, Vue Router, PWA (vite-plugin-pwa) |
| Shared | TypeScript package `@pakulab/shared` — tipos y lógica A/L |
| Monorepo | pnpm workspaces |

---

## Estructura del proyecto

```
pakulab/
├── apps/
│   ├── api/              # Fastify API (Node 20)
│   │   └── src/
│   │       ├── modules/  # foods, plates, billing, diary, menus, profiles
│   │       └── shared/   # plugins, middleware
│   └── web/              # Vue 3 PWA
│       └── src/
│           ├── modules/  # auth, billing, diary, foods, home, legal, menus, plates, profiles
│           └── shared/   # components, composables, layouts, stores, services
├── packages/
│   └── shared/           # @pakulab/shared — tipos TS + balance engine
├── prisma/
│   └── schema.prisma     # Schema único canónico
├── docker-compose.yml
└── README.md
```

---

## Prerequisitos

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0 (`npm install -g pnpm`)
- **PostgreSQL** 16 (local o via Docker)

---

## Quick Start

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/tu-usuario/pakulab.git
cd pakulab
pnpm install
```

### 2. Configurar variables de entorno

```bash
# API
cp apps/api/.env.example apps/api/.env
# Editar apps/api/.env con tus valores

# Web
cp apps/web/.env.example apps/web/.env
# VITE_API_URL=http://localhost:3000
```

**Variables de entorno requeridas para la API:**

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/pakulab_dev` |
| `BETTER_AUTH_SECRET` | Secret para BetterAuth (mín. 32 chars) |
| `STRIPE_SECRET_KEY` | Secret key de Stripe (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret de Stripe (`whsec_...`) |
| `STRIPE_PRICE_ID_MONTHLY` | Price ID del plan Pro mensual |
| `PORT` | Puerto de la API (default: `3000`) |

### 3. Configurar base de datos

```bash
# Aplicar migraciones
pnpm db:migrate

# Poblar con los 102 alimentos mexicanos
pnpm db:seed
```

### 4. Levantar en desarrollo

```bash
# Ambos servicios en paralelo
pnpm dev

# O individualmente:
pnpm dev:api   # API en http://localhost:3000
pnpm dev:web   # Vue en http://localhost:5173
```

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Levanta API + Web en paralelo |
| `pnpm dev:api` | Solo la API |
| `pnpm dev:web` | Solo el frontend |
| `pnpm build` | Build de producción (shared → api → web) |
| `pnpm typecheck` | TypeScript check en todos los paquetes |
| `pnpm db:migrate` | Aplica migraciones Prisma |
| `pnpm db:seed` | Carga los 102 alimentos |
| `pnpm db:push` | Push del schema sin migración (dev only) |

---

## Deploy con Docker

```bash
# Levantar todo (db + api + web)
docker compose up -d

# Ver logs
docker compose logs -f api

# Bajar
docker compose down
```

La web queda disponible en `http://localhost:5173` (servida por nginx).  
La API queda en `http://localhost:3000`.

---

## Funcionalidades

### Plan Gratuito (sin registro)
- Armar platos y ver balance A/L en tiempo real
- Catálogo de 102 alimentos mexicanos
- Exportar plato como imagen (con marca de agua)
- Funciona offline (PWA)

### Plan Gratuito (con cuenta)
- Guardar hasta 3 platos
- Perfil de bebé
- Bitácora de alimentos

### Plan Pro (suscripción)
- Platos ilimitados
- Menús semanales
- Exportar sin marca de agua
- Historial completo

---

## Arquitectura A/L

El balance astringente/laxante se calcula como función pura:

```
score = (astringent_count - laxative_count) / total_items
```

- `score > 0.34` → Astringente (rojo)
- `|score| ≤ 0.34` → Equilibrado (verde)
- `score < -0.34` → Laxante (naranja)

La lógica vive en `packages/shared/src/balance.ts` y corre tanto en el servidor como en el cliente (offline-first).


---

## Aviso médico

Pakulab es una **herramienta informativa**. La clasificación A/L de los alimentos es orientativa y no sustituye la consulta con tu pediatra. Ver [Términos de uso](/terminos) y [Aviso de privacidad](/privacidad).

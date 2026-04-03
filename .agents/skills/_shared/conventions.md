# Vera Sesiom — Convenciones Globales

Estas convenciones aplican a TODOS los proyectos y stacks de Vera Sesiom.

## Idioma

- **Codigo**: Ingles (variables, funciones, clases, archivos, carpetas)
- **Documentacion**: Espanol (README, ADRs, comentarios de negocio)
- **Commits**: Ingles (conventional commits)
- **PRs e Issues**: Espanol

## Naming Conventions

### Archivos y Carpetas

| Tipo | Convencion | Ejemplo |
|------|-----------|---------|
| Carpetas | kebab-case | `user-management/` |
| Archivos TS/JS | kebab-case | `create-user.use-case.ts` |
| Archivos Vue | PascalCase | `UserProfile.vue` |
| Archivos Dart | snake_case | `user_repository.dart` |
| Archivos de test | mismo nombre + `.spec` o `.test` | `create-user.use-case.spec.ts` |

### Codigo

| Tipo | Convencion | Ejemplo |
|------|-----------|---------|
| Variables | camelCase | `userName` |
| Funciones | camelCase | `createUser()` |
| Clases | PascalCase | `UserRepository` |
| Interfaces | PascalCase (sin prefijo I) | `UserRepository` (no `IUserRepository`) |
| Types | PascalCase | `CreateUserDto` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Enums | PascalCase (miembros tambien) | `UserRole.Admin` |
| Archivos de barril | `index.ts` | `index.ts` |

### Sufijos por tipo

| Tipo | Sufijo | Ejemplo |
|------|--------|---------|
| Use Case | `.use-case` | `create-user.use-case.ts` |
| Repository (port) | `.repository` | `user.repository.ts` |
| Repository (adapter) | `.repository.impl` | `user.repository.impl.ts` |
| Service | `.service` | `auth.service.ts` |
| Controller | `.controller` | `user.controller.ts` |
| DTO | `.dto` | `create-user.dto.ts` |
| Entity | `.entity` | `user.entity.ts` |
| Value Object | `.vo` | `email.vo.ts` |
| Mapper | `.mapper` | `user.mapper.ts` |
| Guard | `.guard` | `auth.guard.ts` |
| Middleware | `.middleware` | `cors.middleware.ts` |
| Composable (Vue) | `use-` prefix | `use-auth.ts` |
| Store | `.store` | `user.store.ts` |

## Principios Fundamentales

1. **Separation of Concerns**: Cada modulo, archivo y funcion tiene UNA responsabilidad
2. **Dependency Inversion**: Depender de abstracciones, no de implementaciones concretas
3. **Screaming Architecture**: La estructura de carpetas GRITA el dominio, no el framework
4. **Monolito Modular**: Arrancar monolitico pero con boundaries claros para migrar a microservicios
5. **Fail Fast**: Validar temprano, fallar con mensajes claros
6. **No Magic**: Preferir explicito sobre implicito; menos decoradores, mas composicion

## Infraestructura — Criterio de Decision

Vera Sesiom soporta dos estrategias de infraestructura. La eleccion se hace al inicio del proyecto y se documenta en un ADR.

### Arbol de Decision

```
¿El proyecto necesita...?
│
├─ Auto-scaling, Lambda, SQS, SNS, ML services → AWS
├─ Trafico impredecible o picos estacionales → AWS
├─ Compliance especifico (HIPAA, PCI-DSS) → AWS
│
├─ Trafico predecible, arquitectura simple → VPS + Dokploy
├─ Presupuesto fijo mensual → VPS + Dokploy
├─ MVP o herramienta interna → VPS + Dokploy
│
└─ No estas seguro → Empeza con VPS + Dokploy, migra si es necesario
```

### Comparacion Rapida

| Criterio | VPS + Dokploy | AWS |
|----------|--------------|-----|
| Costo mensual | Predecible ($20-100/mes) | Variable (pay-as-you-go) |
| Complejidad | Baja | Alta |
| Time to deploy | Minutos | Horas/dias (primer setup) |
| Escalabilidad | Vertical + manual horizontal | Auto-scaling |
| Servicios managed | Base (DB, cache, storage) | Completo (ML, queues, CDN, etc.) |
| Equipo necesario | Dev fullstack | DevOps dedicado (ideal) |
| Vendor lock-in | Bajo (Docker portable) | Alto (servicios nativos) |

### Regla de Oro

> **Empeza simple. Escala cuando duela.**
> La arquitectura hexagonal garantiza que migrar de VPS a AWS (o viceversa) es cambiar adaptadores de infraestructura, no reescribir el dominio.

Skills relacionadas:
- [aws-infra](../aws-infra/SKILL.md) — cuando el proyecto requiere AWS
- [vps-dokploy](../vps-dokploy/SKILL.md) — cuando el proyecto va a VPS

## Frontend — Criterio de Decision

Vera Sesiom usa dos stacks de frontend según el tipo de proyecto. La eleccion se hace al inicio y se documenta.

### Arbol de Decision

```
¿El proyecto es...?
│
├─ Landing page, sitio corporativo, blog, docs → Astro
├─ SEO critico, contenido estatico → Astro
├─ Interactividad minima (formularios, carruseles) → Astro
│
├─ Web app interactiva (dashboard, admin) → Vue
├─ Alta interactividad, CRUD, real-time → Vue
├─ Estado complejo, validaciones extensas → Vue
│
└─ No estas seguro → Evaluá caso por caso
```

### Comparacion Rapida

| Criterio | Astro (astro-landing) | Vue (vue-frontend) |
|----------|----------------------|-------------------|
| Tipo de proyecto | Landing page, sitio corporativo, blog | Web app interactiva |
| Interactividad | Minima (formularios, carruseles) | Alta (dashboards, CRUD, real-time) |
| SEO | Critico | Importante pero manejable con SSR |
| JS al cliente | Zero por defecto | Runtime completo de Vue |
| Contenido | Estatico o semi-estatico | Dinamico |
| Hidratacion | Islands (pay per use) | Full hydration |

### Regla de Oro

> **Si el sitio es contenido que la gente LEE → Astro.**
> **Si es una app que la gente USA → Vue.**

Skills relacionadas:
- [astro-landing](../astro-landing/SKILL.md) — landing pages y sitios de contenido
- [vue-frontend](../vue-frontend/SKILL.md) — aplicaciones web interactivas

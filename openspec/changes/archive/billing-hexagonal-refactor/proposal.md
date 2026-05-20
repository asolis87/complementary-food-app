# Proposal: Refactor Hexagonal del Módulo de Billing

## Intent

El módulo de billing actual implementa toda la lógica de Stripe (checkout, portal, webhooks, trial, eliminación de cuenta) en un solo archivo `billing.service.ts` de 460 líneas, con un patrón service+route plano. Esto viola la arquitectura hexagonal mandatoria para Vera Sesiom y mezcla dominio, aplicación e infraestructura en un solo archivo. Necesitamos refactorizarlo al patrón hexagonal (`domain/ports`, `application/use-cases`, `infrastructure/adapters`) sin romper los 2 consumidores críticos (`auth.config.ts` y `profiles.routes.ts`) ni los 5 endpoints de API que consume el frontend.

## Scope

### In Scope

- Extraer el módulo de billing a estructura hexagonal con las 3 capas (domain, application, infrastructure)
- Definir `BillingPort` con las 6 funciones públicas de Stripe (checkout, portal, webhook, subscription, trial)
- Definir `UserAccountPort` para la eliminación de cuenta (actualmente vive en billing pero es cross-cutting)
- Crear `StripePaymentGatewayAdapter` que implemente `BillingPort` usando el SDK de Stripe v21
- Crear `PrismaSubscriptionRepository` que implemente `SubscriptionRepository` para queries de DB
- Refactorizar los 5 endpoints de `billing.routes.ts` para usar use cases en lugar de funciones sueltas
- Extraer `deleteUserAccount` a un use case `DeleteUserAccountUseCase` con su propio puerto
- Mantener compatibilidad hacia atrás: `auth.config.ts` y `profiles.routes.ts` deben seguir funcionando sin cambios en su lógica
- Mantener la respuesta HTTP de los 5 endpoints sin cambios (contrato de API)
- Migrar los 25 tests existentes al nuevo patrón

### Out of Scope

- Tests para checkout/webhook (se abordarán en un SDD separado)
- Idempotency keys para Stripe
- Retry logic para errores transitorios
- Sincronización de email del customer
- Historial de facturación (invoice history)
- Eventos del dominio después de webhooks
- Extracción de la lógica de resolución de tiers del plugin `auth.ts` (se abordará en un SDD separado)

## Capabilities

### Modified Capabilities

- `billing-module`: Refactorizar de patrón service+route plano a hexagonal architecture con puertos, adaptadores y use cases. La funcionalidad externa no cambia — solo la estructura interna.

### New Capabilities

- `user-account-deletion`: Extraer `deleteUserAccount` de billing a un caso de uso independiente con su propio puerto `UserAccountPort`, removiendo el acoplamiento incorrecto entre `profiles.routes.ts` y `billing.service.ts`.

## Affected Modules

| Módulo | Impacto | Riesgo |
|--------|---------|--------|
| `modules/billing/` | Reescritura completa a hexagonal | 🔴 Alto (módulo principal) |
| `modules/auth/auth.config.ts` | Cambio de import path para `createTrialSubscription` | 🔴 Alto (signup crítico) |
| `modules/profiles/profiles.routes.ts` | Cambio de import path para `deleteUserAccount` | 🔴 Alto (account deletion) |
| `modules/email/` | Referencia — patrón hexagonal a seguir | 🟢 Bajo |
| `modules/disclaimer/` | Referencia — patrón hexagonal a seguir | 🟢 Bajo |
| `shared/plugins/auth.ts` | Sin cambios (lee DB, no importa billing) | 🟢 Bajo |
| `shared/hooks/requireTier.ts` | Sin cambios | 🟢 Bajo |
| Frontend `billingStore.ts` | Sin cambios (contrato de API estable) | 🟢 Bajo |

## Rollback Plan

Si el refactor introduce regresiones:

1. **Revertir el commit** — los cambios son puramente estructurales, no funcionales
2. **Rollback alternativo**: mantener ambas estructuras (vieja y nueva) coexistiendo con un feature flag hasta validar
3. **Checklist de verificación pre-merge**:
   - 25 tests existentes pasan (adaptados al nuevo patrón)
   - `auth.config.ts` compila y los tests de auth pasan
   - `profiles.routes.ts` compila
   - `pnpm typecheck` pasa en todo el monorepo
   - `pnpm --filter api test` pasa (todos los tests)

## Risks

1. **Breaking `auth.config.ts`**: Si el import de `createTrialSubscription` falla, todos los signups (email y Google OAuth) se rompen. Mitigación: mantener el nombre de la función y el path del barrel export.
2. **Breaking `profiles.routes.ts`**: Si `deleteUserAccount` se mueve, el endpoint `DELETE /api/profiles/me` se rompe. Mitigación: barrel export temporal desde billing hacia el nuevo use case.
3. **Regresión silenciosa en tier resolution**: Si cambiamos cómo se persiste la Subscription, el plugin `auth.ts` podría leer datos inconsistentes. Mitigación: el adapter de repositorio usa exactamente los mismos queries de Prisma.
4. **Webhook raw body capture**: El hook `preParsing` está scoped a `/api/billing/*`. Si cambiamos el prefix del plugin, el webhook falla. Mitigación: mantener el prefix y el hook sin cambios.

## Estimated Diff Size

~300-400 líneas cambiadas (mover código existente a nuevos archivos, imports actualizados, barrel exports). Se mantiene dentro del review budget de 400 líneas. Si excede, se evalúa chain PR en la fase de tasks.

## Related Artifacts

- [explore-coupling.md](./explore-coupling.md) — Análisis completo de acoplamientos
- [OpenSpec config](../../config.yaml) — strict TDD, vitest runner
- [Hexagonal Architecture Skill](../../../.agents/skills/hexagonal-architecture/SKILL.md) — convenciones de arquitectura
- [Node Backend Skill](../../../.agents/skills/node-backend/SKILL.md) — convenciones de backend

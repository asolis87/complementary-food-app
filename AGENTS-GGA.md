# Vera Sesiom — Code Review Rules for GGA

> Reglas de code review para Gentleman Guardian Angel (GGA)
> Snapshot histórico de las reglas de code review de Vera Sesiom

---

## Architecture (REJECT if violated)

### Hexagonal Architecture
- **Domain layer MUST NOT import from infrastructure** — No imports de Prisma, Express, Fastify, database, o servicios externos en el dominio
- **Use cases MUST have single responsibility** — Cada use case hace UNA cosa
- **Ports MUST be interfaces** — Repositorios y servicios externos definidos como interfaces en el dominio
- **Adapters implement ports** — La infraestructura implementa las interfaces del dominio

### Module Structure
- **Screaming architecture** — Carpetas organizadas por dominio (`users/`, `foods/`, `plates/`), no por tipo
- **No cross-module imports** — Módulos no se importan entre sí directamente; usar eventos o APIs
- **Shared only for types/constants** — `packages/shared` solo para tipos, constantes y utils puros

---

## Code Quality (REJECT if violated)

### TypeScript Strict
- **NO `any`** — Usar tipos específicos o `unknown` con type guards
- **NO `@ts-ignore`** — Sin suprimir errores de TypeScript
- **NO implicit any** — Todas las variables y parámetros tipados
- **NO non-null assertion (`!`)** — Usar optional chaining o checks explícitos

### Code Cleanliness
- **NO hardcoded values** — Usar configs, constantes o variables de entorno
- **NO `console.log`** — Sin debug code; usar logger si es necesario
- **NO commented-out code** — Borrar código muerto (git tiene el historial)
- **NO dead code** — Variables, funciones o imports sin usar

### Error Handling
- **Domain exceptions** — Usar errores de dominio específicos, no `Error` genérico
- **No generic catches** — `catch (error)` debe manejar o propagar explícitamente
- **Fail fast** — Validar temprano, fallar con mensajes claros

---

## Naming Conventions (REJECT if violated)

### Files
- **TypeScript/JavaScript**: kebab-case (`create-user.use-case.ts`)
- **Vue components**: PascalCase (`UserProfile.vue`)
- **Tests**: mismo nombre + `.spec.ts` o `.test.ts`

### Code
- **Variables/functions**: camelCase (`userName`, `createUser()`)
- **Classes/Interfaces**: PascalCase (`UserRepository`, sin prefijo `I`)
- **Types**: PascalCase (`CreateUserDto`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Enums**: PascalCase (`UserRole.Admin`)

### Suffixes
- **Use Case**: `.use-case.ts`
- **Repository (port)**: `.repository.ts`
- **Repository (adapter)**: `.repository.impl.ts`
- **Service**: `.service.ts`
- **Controller**: `.controller.ts`
- **DTO**: `.dto.ts`
- **Entity**: `.entity.ts`
- **Value Object**: `.vo.ts`
- **Mapper**: `.mapper.ts`
- **Composable (Vue)**: `use-` prefix (`use-auth.ts`)

---

## Testing (REJECT if violated)

### Coverage
- **New use cases MUST have unit tests** — Mínimo 80% coverage en domain/application
- **Tests follow AAA pattern** — Arrange, Act, Assert
- **Test names describe behavior** — `should_return_user_when_valid_id()`
- **No interdependent tests** — Cada test es independiente

### Test Quality
- **No test logic in production code** — Código de producción no tiene flags de test
- **Mocks for external dependencies** — Repositorios, servicios, APIs externos mockeados
- **Test domain logic, not frameworks** — Probar reglas de negocio, no configuraciones

---

## Security (REJECT if violated)

### Secrets & Credentials
- **NO secrets in code** — API keys, passwords, tokens en variables de entorno
- **NO .env in git** — `.env` en `.gitignore`, usar `.env.example`

### Input Validation
- **Validate at API boundaries** — Todos los inputs validados en controllers/endpoints
- **DTOs for API requests** — Usar DTOs con validación (class-validator, zod, etc.)
- **Sanitize user input** — Prevenir XSS, injection attacks

### Authentication & Authorization
- **Auth checks where needed** — Endpoints protegidos requieren autenticación
- **Role-based access** — Verificar roles/permisos para operaciones sensibles
- **No sensitive data in responses** — No exponer passwords, tokens, datos sensibles

### Database Security
- **Parameterized queries** — Prevenir SQL injection (Prisma ya lo hace)
- **No raw queries without validation** — Queries raw solo si es necesario y validado

---

## Performance (SHOULD — suggestions, not blockers)

### Database
- **No N+1 queries** — Usar `include`, `join`, o batching
- **Pagination for lists** — Endpoints de lista con `limit`/`offset` o cursor
- **Appropriate indexes** — Índices en campos de búsqueda/filtro frecuentes

### Caching
- **Cache expensive operations** — Resultados de queries costosas, cálculos complejos
- **Cache headers for static data** — HTTP caching para datos que cambian poco

### Frontend (Vue)
- **No unnecessary re-renders** — Usar `v-memo`, `shallowRef`, computed properties
- **Lazy load routes** — Code splitting para rutas
- **Debounce user input** — Búsquedas, filtros con debounce

---

## Documentation (SHOULD — suggestions, not blockers)

### Code Comments
- **Complex logic has WHY comments** — Explicar por qué, no qué
- **Public APIs have JSDoc** — Funciones públicas documentadas
- **No obvious comments** — No comentar lo obvio (`// increment counter`)

### Architecture
- **ADRs for significant decisions** — Decisiones arquitectónicas documentadas
- **README for modules** — Módulos complejos con README explicando propósito

---

## Files to Exclude from Review

GGA NO debe revisar (configurado en `.gga`):
- `tests/` — Archivos de test
- `*.spec.ts` — Tests unitarios
- `*.test.ts` — Tests
- `*.test.js` — Tests JavaScript
- `node_modules/` — Dependencias
- `dist/` — Build output
- `build/` — Build output
- `*.min.js` — Minificados
- `coverage/` — Reportes de coverage

---

## Review Response Format

GGA debe responder con:
1. **STATUS: PASSED** o **STATUS: FAILED**
2. Lista de violaciones con:
   - Archivo y línea
   - Regla violada
   - Sugerencia de fix
3. Resumen ejecutivo (opcional)

### Ejemplo de Response

```
STATUS: FAILED

Violations:
1. apps/api/src/modules/users/create-user.use-case.ts:15
   - Rule: Domain layer MUST NOT import from infrastructure
   - Found: import { PrismaClient } from '@prisma/client'
   - Fix: Move Prisma import to infrastructure adapter

2. apps/web/src/modules/plates/components/PlateBuilder.vue:42
   - Rule: NO `any` in TypeScript strict mode
   - Found: const data: any = await fetch()
   - Fix: Define proper type interface for API response

Summary: 2 violations found (1 architecture, 1 code quality)
```

---

## Version

- **Version**: 1.0.0
- **Last Updated**: 2026-04-22
- **Source**: Vera Sesiom code-review conventions snapshot (skill removed; rules stand on their own)

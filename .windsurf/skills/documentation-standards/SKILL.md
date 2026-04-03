---
name: documentation-standards
description: >
  Documentation standards for Vera Sesiom. README structure, ADRs, code comments, and API documentation.
  Trigger: When writing documentation, creating ADRs, documenting APIs, or establishing doc standards.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Writing or updating project README
- Creating Architecture Decision Records (ADRs)
- Documenting APIs
- Adding code comments
- Setting up documentation structure

---

## Critical Rules

1. **Every project MUST have a README** with setup instructions
2. **Significant architecture decisions MUST have an ADR**
3. **Code comments explain WHY, not WHAT** — the code explains what
4. **API documentation auto-generated where possible** (OpenAPI/Swagger)
5. **Documentation in Spanish** — code in English, docs in Spanish
6. **Keep docs next to code** — not in a separate wiki

---

## README Structure

Every project README MUST contain:

```markdown
# Nombre del Proyecto

Descripcion breve de que hace el proyecto.

## Stack

Tabla de tecnologias usadas.

## Requisitos Previos

- Node.js >= 20
- pnpm >= 9
- Docker (para desarrollo local)

## Instalacion

Pasos exactos para levantar el proyecto desde cero.

## Desarrollo

Comandos para desarrollo local.

## Testing

Como correr tests.

## Deployment

Como se despliega (referencia al pipeline).

## Estructura del Proyecto

Arbol de carpetas con descripcion breve.

## Convenciones

Referencia a las skills de Vera Sesiom.

## Equipo

Quienes trabajan en este proyecto.
```

---

## Architecture Decision Records (ADRs)

### When to Write an ADR

- Choosing a framework, library, or service
- Changing architectural patterns
- Making tradeoff decisions (performance vs simplicity, etc.)
- Deviating from Vera Sesiom standards (MUST justify)

### ADR Structure

```markdown
# ADR-{NNN}: {Titulo}

## Estado

{Propuesto | Aceptado | Deprecado | Reemplazado por ADR-XXX}

## Contexto

Que problema estamos resolviendo. Que restricciones tenemos.

## Decision

Que decidimos y por que.

## Alternativas Consideradas

### Alternativa A: {nombre}
- Pros: ...
- Contras: ...

### Alternativa B: {nombre}
- Pros: ...
- Contras: ...

## Consecuencias

- Positivas: que ganamos
- Negativas: que perdemos o que riesgos aceptamos
- Neutras: cambios que no son ni buenos ni malos

## Fecha

YYYY-MM-DD
```

### ADR File Location

```
docs/
└── adrs/
    ├── 001-use-vue3-for-frontend.md
    ├── 002-hexagonal-architecture.md
    ├── 003-pnpm-monorepo.md
    └── README.md              # Index of all ADRs
```

---

## Code Comments

### DO Comment

```typescript
// Why we use a 5-second delay: the payment gateway has a known race condition
// where confirming too quickly returns stale status. See ADR-015.
await delay(5000)

// Intentionally not using strict email validation here because
// some legacy corporate emails use non-standard TLDs
const isValidEmail = email.includes('@')
```

### DON'T Comment

```typescript
// Get user by id (USELESS — the code already says this)
const user = await userRepository.findById(id)

// Increment counter (USELESS)
counter++

// TODO: fix this later (NEVER — create an issue instead)
```

### Comment Rules

| DO | DON'T |
|----|-------|
| Explain WHY | Explain WHAT the code does |
| Document workarounds with ticket reference | Leave TODO without issue link |
| JSDoc for public API functions | Comment every line |
| Document non-obvious business rules | Comment obvious code |

---

## API Documentation

### OpenAPI / Swagger

- Auto-generate from Zod schemas where possible
- Keep OpenAPI spec in `docs/api/openapi.yaml`
- Serve Swagger UI in development (`/api/docs`)
- Update on every API change (part of PR checklist)

### Endpoint Documentation

Each endpoint should document:
1. Path and method
2. Description of what it does
3. Request body / query parameters
4. Response format (success and error)
5. Authentication requirements
6. Rate limiting

---

## Changelog

Use [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

## [1.2.0] - 2024-03-15

### Added
- User profile picture upload
- Email notification preferences

### Changed
- Improved pagination performance on user list

### Fixed
- Login redirect loop on expired sessions

### Security
- Updated jwt library to fix CVE-2024-XXXX
```

---

## Commands

```bash
# Create new ADR
echo "# ADR-$(ls docs/adrs/*.md | wc -l | tr -d ' '): Title\n\n## Estado\n\nPropuesto" > docs/adrs/new-adr.md

# Generate API docs (if using swagger-jsdoc)
pnpm --filter @vera-sesiom/api docs:generate
```

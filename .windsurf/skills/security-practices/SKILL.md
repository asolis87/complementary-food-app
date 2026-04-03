---
name: security-practices
description: >
  Security practices and standards for Vera Sesiom. Authentication, secrets management, input validation, and secure coding.
  Trigger: When implementing authentication, handling secrets, validating inputs, or reviewing security posture.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Implementing authentication or authorization
- Handling secrets, API keys, or credentials
- Validating user inputs
- Reviewing code for security vulnerabilities
- Setting up security controls in infrastructure

---

## Critical Rules

1. **NEVER commit secrets** — no API keys, passwords, tokens in code. EVER.
2. **Validate ALL inputs at the boundary** — trust nothing from the client
3. **JWT with refresh token rotation** — short-lived access tokens (15min)
4. **Principle of least privilege** — minimum permissions needed
5. **HTTPS everywhere** — no HTTP in staging or production
6. **Dependencies audit monthly** — `pnpm audit` / `flutter pub outdated`
7. **Log security events** — auth failures, permission denials, rate limit hits

---

## Secrets Management

### Where Secrets Live

| Environment | Storage |
|------------|---------|
| Local dev | `.env.local` (gitignored) |
| CI/CD | GitHub Secrets / pipeline variables |
| AWS | SSM Parameter Store (encrypted) or Secrets Manager |

### .env Rules

```bash
# .env.example — committed to git (templates only, NO values)
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
JWT_SECRET=your-secret-here-min-32-chars
AWS_REGION=us-east-1

# .env.local — NEVER committed
DATABASE_URL=postgresql://real-user:real-password@localhost:5432/myapp
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### .gitignore (mandatory entries)

```
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
service-account.json
```

---

## Authentication

### JWT Flow

```
Client                    API                      Auth Service
  │                        │                           │
  │── POST /auth/login ──→│                           │
  │   { email, password }  │── validate credentials ─→│
  │                        │←── user data ────────────│
  │                        │── generate tokens         │
  │←── { accessToken,     │                           │
  │      refreshToken }    │                           │
  │                        │                           │
  │── GET /users ────────→│                           │
  │   Authorization:       │── verify accessToken      │
  │   Bearer <token>       │── execute request         │
  │←── { data: [...] }    │                           │
  │                        │                           │
  │── POST /auth/refresh →│                           │
  │   { refreshToken }     │── verify + rotate         │
  │←── { accessToken,     │                           │
  │      refreshToken }    │                           │
```

### Token Configuration

| Token | Lifetime | Storage (Client) |
|-------|----------|-----------------|
| Access Token | 15 minutes | Memory (NOT localStorage) |
| Refresh Token | 7 days | HttpOnly Secure cookie |

### Token Rules

- Access tokens: short-lived, stateless (JWT)
- Refresh tokens: longer-lived, stored in DB (revocable)
- Refresh rotation: new refresh token on every refresh
- Revoke all tokens on password change
- Blacklist compromised tokens

---

## Input Validation

### Backend (Zod)

```typescript
// ALWAYS validate at the API boundary
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
})
```

### Frontend (also validate)

Double validation: client-side for UX, server-side for security. **NEVER trust client validation alone.**

### SQL Injection Prevention

```typescript
// GOOD — parameterized query
const user = await prisma.user.findUnique({ where: { id } })

// BAD — string concatenation (NEVER)
const user = await db.query(`SELECT * FROM users WHERE id = '${id}'`)
```

### XSS Prevention

- Vue auto-escapes template output (safe by default)
- NEVER use `v-html` with user content
- Set `Content-Security-Policy` headers
- Sanitize rich text inputs with DOMPurify

---

## Authorization

### Role-Based Access Control (RBAC)

```typescript
// Define permissions per role
const PERMISSIONS = {
  admin: ['users:read', 'users:write', 'users:delete', 'orders:*'],
  editor: ['users:read', 'orders:read', 'orders:write'],
  viewer: ['users:read', 'orders:read'],
} as const

// Middleware
function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = PERMISSIONS[req.user.role]
    if (!hasPermission(userPermissions, permission)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      })
    }
    next()
  }
}

// Usage
router.delete('/users/:id', authMiddleware, requirePermission('users:delete'), ...)
```

---

## CORS Configuration

```typescript
const corsOptions = {
  origin: env.ALLOWED_ORIGINS.split(','),   // Explicit origins, NEVER '*' in prod
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,                         // For cookies
  maxAge: 86400,                             // Cache preflight for 24h
}
```

---

## Rate Limiting

```typescript
// Apply to auth endpoints (more strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                     // 10 attempts
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts' } },
})

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
})

app.use('/api/v1/auth', authLimiter)
app.use('/api/v1', apiLimiter)
```

---

## Security Headers

```typescript
import helmet from 'helmet'

app.use(helmet())
// Sets: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
//       Strict-Transport-Security, Content-Security-Policy, etc.
```

---

## Dependency Security

```bash
# Monthly audit
pnpm audit
flutter pub outdated

# Auto-fix where possible
pnpm audit --fix

# Enable Dependabot / Renovate for automatic updates
```

---

## Security Checklist for PRs

- [ ] No secrets in code or config files
- [ ] Inputs validated with Zod at API boundary
- [ ] Auth middleware applied to protected routes
- [ ] RBAC permissions checked for sensitive operations
- [ ] No `v-html` with user-generated content
- [ ] SQL queries parameterized (Prisma handles this)
- [ ] Rate limiting on auth and sensitive endpoints
- [ ] Error messages don't leak internal details

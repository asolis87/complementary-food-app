---
name: api-design
description: >
  REST API design conventions for Vera Sesiom. Endpoint naming, request/response formats, error handling, and versioning.
  Trigger: When designing API endpoints, handling errors, or establishing API conventions.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Designing new API endpoints
- Defining request/response formats
- Implementing error handling
- Setting up API versioning
- Reviewing API contracts

---

## Critical Rules

1. **RESTful naming** — resources are nouns, plural, lowercase
2. **Consistent response format** — always `{ data, meta?, error? }`
3. **HTTP status codes MUST be correct** — no 200 for errors
4. **API versioning from day one** — `/api/v1/`
5. **Validation at the boundary** — Zod schemas for all inputs
6. **Pagination for all list endpoints** — no unbounded queries
7. **ISO 8601 for dates** — `2024-01-15T10:30:00Z`

---

## URL Conventions

### Structure

```
/api/v{version}/{resource}
/api/v{version}/{resource}/{id}
/api/v{version}/{resource}/{id}/{sub-resource}
```

### Examples

```
GET    /api/v1/users              # List users
POST   /api/v1/users              # Create user
GET    /api/v1/users/:id          # Get user by ID
PUT    /api/v1/users/:id          # Full update
PATCH  /api/v1/users/:id          # Partial update
DELETE /api/v1/users/:id          # Delete user
GET    /api/v1/users/:id/orders   # List user's orders
```

### Naming Rules

| Rule | Good | Bad |
|------|------|-----|
| Plural nouns | `/users` | `/user`, `/getUsers` |
| Lowercase | `/users` | `/Users` |
| Kebab-case for multi-word | `/order-items` | `/orderItems`, `/order_items` |
| No verbs in URLs | `/users` (POST) | `/createUser` |
| Nesting max 2 levels | `/users/:id/orders` | `/users/:id/orders/:oid/items/:iid` |

---

## Response Format

### Success Response

```json
// Single resource
{
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}

// List (paginated)
{
  "data": [
    { "id": "1", "name": "Alice" },
    { "id": "2", "name": "Bob" }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "perPage": 20,
    "totalPages": 3
  }
}

// Empty list
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "perPage": 20,
    "totalPages": 0
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with id \"123\" not found",
    "details": []
  }
}

// Validation error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "name", "message": "Name is required" }
    ]
  }
}
```

---

## HTTP Status Codes

### Success

| Code | When |
|------|------|
| `200 OK` | GET, PUT, PATCH success |
| `201 Created` | POST success (resource created) |
| `204 No Content` | DELETE success |

### Client Errors

| Code | When |
|------|------|
| `400 Bad Request` | Validation error, malformed request |
| `401 Unauthorized` | Missing or invalid authentication |
| `403 Forbidden` | Authenticated but not authorized |
| `404 Not Found` | Resource doesn't exist |
| `409 Conflict` | Duplicate resource, state conflict |
| `422 Unprocessable Entity` | Valid syntax but semantic error |

### Server Errors

| Code | When |
|------|------|
| `500 Internal Server Error` | Unhandled server error |
| `502 Bad Gateway` | Upstream service failure |
| `503 Service Unavailable` | Server temporarily down |

---

## Pagination

### Query Parameters

```
GET /api/v1/users?page=2&perPage=20&sort=createdAt&order=desc
```

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | 1 | - | Page number |
| `perPage` | 20 | 100 | Items per page |
| `sort` | `createdAt` | - | Sort field |
| `order` | `desc` | - | `asc` or `desc` |

### Filtering

```
GET /api/v1/users?role=admin&isActive=true&search=john
```

---

## Authentication

### Headers

```
Authorization: Bearer <jwt-token>
```

### Protected vs Public Endpoints

```typescript
// Public
router.post('/api/v1/auth/login', ...)
router.post('/api/v1/auth/register', ...)

// Protected (requires auth middleware)
router.get('/api/v1/users', authMiddleware, ...)
router.post('/api/v1/orders', authMiddleware, ...)
```

---

## Versioning Strategy

- **URL-based versioning**: `/api/v1/`, `/api/v2/`
- Only bump major version for breaking changes
- Maintain previous version for minimum 6 months after deprecation
- Use `Deprecation` header for sunsetting endpoints

```
Deprecation: true
Sunset: Sat, 01 Jul 2025 00:00:00 GMT
Link: </api/v2/users>; rel="successor-version"
```

---

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Return 200 with error in body | Use proper HTTP status codes |
| Unbounded list queries | Always paginate |
| Expose internal IDs (auto-increment) | Use UUIDs |
| Return domain entities directly | Map to DTOs/response format |
| Different error formats per endpoint | Use consistent error format |
| Verbs in URLs (`/getUser`) | Use HTTP methods + nouns |

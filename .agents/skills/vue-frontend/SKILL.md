---
name: vue-frontend
description: >
  Vue 3 frontend conventions for Vera Sesiom. Composition API, Screaming Architecture, Atomic Design, and state management patterns.
  Trigger: When writing Vue components, composables, stores, or structuring a Vue frontend project.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Creating or modifying Vue 3 components
- Setting up a new Vue frontend project
- Writing composables or stores
- Deciding component structure or state management approach
- Reviewing frontend code

---

## Critical Rules

1. **Composition API with `<script setup>` ONLY** — no Options API, no `defineComponent()`
2. **TypeScript ALWAYS** — no `.js` files in Vue projects
3. **Screaming Architecture** — folders scream the DOMAIN, not the component type
4. **Container/Presentational pattern** — smart vs dumb components
5. **Pinia for state management** — one store per domain module
6. **No `any` type** — use `unknown` if truly unknown, otherwise type it
7. **Vue components are PascalCase** — `UserProfile.vue`, not `user-profile.vue`

---

## Project Structure (Screaming Architecture)

```
src/
├── modules/                        # Feature modules (SCREAMING domain)
│   ├── auth/                       # Auth module
│   │   ├── components/             # Presentational components
│   │   │   ├── LoginForm.vue
│   │   │   └── RegisterForm.vue
│   │   ├── containers/             # Smart/container components
│   │   │   ├── LoginContainer.vue
│   │   │   └── RegisterContainer.vue
│   │   ├── composables/            # Module-specific composables
│   │   │   └── use-auth.ts
│   │   ├── stores/                 # Module store
│   │   │   └── auth.store.ts
│   │   ├── services/               # API calls
│   │   │   └── auth.service.ts
│   │   ├── types/                  # Module types
│   │   │   └── auth.types.ts
│   │   ├── routes/                 # Module routes
│   │   │   └── auth.routes.ts
│   │   └── index.ts                # Barrel export
│   ├── users/
│   │   ├── components/
│   │   ├── containers/
│   │   ├── composables/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── types/
│   │   ├── routes/
│   │   └── index.ts
│   └── dashboard/
├── shared/                         # Cross-cutting shared code
│   ├── components/                 # Shared UI components (Atomic Design)
│   │   ├── atoms/                  # Buttons, Inputs, Labels
│   │   ├── molecules/              # SearchBar, FormField
│   │   └── organisms/              # NavBar, Sidebar, DataTable
│   ├── composables/                # Shared composables
│   │   ├── use-api.ts
│   │   ├── use-breakpoint.ts
│   │   └── use-toast.ts
│   ├── layouts/                    # Page layouts
│   │   ├── DefaultLayout.vue
│   │   └── AuthLayout.vue
│   ├── types/                      # Global types
│   │   └── api.types.ts
│   └── utils/                      # Pure utility functions
│       └── format-date.ts
├── router/                         # Vue Router setup
│   └── index.ts
├── plugins/                        # Vue plugins
├── assets/                         # Static assets
│   ├── styles/
│   └── images/
├── App.vue
└── main.ts
```

---

## Component Patterns

### Container/Presentational Split

**Container (Smart)** — handles logic, state, API calls:

```vue
<!-- modules/users/containers/UserListContainer.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '../stores/user.store'
import UserList from '../components/UserList.vue'

const userStore = useUserStore()

onMounted(() => {
  userStore.fetchUsers()
})

function handleDelete(userId: string) {
  userStore.deleteUser(userId)
}
</script>

<template>
  <UserList
    :users="userStore.users"
    :loading="userStore.loading"
    @delete="handleDelete"
  />
</template>
```

**Presentational (Dumb)** — pure UI, receives props, emits events:

```vue
<!-- modules/users/components/UserList.vue -->
<script setup lang="ts">
import type { User } from '../types/user.types'

interface Props {
  users: User[]
  loading: boolean
}

interface Emits {
  (e: 'delete', userId: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <div v-if="loading">Loading...</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">
      {{ user.name }}
      <button @click="$emit('delete', user.id)">Delete</button>
    </li>
  </ul>
</template>
```

### Composable Pattern

```typescript
// modules/users/composables/use-users.ts
import { computed } from 'vue'
import { useUserStore } from '../stores/user.store'

export function useUsers() {
  const store = useUserStore()

  const activeUsers = computed(() =>
    store.users.filter(u => u.isActive)
  )

  return {
    users: computed(() => store.users),
    activeUsers,
    loading: computed(() => store.loading),
    fetchUsers: () => store.fetchUsers(),
    deleteUser: (id: string) => store.deleteUser(id),
  }
}
```

### Store Pattern (Pinia)

```typescript
// modules/users/stores/user.store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '../types/user.types'
import { userService } from '../services/user.service'

export const useUserStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      users.value = await userService.getAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  async function deleteUser(id: string) {
    await userService.delete(id)
    users.value = users.value.filter(u => u.id !== id)
  }

  return { users, loading, error, fetchUsers, deleteUser }
})
```

### Service Pattern (API Layer)

```typescript
// modules/users/services/user.service.ts
import { apiClient } from '@/shared/composables/use-api'
import type { User, CreateUserDto } from '../types/user.types'

export const userService = {
  async getAll(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>('/users')
    return data
  },

  async getById(id: string): Promise<User> {
    const { data } = await apiClient.get<User>(`/users/${id}`)
    return data
  },

  async create(dto: CreateUserDto): Promise<User> {
    const { data } = await apiClient.post<User>('/users', dto)
    return data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },
}
```

---

## Atomic Design (Shared Components)

| Level | Contains | Examples | Rules |
|-------|----------|---------|-------|
| **Atoms** | Smallest UI elements | `AppButton`, `AppInput`, `AppBadge` | No business logic. Pure props/emit. |
| **Molecules** | Groups of atoms | `SearchBar`, `FormField`, `UserAvatar` | Minimal logic. Composition of atoms. |
| **Organisms** | Complex UI sections | `NavBar`, `DataTable`, `Sidebar` | May have internal state. Still reusable. |

Naming: Shared components use `App` prefix — `AppButton.vue`, `AppModal.vue`.

---

## TypeScript Conventions

```typescript
// Types file: modules/users/types/user.types.ts
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: Date
}

export enum UserRole {
  Admin = 'admin',
  Editor = 'editor',
  Viewer = 'viewer',
}

export interface CreateUserDto {
  name: string
  email: string
  role: UserRole
}

export interface UpdateUserDto extends Partial<CreateUserDto> {}
```

---

## Routing

```typescript
// modules/auth/routes/auth.routes.ts
import type { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../containers/LoginContainer.vue'),
    meta: { requiresAuth: false, layout: 'auth' },
  },
]

// router/index.ts — aggregates all module routes
import { authRoutes } from '@/modules/auth/routes/auth.routes'
import { userRoutes } from '@/modules/users/routes/user.routes'

const routes: RouteRecordRaw[] = [
  ...authRoutes,
  ...userRoutes,
]
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Do This Instead |
|-------------|---------------|----------------|
| Business logic in components | Violates SoC | Move to composable or store |
| Direct API calls in components | Not testable, not reusable | Use service layer |
| Options API | Inconsistency, worse TypeScript support | Composition API with `<script setup>` |
| Prop drilling 3+ levels | Hard to maintain | Use provide/inject or store |
| `any` type | Defeats TypeScript purpose | Type everything properly |
| CSS in `<style>` without scoped | Style leaking | Always use `<style scoped>` or Tailwind |
| Giant components (200+ lines) | Hard to read/test | Split into container + presentational |

---

## Commands

```bash
# Create new Vue project (Vite)
pnpm create vite@latest web --template vue-ts

# Dev server
pnpm --filter @vera-sesiom/web dev

# Type check
pnpm --filter @vera-sesiom/web type-check

# Lint
pnpm --filter @vera-sesiom/web lint
```

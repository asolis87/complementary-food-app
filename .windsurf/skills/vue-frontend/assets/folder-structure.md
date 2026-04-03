# Vue Frontend — Folder Structure Reference

## Complete Structure

```
apps/web/
├── src/
│   ├── modules/                    # Feature modules (domain-driven)
│   │   ├── {module-name}/
│   │   │   ├── components/         # Presentational (dumb) components
│   │   │   ├── containers/         # Smart components (orchestrate logic)
│   │   │   ├── composables/        # Module-specific composables
│   │   │   ├── stores/             # Pinia stores (one per module)
│   │   │   ├── services/           # API service layer
│   │   │   ├── types/              # TypeScript interfaces and types
│   │   │   ├── routes/             # Vue Router routes for this module
│   │   │   └── index.ts            # Barrel export
│   │   └── ...
│   ├── shared/
│   │   ├── components/
│   │   │   ├── atoms/              # AppButton, AppInput, AppBadge
│   │   │   ├── molecules/          # SearchBar, FormField
│   │   │   └── organisms/          # NavBar, DataTable, Sidebar
│   │   ├── composables/            # useApi, useBreakpoint, useToast
│   │   ├── layouts/                # DefaultLayout, AuthLayout
│   │   ├── types/                  # Global shared types
│   │   └── utils/                  # Pure utility functions
│   ├── router/                     # Vue Router main setup
│   ├── plugins/                    # Vue plugins (i18n, etc.)
│   ├── assets/
│   │   ├── styles/                 # Global CSS / Tailwind config
│   │   └── images/
│   ├── App.vue
│   └── main.ts
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── env.d.ts
```

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Vue component | PascalCase | `UserProfile.vue` |
| Composable | kebab-case with `use-` prefix | `use-auth.ts` |
| Store | kebab-case with `.store` suffix | `auth.store.ts` |
| Service | kebab-case with `.service` suffix | `auth.service.ts` |
| Types | kebab-case with `.types` suffix | `auth.types.ts` |
| Routes | kebab-case with `.routes` suffix | `auth.routes.ts` |
| Utility | kebab-case | `format-date.ts` |
| Test | same name + `.spec.ts` | `UserProfile.spec.ts` |

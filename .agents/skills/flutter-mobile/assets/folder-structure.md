# Flutter Mobile — Folder Structure Reference

## Complete Structure

```
lib/
├── features/                       # Feature modules (domain-driven)
│   └── {feature_name}/
│       ├── domain/
│       │   ├── entities/           # Business entities (freezed)
│       │   ├── value_objects/      # Immutable value types
│       │   ├── repositories/       # Abstract repos (ports)
│       │   └── exceptions/         # Domain-specific errors
│       ├── application/
│       │   ├── use_cases/          # One per business operation
│       │   ├── dtos/               # Data transfer objects
│       │   └── providers/          # Riverpod providers
│       ├── infrastructure/
│       │   ├── repositories/       # Concrete repo implementations
│       │   ├── datasources/        # Remote/local data sources
│       │   └── models/             # API/DB models (serializable)
│       └── presentation/
│           ├── screens/            # Full screens (ConsumerWidget)
│           └── widgets/            # Dumb presentation widgets
├── shared/
│   ├── domain/
│   │   └── value_objects/          # UniqueId, Money, etc.
│   ├── presentation/
│   │   ├── widgets/                # AppButton, AppTextField, etc.
│   │   ├── theme/                  # AppTheme, AppColors, AppTextStyles
│   │   └── layouts/                # MainLayout, AuthLayout
│   └── infrastructure/
│       ├── networking/             # Dio client, interceptors
│       ├── storage/                # Secure storage, shared prefs
│       └── config/                 # Environment config
├── router/
│   └── app_router.dart             # go_router setup
└── main.dart

test/
├── features/
│   └── {feature_name}/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── presentation/
└── shared/
```

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Entity | snake_case | `user.dart` |
| Value Object | snake_case | `email.dart` |
| Repository (abstract) | snake_case + `_repository` | `user_repository.dart` |
| Repository (impl) | snake_case + `_repository_impl` | `user_repository_impl.dart` |
| Use Case | snake_case + `_use_case` | `create_user_use_case.dart` |
| Provider | snake_case + `_providers` | `user_providers.dart` |
| Screen | snake_case + `_screen` | `user_list_screen.dart` |
| Widget | snake_case | `user_card.dart` |
| Model | snake_case + `_model` | `user_model.dart` |
| Datasource | snake_case + `_datasource` | `user_remote_datasource.dart` |
| Test | snake_case + `_test` | `user_repository_test.dart` |

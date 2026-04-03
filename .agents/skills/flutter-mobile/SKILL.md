---
name: flutter-mobile
description: >
  Flutter mobile conventions for Vera Sesiom. Clean Architecture, Riverpod state management, and project structure patterns.
  Trigger: When writing Flutter code, creating widgets, providers, repositories, or structuring a Flutter project.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Creating or modifying Flutter widgets and screens
- Setting up a new Flutter project
- Writing providers, repositories, or use cases
- Deciding widget structure or state management
- Reviewing Flutter code for architecture compliance

---

## Critical Rules

1. **Clean Architecture with Riverpod** — domain/application/infrastructure layers
2. **Riverpod for state management** — no Provider, no Bloc, no GetX
3. **Screaming Architecture** — features scream the domain
4. **Immutable state** — use `freezed` for models and state classes
5. **Dart naming**: `snake_case` for files, `PascalCase` for classes, `camelCase` for variables
6. **No business logic in widgets** — widgets are ONLY UI
7. **go_router for navigation** — declarative routing
8. **Null safety ALWAYS** — no `!` operator unless absolutely necessary (document why)

---

## Project Structure

```
lib/
├── features/                       # Feature modules (Screaming Architecture)
│   ├── auth/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.dart
│   │   │   ├── value_objects/
│   │   │   │   └── email.dart
│   │   │   ├── repositories/       # Abstract repository (port)
│   │   │   │   └── auth_repository.dart
│   │   │   └── exceptions/
│   │   │       └── auth_exception.dart
│   │   ├── application/
│   │   │   ├── use_cases/
│   │   │   │   ├── login_use_case.dart
│   │   │   │   └── register_use_case.dart
│   │   │   ├── dtos/
│   │   │   │   └── login_dto.dart
│   │   │   └── providers/
│   │   │       └── auth_providers.dart
│   │   └── infrastructure/
│   │       ├── repositories/
│   │       │   └── auth_repository_impl.dart
│   │       ├── datasources/
│   │       │   ├── auth_remote_datasource.dart
│   │       │   └── auth_local_datasource.dart
│   │       └── models/
│   │           └── user_model.dart
│   ├── users/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │       ├── screens/
│   │       │   └── user_list_screen.dart
│   │       ├── widgets/
│   │       │   ├── user_card.dart
│   │       │   └── user_avatar.dart
│   │       └── providers/
│   │           └── user_list_provider.dart
│   └── home/
├── shared/
│   ├── domain/
│   │   └── value_objects/
│   │       └── unique_id.dart
│   ├── presentation/
│   │   ├── widgets/                # Shared widgets
│   │   │   ├── app_button.dart
│   │   │   ├── app_text_field.dart
│   │   │   └── app_loading.dart
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   ├── app_colors.dart
│   │   │   └── app_text_styles.dart
│   │   └── layouts/
│   │       └── main_layout.dart
│   └── infrastructure/
│       ├── networking/
│       │   ├── api_client.dart
│       │   └── interceptors/
│       │       └── auth_interceptor.dart
│       ├── storage/
│       │   └── secure_storage.dart
│       └── config/
│           └── env_config.dart
├── router/
│   └── app_router.dart
└── main.dart
```

---

## Patterns

### Entity with Freezed

```dart
// features/users/domain/entities/user.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';

@freezed
class User with _$User {
  const factory User({
    required String id,
    required String name,
    required String email,
    required UserRole role,
    required bool isActive,
  }) = _User;
}

enum UserRole { admin, editor, viewer }
```

### Repository Port (Abstract)

```dart
// features/users/domain/repositories/user_repository.dart
import '../entities/user.dart';

abstract class UserRepository {
  Future<List<User>> getAll();
  Future<User?> getById(String id);
  Future<void> create(User user);
  Future<void> delete(String id);
}
```

### Repository Adapter (Implementation)

```dart
// features/users/infrastructure/repositories/user_repository_impl.dart
import '../../domain/entities/user.dart';
import '../../domain/repositories/user_repository.dart';
import '../datasources/user_remote_datasource.dart';

class UserRepositoryImpl implements UserRepository {
  final UserRemoteDatasource _remote;

  UserRepositoryImpl(this._remote);

  @override
  Future<List<User>> getAll() async {
    final models = await _remote.fetchUsers();
    return models.map((m) => m.toDomain()).toList();
  }

  @override
  Future<User?> getById(String id) async {
    final model = await _remote.fetchUserById(id);
    return model?.toDomain();
  }
}
```

### Use Case

```dart
// features/users/application/use_cases/get_users_use_case.dart
import '../../domain/entities/user.dart';
import '../../domain/repositories/user_repository.dart';

class GetUsersUseCase {
  final UserRepository _repository;

  GetUsersUseCase(this._repository);

  Future<List<User>> execute() {
    return _repository.getAll();
  }
}
```

### Riverpod Providers

```dart
// features/users/application/providers/user_providers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/user_repository.dart';
import '../../infrastructure/repositories/user_repository_impl.dart';
import '../use_cases/get_users_use_case.dart';

// Infrastructure
final userRepositoryProvider = Provider<UserRepository>(
  (ref) => UserRepositoryImpl(ref.read(userRemoteDatasourceProvider)),
);

// Use Cases
final getUsersUseCaseProvider = Provider(
  (ref) => GetUsersUseCase(ref.read(userRepositoryProvider)),
);

// State
final usersProvider = FutureProvider<List<User>>((ref) {
  return ref.read(getUsersUseCaseProvider).execute();
});
```

### Screen (Presentation)

```dart
// features/users/presentation/screens/user_list_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../application/providers/user_providers.dart';
import '../widgets/user_card.dart';

class UserListScreen extends ConsumerWidget {
  const UserListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usersAsync = ref.watch(usersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Users')),
      body: usersAsync.when(
        data: (users) => ListView.builder(
          itemCount: users.length,
          itemBuilder: (context, index) => UserCard(user: users[index]),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
      ),
    );
  }
}
```

---

## Navigation (go_router)

```dart
// router/app_router.dart
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/users/presentation/screens/user_list_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/users',
      builder: (context, state) => const UserListScreen(),
    ),
  ],
);
```

---

## Key Dependencies

```yaml
# pubspec.yaml
dependencies:
  flutter_riverpod: ^2.0.0
  freezed_annotation: ^2.0.0
  go_router: ^14.0.0
  dio: ^5.0.0
  flutter_secure_storage: ^9.0.0

dev_dependencies:
  freezed: ^2.0.0
  build_runner: ^2.0.0
  json_serializable: ^6.0.0
  mocktail: ^1.0.0
```

---

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Business logic in widgets | Move to use case or provider |
| `setState()` for shared state | Use Riverpod providers |
| Direct HTTP calls in widgets | Use repository + datasource |
| Mutable state objects | Use `freezed` for immutability |
| Navigator 1.0 | Use `go_router` |
| Force unwrap `!` without reason | Handle null properly or document why |

---

## Commands

```bash
# Run code generation (freezed, json_serializable)
dart run build_runner build --delete-conflicting-outputs

# Run tests
flutter test

# Run on device
flutter run

# Analyze code
flutter analyze

# Format code
dart format .
```

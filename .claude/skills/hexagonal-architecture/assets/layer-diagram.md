# Hexagonal Architecture — Layer Diagram

## Visual Representation

```
                    ┌──────────────────────────────────────────────┐
                    │              INFRASTRUCTURE                   │
                    │                                              │
                    │   ┌──────────┐  ┌─────────┐  ┌──────────┐  │
                    │   │Controllers│  │ DB Repos │  │ External │  │
                    │   │ (HTTP In) │  │(Storage) │  │  APIs    │  │
                    │   └─────┬─────┘  └─────┬────┘  └─────┬────┘  │
                    │         │              │              │       │
                    ├─────────┼──────────────┼──────────────┼───────┤
                    │         ▼              ▲              ▲       │
                    │              APPLICATION                      │
                    │                                              │
                    │   ┌──────────────────────────────────────┐   │
                    │   │            USE CASES                  │   │
                    │   │                                      │   │
                    │   │   CreateUser    GetUserById           │   │
                    │   │   UpdateOrder   ProcessPayment        │   │
                    │   └──────────────────┬───────────────────┘   │
                    │                      │                       │
                    ├──────────────────────┼───────────────────────┤
                    │                      ▼                       │
                    │               DOMAIN                         │
                    │                                              │
                    │   ┌──────────┐  ┌──────────┐  ┌──────────┐  │
                    │   │ Entities │  │  Value    │  │  Ports   │  │
                    │   │          │  │ Objects   │  │(Interfaces│  │
                    │   │  User    │  │  Email    │  │          │  │
                    │   │  Order   │  │  Money    │  │UserRepo  │  │
                    │   │  Product │  │  Address  │  │EmailPort │  │
                    │   └──────────┘  └──────────┘  └──────────┘  │
                    │                                              │
                    └──────────────────────────────────────────────┘
```

## Dependency Direction

```
Infrastructure ──depends on──→ Application ──depends on──→ Domain
                                                            │
                                                            ▼
                                                    Depends on NOTHING
```

## Port / Adapter Relationship

```
┌─────────────────────┐         ┌─────────────────────────┐
│      DOMAIN         │         │     INFRASTRUCTURE      │
│                     │         │                         │
│  UserRepository ◄───┼─────────┼── UserRepositoryImpl    │
│  (PORT/Interface)   │implements│  (ADAPTER/Concrete)     │
│                     │         │                         │
│  EmailSenderPort ◄──┼─────────┼── SESEmailSender        │
│  (PORT/Interface)   │implements│  (ADAPTER/Concrete)     │
│                     │         │                         │
└─────────────────────┘         └─────────────────────────┘
```

## Module Boundary (Screaming Architecture)

```
src/
├── users/          ← Module = Bounded Context
│   ├── domain/     ← Pure business logic, NO dependencies
│   ├── application/← Orchestration, depends on domain
│   └── infrastructure/ ← Real world, depends on application + domain
│
├── orders/         ← Another Bounded Context
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
└── shared/         ← Cross-cutting, used by multiple modules
    ├── domain/     ← Shared value objects, base interfaces
    ├── application/← Shared interfaces (UseCase, etc.)
    └── infrastructure/ ← Config, middleware, DI
```

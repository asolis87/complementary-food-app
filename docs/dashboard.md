# Pakulab Dashboard — Diseño Final

**Última actualización:** 2026-05-04  
**Estado:** ✅ Diseño validado en Stitch (Mobile + Desktop) — Listo para implementación

**Stitch Project:** `projects/15274727116756488282`  
**Screens:**
- Mobile: `c860577aa7054952b9ba8bf6deef5b15` (v2)
- Desktop: `537701d3706641f6aca1b9203455bf46` (v2)

---

## 🎯 Principios de Diseño

1. **De accionable a informativo** — Lo más importante arriba
2. **Sin métricas vanidosas** — Todo debe llevar a una acción
3. **Tips validados, sin inventar** — Solo lo que podemos respaldar
4. **Simple y directo** — "Esta semana fue mayormente equilibrada 🟢"

---

## 📐 Estructura del Dashboard (6 Secciones)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Contexto                                               │
│  🌅 Hola, Ana · 👶 Mateo (8 meses) · 52 días en AC  [Pro]      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  1. ACCIÓN RÁPIDA (lo más usado - arriba del todo)             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ¿Qué comió Mateo hoy?                                  │   │
│  │  [📝 Desayuno]  [📝 Comida]  [📝 Cena]  [📝 Snack]     │   │
│  │  (cada botón muestra ✅ si ya está registrado)          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐ ┌───────────────────────────────────┐
│  2. ALIMENTO SUGERIDO    │ │  3. ALÉRGENOS PENDIENTES          │
│     (3 opciones por edad)│ │                                   │
│                          │ │  ⚠️ Por edad (8+ meses):          │
│  🥚 Huevo                │ │  🥜 Maní                          │
│  Ideal para esta edad    │ │  🐟 Pescado                       │
│  Alto en proteína        │ │  🥛 Lácteos (yogurt)              │
│                          │ │                                   │
│  🍠 Camote               │ │  [Ver cómo introducir →]         │
│  Suave para el estómago  │ │                                   │
│                          │ │                                   │
│  🍗 Pollo                │ │                                   │
│  Fácil de digerir        │ │                                   │
│                          │ │                                   │
│  [Ver más opciones →]    │ │                                   │
└──────────────────────────┘ └───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  4. ROADMAP DE ALIMENTOS (prioridad #1)                        │
│                                                                 │
│  🥦 Verduras  60% ████████████░░░░░░░░  6/10 probados          │
│     🥕 Zanahoria ✅  🥦 Brócoli ✅  🥬 Espinaca ⏳             │
│                                                                 │
│  🍎 Frutas    40% ████████░░░░░░░░░░░░  4/10 probados          │
│     🍎 Manzana ✅  🍌 Plátano ❌  🍐 Pera ⏳                   │
│                                                                 │
│  🍗 Proteínas 30% ██████░░░░░░░░░░░░░░  3/10 probados          │
│     🍗 Pollo ✅  🥩 Res ⏳  🐟 Pescado ⏳                       │
│                                                                 │
│  🌾 Cereales   50% ██████████░░░░░░░░░░  5/10 probados         │
│     🍚 Arroz ✅  🍞 Pan ⏳  🌽 Maíz ✅                         │
│                                                                 │
│  [Ver roadmap completo →]                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  5. REGISTROS DE HOY (edición rápida)                          │
│                                                                 │
│  🌞 Desayuno  08:30 AM                                         │
│  Manzana rallada con avena                                     │
│  🍎 Manzana 👍  [Editar]                                       │
│                                                                 │
│  ☀️ Comida    01:15 PM                                         │
│  Tiritas de pollo con zanahoria                                │
│  🍗 Pollo ✅  🥕 Zanahoria ✅  [Editar]                        │
│                                                                 │
│  🌙 Cena      ⏳ Pendiente                                      │
│  [Registrar →]                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  6. INSIGHT A/L (tu diferenciador único)                       │
│                                                                 │
│  Esta semana fue mayormente equilibrada 🟢                     │
│                                                                 │
│  💡 Tip: La avena es suave para el estómago. Combiná con       │
│      frutas como manzana para mantener el equilibrio.          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Especificaciones por Sección

### Header: Contexto

**Propósito:** Dar contexto inmediato sin ocupar espacio de cards.

**Contenido:**
- Saludo con emoji temporal (🌅 mañana, ☀️ tarde, 🌙 noche)
- Nombre del usuario
- Nombre del bebé + edad en meses
- Días en alimentación complementaria
- Badge "Pro" si corresponde

**Comportamiento:**
- Si hay múltiples bebés → dropdown para cambiar
- Click en el header → ir a perfil del bebé

---

### 1. Acción Rápida

**Propósito:** Registrar comidas del día en 1 click.

**Contenido:**
- 4 botones: Desayuno, Comida, Cena, Snack
- Cada botón muestra:
  - Icono + nombre de la comida
  - Estado: ⏳ pendiente, ✅ registrado, 🕐 hora registrada
  - Badge con cantidad de alimentos si ya está registrado

**Comportamiento:**
- Click → abre modal de registro directo (no vista intermedia)
- Si ya está registrado → muestra resumen con opción "Editar" o "Agregar más"
- Modal debe pre-seleccionar la comida correspondiente

**Estados:**
```
⏳ Pendiente     → Botón blanco, borde punteado
🕐 Registrado    → Botón verde, muestra hora
✅ Completado    → Botón verde sólido (todas las comidas del día)
```

---

### 2. Alimentos Sugeridos

**Propósito:** Sugerir próximos alimentos basados en edad + historial.

**Contenido:**
- 3 tarjetas horizontales (scroll horizontal en móvil)
- Cada tarjeta muestra:
  - Emoji + nombre del alimento
  - Edad mínima (ej: "8+ meses")
  - Beneficio clave (ej: "Alto en proteína")
  - Estado: ⏳ pendiente, ✅ ya probado, ❌ rechazado

**Criterios de selección:**
1. Edad apropiada (≥ edad del bebé)
2. No probado en los últimos 30 días (o nunca probado)
3. Priorizar por:
   - Alérgenos pendientes (ventana 6-12 meses)
   - Variedad de grupos (si comió mucha fruta, sugerir proteína)
   - Estacionalidad (opcional)

**Comportamiento:**
- Click en tarjeta → abre detalle del alimento con:
  - Descripción
  - Instrucciones de preparación
  - Recetas sugeridas (si existen)
  - Botón "Registrar como probado"

---

### 3. Alérgenos Pendientes

**Propósito:** Alertar sobre ventana de oportunidad (6-12 meses).

**Contenido:**
- Lista de alérgenos comunes no introducidos:
  - 🥜 Maní
  - 🥚 Huevo
  - 🐟 Pescado
  - 🥛 Lácteos (yogurt, queso)
  - 🌾 Trigo
  - 🫘 Soja
- Edad recomendada para cada uno
- Link a "Guía de introducción segura"

**Criterios:**
- Mostrar solo si bebé tiene ≥6 meses
- Ocultar alérgenos ya introducidos sin reacción
- Marcar en rojo si bebé tiene ≥10 meses y no introdujo (ventana cerrándose)

**Comportamiento:**
- Click en "Ver cómo introducir" → modal con:
  - Pasos para introducir (cantidad pequeña, esperar 3-5 días)
  - Signos de reacción alérgica a observar
  - Qué hacer si hay reacción

---

### 4. Roadmap de Alimentos

**Propósito:** Mostrar progreso general por categoría.

**Contenido:**
- 5 categorías: Verduras, Frutas, Proteínas, Cereales, Grasas Saludables
- Cada categoría muestra:
  - Emoji + nombre
  - Barra de progreso (% y X/Y probados)
  - 3-5 chips de alimentos (los más recientes o próximos)
  - Estado en chip: ✅ probado, ❌ rechazado, ⏳ pendiente

**Comportamiento:**
- Click en "Ver roadmap completo" → vista completa con:
  - Todos los alimentos por categoría
  - Filtros: probados, pendientes, rechazados
  - Búsqueda
  - Opción de marcar como probado directamente

---

### 5. Registros de Hoy

**Propósito:** Ver y editar registros del día rápidamente.

**Contenido:**
- Lista cronológica de comidas registradas hoy
- Cada registro muestra:
  - Icono + nombre de comida + hora
  - Descripción (primera línea)
  - Alimentos con estado (👍 tolerado, ❌ rechazado, ✅ neutro)
  - Botón "Editar" (abre modal en modo edición)

**Estados:**
- ⏳ Pendiente → muestra botón "Registrar"
- ✅ Registrado → muestra resumen + "Editar"

**Comportamiento:**
- Click en "Editar" → mismo modal de registro, pre-llenado
- Click en alimento → ver detalle del alimento
- Swipe en móvil → acciones rápidas (editar, duplicar, eliminar)

---

### 6. Insight A/L

**Propósito:** Mostrar tu diferenciador único de forma simple.

**Contenido:**
- Resumen semanal del balance:
  - "Esta semana fue mayormente equilibrada 🟢"
  - O "Esta semana fue mayormente laxante 🟠"
  - O "Esta semana fue mayormente astringente 🔴"
- 1 tip rotativo (sin citar fuentes específicas)

**Tips válidos (basados en tu DB de alimentos):**
```
💡 La avena es suave para el estómago.
💡 Las zanahorias cocidas son fáciles de digerir.
💡 El pollo es una proteína magra ideal para bebés.
💡 Las frutas como la manzana aportan fibra natural.
💡 El camote es nutritivo y de sabor dulce natural.
💡 Combinar cereales con verduras da energía sostenida.
💡 Las proteínas ayudan al crecimiento del bebé.
💡 Los tubérculos son fáciles de preparar y nutritivos.
```

**Criterios:**
- NO mostrar porcentajes exactos (60% equilibrado, etc.)
- NO citar fuentes que no tenés validadas
- Tips deben derivarse de propiedades reales de alimentos en tu DB

**Comportamiento:**
- Click en la card → ver historial A/L de la semana (gráfico simple)
- Tip cambia cada vez que entra al dashboard (rotación aleatoria)

---

## 📱 Responsive Behavior

| Sección | Móvil (320-767px) | Tablet (768-1023px) | Desktop (1024px+) |
|---------|-------------------|---------------------|-------------------|
| **Navegación** | Bottom nav (5 items: Plato, Alimentos, Menú Pro, Bitácora, Perfil) | Bottom nav | Top nav en header (64px, glassmorphism) |
| **Header/Contexto** | 1-2 líneas | 1 línea | 1 línea, tipografía más grande |
| **Acción Rápida** | ❌ Eliminado (redundante) | ❌ Eliminado | ❌ Eliminado |
| **Alimentos Sugeridos** | 3 tarjetas scroll horizontal | 2 columnas | 3 tarjetas verticales (Col 2) |
| **Alérgenos Pendientes** | Debajo de sugeridos | Debajo de sugeridos | Debajo de sugeridos (Col 2) |
| **Registros de Hoy** | 1 col (full width) | 1 col | Col 1 (lista vertical completa) |
| **Roadmap** | 1 col, barras horizontales | 2 cols, barras horizontales | Col 3, 5 barras verticales |
| **Insight A/L** | 1 col (full width) | 1 col (full width) | Full width (3 cols, fila inferior) |
| **Quick Stats** | ❌ Eliminado (métricas vanidosas) | ❌ Eliminado | ❌ Eliminado |

**Layout Mobile:** Stack vertical (1 columna)  
**Layout Desktop:** Bento Grid 3 columnas

```
MOBILE (stack vertical):
┌─────────────────────┐
│   Header/Contexto   │
├─────────────────────┤
│  Alimentos Sugeridos│
├─────────────────────┤
│  Alérgenos Pendientes│
├─────────────────────┤
│   Registros de Hoy  │
├─────────────────────┤
│      Roadmap        │
├─────────────────────┤
│    Insight A/L      │
├─────────────────────┤
│    Bottom Nav       │
└─────────────────────┘

DESKTOP (Bento Grid 3 cols):
┌─────────────────────────────────────────────────┐
│  Header (Top Nav: Plato, Alimentos, Bitácora…) │
├─────────────────────────────────────────────────┤
│  Contexto: "🌅 Hola, Ana" + info bebé          │
├──────────────┬──────────────────┬───────────────┤
│  Registros   │  Sugeridos       │   Roadmap     │
│  de Hoy      │  + Alérgenos     │               │
│  (Col 1)     │  (Col 2)         │   (Col 3)     │
├──────────────┴──────────────────┴───────────────┤
│  Insight A/L (Full Width - 3 columnas)          │
└─────────────────────────────────────────────────┘
```

---

## 🔗 Navegación

**Bottom Nav (móvil):**
- 🏠 Home (dashboard) — activo
- 🗺️ Roadmap (vista completa)
- 🍽️ Plates (armar plato)
- 👤 Perfil (bébés, configuración)

**Top Nav (desktop):**
- Logo Pakulab (click → home)
- Home, Roadmap, Plates, Perfil
- Notificaciones (campana)
- Settings (engranaje)
- Avatar (dropdown → perfil, cerrar sesión)

---

## 🧩 Componentes Necesarios (Frontend)

| Componente | Módulo | Estado |
|------------|--------|--------|
| `QuickActionsCard` | `dashboard/` | 🔲 Nuevo |
| `SuggestedFoodsCard` | `dashboard/` | 🔲 Nuevo |
| `AllergenAlertsCard` | `dashboard/` | 🔲 Nuevo |
| `FoodRoadmapCard` | `dashboard/` | 🔲 Nuevo (refactorizar existente) |
| `TodayLogsCard` | `dashboard/` | 🔲 Nuevo |
| `BalanceInsightCard` | `dashboard/` | 🔲 Nuevo |
| `FoodRegistrationModal` | `diary/` | 🔲 Nuevo |
| `FoodChip` | `foods/` | ✅ Reutilizar |
| `ProgressBar` | `shared/` | ✅ Reutilizar |

---

## 📡 Endpoints Necesarios (Backend)

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `GET /api/dashboard` | GET | Datos consolidados del dashboard |
| `GET /api/dashboard/suggestions` | GET | Alimentos sugeridos por edad |
| `GET /api/dashboard/allergens` | GET | Alérgenos pendientes |
| `GET /api/dashboard/roadmap` | GET | Progreso por categoría |
| `GET /api/dashboard/today` | GET | Registros de hoy |
| `GET /api/dashboard/balance` | GET | Balance A/L de la semana |
| `POST /api/diary/entries` | POST | Registrar comida (desde modal) |
| `PUT /api/diary/entries/:id` | PUT | Editar registro |

**Respuesta de `GET /api/dashboard`:**
```typescript
{
  baby: {
    name: "Mateo",
    ageInMonths: 8,
    daysInComplementaryFeeding: 52
  },
  userTier: "pro",
  todayLogs: [...],
  suggestedFoods: [...],
  pendingAllergens: [...],
  roadmapProgress: {...},
  weeklyBalance: "balanced" | "laxative" | "astringent"
}
```

---

## ✅ Criterios de Aceptación

### Funcionales
- [ ] El dashboard carga en <2 segundos (con cache)
- [ ] Los botones de acción rápida abren modal de registro directo
- [ ] Los alimentos sugeridos se actualizan cada 24 horas
- [ ] Los alérgenos pendientes ocultan los ya introducidos
- [ ] El roadmap muestra % real basado en alimentos probados
- [ ] Los registros de hoy permiten edición rápida
- [ ] El insight A/L muestra mensaje simple (sin porcentajes)

### No Funcionales
- [ ] Responsive: móvil (320px+) → tablet (768px+) → desktop (1024px+)
- [ ] Accesible: navegación por teclado, ARIA labels
- [ ] Offline: muestra datos cacheados + indicador "Sin conexión"
- [ ] PWA: instalable, icono correcto, splash screen

---

## 🚀 Próximos Pasos

1. **✅ Validar diseño** → COMPLETADO (este documento + Stitch)
2. **✅ Diseñar en Stitch** → COMPLETADO (Mobile v2 + Desktop v2)
3. **🔲 Implementar backend** → Endpoints de dashboard
4. **🔲 Implementar frontend** → Components Vue 3 + integración
5. **🔲 Testear con usuarios** → 3-5 padres reales, observar uso

---

## 📝 Notas de Diseño

### Decisiones Clave

**Por qué eliminamos ciertas cards:**
- ❌ **"Acción Rápida"** → Redundante con "Registros de Hoy". Un bebé de 8 meses no come snacks, solo desayuno, almuerzo y cena. Mantuvimos solo Registros.
- ❌ **"Quick Stats"** → Métricas vanidosas (45 registros totales, 18 alimentos únicos). No son accionables, no le cambian el día a Ana.
- ❌ **"Estado de Suscripción"** → El badge "Pro" en header alcanza. No necesita card entera.
- ❌ **"BabyInfoCard"** → La info del bebé es contexto, no el foco. Movido al header.

**Por qué agregamos/ajustamos estas cards:**
- ✅ **"Alimentos Sugeridos" separado de "Alérgenos"** → Antes estaban superpuestos. Ahora son 2 secciones distintas (una arriba de otra).
- ✅ **"Alérgenos Pendientes"** → Ventana de oportunidad 6-12 meses. Es información crítica que los padres necesitan.
- ✅ **"Insight A/L full width en desktop"** → Tu diferenciador único merece protagonismo. Ahora ocupa todo el ancho.
- ✅ **Bottom Nav actualizado** → Coincide con la navegación real del proyecto (Plato, Alimentos, Menú Pro, Bitácora, Perfil).

### Principios de Diseño

1. **De accionable a informativo** — Lo más importante arriba (Registros de Hoy)
2. **Sin métricas vanidosas** — Todo debe llevar a una acción
3. **Tips validados, sin inventar** — Solo lo que podemos respaldar con la DB de alimentos
4. **Simple y directo** — "Esta semana fue mayormente equilibrada 🟢" (sin porcentajes)
5. **Bento Grid** — Modulariza información compleja en cards digeribles
6. **Mobile-first, desktop-enhanced** — Stack vertical en mobile, Bento 3 cols en desktop

### Tips Válidos (basados en tu DB de alimentos)

Los tips deben derivarse de propiedades reales de alimentos en tu base de datos. Ejemplos:

```
💡 La avena es suave para el estómago.
💡 Las zanahorias cocidas son fáciles de digerir.
💡 El pollo es una proteína magra ideal para bebés.
💡 Las frutas como la manzana aportan fibra natural.
💡 El camote es nutritivo y de sabor dulce natural.
💡 Combinar cereales con verduras da energía sostenida.
💡 Las proteínas ayudan al crecimiento del bebé.
💡 Los tubérculos son fáciles de preparar y nutritivos.
```

**NO mostrar:**
- ❌ Porcentajes exactos ("60% equilibrado, 30% laxante, 10% astringente")
- ❌ Citas de fuentes que no tenés validadas (AAP, ESPGHAN, etc.)
- ❌ Consejos médicos no verificados

**Criterios para tips:**
- Máximo 1 tip por vez (rotativo)
- Basado en propiedades reales de alimentos en tu DB
- Lenguaje simple, sin tecnicismos
- Accionable inmediatamente

---

## 🎨 Referencias Visuales

**Dashboard moderno Bento Grid:**
- Linear.app dashboard
- Notion home
- Headspace progress

**Cards de progreso:**
- Duolino streak
- Fitbit activity rings
- Strava weekly summary

**Modal de registro:**
- Airbnb date picker
- Uber Eats item customization

---

**Documento vivo.** Actualizar según feedback de implementación y usuarios.
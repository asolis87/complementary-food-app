# Pakulab — Paleta de Marca y Sistema de Diseño

Sistema basado en **Material Design 3** (MD3). Estilo: cálido, natural, infantil-pero-confiable. Verde principal (Pakulab Green) + acentos cálidos (terracota/peach + amarillo dorado).

## Colores principales

### Primary — Pakulab Green
| Token | Hex | Uso |
|---|---|---|
| `primary` | `#00694b` | Botones CTA, links, acentos principales |
| `primary-dim` | `#005b41` | Hover de CTA |
| `on-primary` | `#c7ffe3` | Texto/íconos sobre primary |
| `primary-container` | `#8cfece` | Chips, badges, fondos suaves |
| `on-primary-container` | `#006145` | Texto sobre primary-container |

### Secondary — Warm Brown / Peach
| Token | Hex | Uso |
|---|---|---|
| `secondary` | `#864d2c` | Acento cálido secundario |
| `secondary-dim` | `#784121` | Hover secundario |
| `on-secondary` | `#fff0e9` | Texto sobre secondary |
| `secondary-container` | `#ffc5a7` | Fondos de tarjetas cálidas |
| `on-secondary-container` | `#6e391a` | Texto sobre secondary-container |

### Tertiary — Golden Yellow
| Token | Hex | Uso |
|---|---|---|
| `tertiary` | `#705900` | Acento dorado |
| `tertiary-dim` | `#624d00` | Hover dorado |
| `on-tertiary` | `#fff2d4` | Texto sobre tertiary |
| `tertiary-container` | `#f9d461` | Highlights, banners destacados |
| `on-tertiary-container` | `#5c4900` | Texto sobre tertiary-container |

### Error
| Token | Hex |
|---|---|
| `error` | `#b31b25` |
| `on-error` | `#ffefee` |
| `error-container` | `#fb5151` |
| `on-error-container` | `#570008` |

## Superficies (No-Line Rule — jerarquía por elevación, no por bordes)

| Token | Hex | Uso |
|---|---|---|
| `surface` | `#f5f7f7` | Fondo base de la app |
| `surface-dim` | `#d0d5d6` | Fondo apagado |
| `surface-bright` | `#f5f7f7` | Fondo brillante |
| `surface-container-lowest` | `#ffffff` | Tarjetas elevadas (blanco puro) |
| `surface-container-low` | `#eef1f1` | Contenedor sutil |
| `surface-container` | `#e5e9e9` | Contenedor estándar |
| `surface-container-high` | `#dfe3e3` | Contenedor elevado |
| `surface-container-highest` | `#d9dede` | Máxima elevación de superficie |

### Texto sobre superficie
| Token | Hex |
|---|---|
| `on-surface` | `#2c2f30` (texto principal) |
| `on-surface-variant` | `#595c5c` (texto secundario) |
| `outline` | `#747778` (bordes) |
| `outline-variant` | `#abadae` (bordes sutiles) |

### Inverse (modo oscuro de spots)
| Token | Hex |
|---|---|
| `inverse-surface` | `#0b0f0f` |
| `inverse-on-surface` | `#9b9d9e` |
| `inverse-primary` | `#8cfece` |

## Colores de grupos alimenticios (categorías de producto)

| Grupo | Fondo | Texto |
|---|---|---|
| Cereales | `#8cfece` | `#004d36` |
| Frutas | `#ffc5a7` | `#6e391a` |
| Verduras | `#7eefc0` | `#004d36` |
| Proteínas | `#feb289` | `#6e391a` |
| Grasas | `#d3bcfd` | `#3b1f8c` |

## Gradientes

```css
gradient-cta:        linear-gradient(135deg, #00694b 0%, #005b41 100%);
gradient-cta-hover:  linear-gradient(135deg, #005b41 0%, #004d36 100%);
```

## Sombras (ambient, sin bordes duros)

```css
shadow-ambient:  0 32px 48px -12px rgba(44, 47, 48, 0.06);
shadow-soft:     0 16px 32px -8px  rgba(44, 47, 48, 0.04);
shadow-card:     0 4px 16px -4px   rgba(44, 47, 48, 0.08);
shadow-elevated: 0 8px 32px -8px   rgba(44, 47, 48, 0.12);
```

## Glassmorphism

```css
glass-bg:        rgba(245, 247, 247, 0.8);
glass-blur:      blur(20px);
glass-blur-sm:   blur(12px);
ghost-border:    rgba(123, 129, 127, 0.15);
```

## Tipografía

| Rol | Fuente |
|---|---|
| Headlines | **Plus Jakarta Sans** (system-ui fallback) |
| Body | **Be Vietnam Pro** (system-ui fallback) |
| Labels | **Be Vietnam Pro** |

### Escala
| Token | Tamaño |
|---|---|
| display-lg | 3.5rem |
| display-md | 2.75rem |
| headline-lg | 2rem |
| headline-md | 1.75rem |
| headline-sm | 1.25rem |
| title-lg | 1.375rem |
| title-md | 1rem |
| body-lg | 1rem |
| body-md | 0.875rem |
| body-sm | 0.75rem |
| label-lg | 0.875rem |
| label-md | 0.75rem |
| label-sm | 0.6875rem |

### Pesos
- Regular 400 · Medium 500 · Semibold 600 · Bold 700

### Tracking
- Display: `-0.02em` · Headline: `-0.01em` · Label: `+0.02em`

## Forma (radios)

| Token | Valor |
|---|---|
| rounded-sm | 0.5rem (8px) |
| rounded-md | 1rem (16px) |
| rounded-lg | 2rem (32px) |
| rounded-xl | 3rem (48px) |
| rounded-full | 9999px |

> Convención: tarjetas y contenedores usan `rounded-lg` (2rem). Botones `rounded-full`. Inputs/chips `rounded-md`.

## Espaciado

| Token | Valor |
|---|---|
| space-1 | 0.25rem |
| space-2 | 0.5rem |
| space-3 | 1rem |
| space-4 | 1.4rem |
| space-5 | 1.625rem |
| space-6 | 2rem |
| space-8 | 2.75rem |
| space-12 | 4rem |
| space-16 | 5.5rem |

## Transiciones

```css
transition-fast:   150ms ease;
transition-normal: 250ms ease;
```

---

## Prompt sugerido para IA de diseño

> Diseñá una landing page para **Pakulab**, una app de alimentación complementaria para bebés (6–24 meses).
>
> **Personalidad de marca**: cálida, natural, confiable, no infantilizada. El público son padres jóvenes que valoran la salud y la simplicidad.
>
> **Sistema visual** (Material Design 3, "No-Line Rule" — jerarquía por elevación y color de superficie, no por bordes):
> - **Primary**: verde profundo `#00694b` (CTAs, links).
> - **Primary container** (acentos suaves): `#8cfece` con texto `#006145`.
> - **Secondary** (cálido): `#864d2c` / container `#ffc5a7`.
> - **Tertiary** (dorado): `#705900` / container `#f9d461`.
> - **Fondo base**: `#f5f7f7`. Tarjetas blancas `#ffffff` con sombra ambiente muy suave (`0 32px 48px -12px rgba(44,47,48,0.06)`).
> - **Texto principal**: `#2c2f30`. Secundario: `#595c5c`.
> - **CTA gradient**: `linear-gradient(135deg, #00694b, #005b41)`.
>
> **Tipografía**:
> - Headlines en **Plus Jakarta Sans**, tracking negativo (-0.02em en display, -0.01em en headline), peso 600–700.
> - Body en **Be Vietnam Pro**, peso 400–500.
>
> **Forma**: radios generosos. Tarjetas con `border-radius: 2rem`. Botones pill (`9999px`). Sin bordes visibles, jerarquía por elevación.
>
> **Estilo**: glassmorphism sutil opcional (`backdrop-filter: blur(20px)` sobre `rgba(245,247,247,0.8)`). Mucho aire/whitespace. Imágenes de bebés/comida real, sin ilustraciones excesivamente caricaturescas.
>
> **Secciones**: hero con CTA primario y secundario, propuesta de valor en 3 cards, testimonios, plan/pricing, footer.

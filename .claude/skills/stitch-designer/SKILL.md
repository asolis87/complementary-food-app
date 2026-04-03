---
name: stitch-designer
description: >
  Guided UI design discovery and screen generation workflow using Google Stitch MCP.
  From vision to design system to screens to code — bridging design to Vue and Astro.
  Trigger: When starting a new UI design, creating screens with Stitch, building design systems, or bridging design to code.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Starting a new project that needs UI design before coding
- User doesn't have a defined visual identity yet
- Creating landing pages, web apps, or mobile screens from scratch
- Redesigning an existing product's UI
- Exploring visual directions before committing to code
- User mentions Stitch, design system, screen generation, or visual design
- Bridging a Stitch design to Vue components or Astro pages

**NOT for:**
- Projects with an existing, finalized design system (just use `vue-frontend` or `astro-landing` directly)
- Quick UI tweaks that don't need discovery (edit the component directly)

---

## Critical Rules

1. **ALWAYS start with Discovery** — never generate screens without understanding the user's vision first
2. **Create the Design System BEFORE generating screens** — tokens first, screens second
3. **Use GEMINI_3_1_PRO for quality, GEMINI_3_FLASH for speed** — initial generation = PRO, quick iterations = FLASH
4. **Generate at least 3 variants before settling** — users can't judge direction from a single option
5. **Get EXPLICIT user approval** before moving to Design-to-Code phase — never assume approval
6. **Map every Stitch token to code tokens** — CSS variables, Tailwind config, or Flutter theme data
7. **Never hardcode colors or fonts in components** — always reference design tokens
8. **Follow the 5 phases IN ORDER** — Discovery → Design System → Screens → Iteration → Design-to-Code

---

## The Five Phases

```
Phase 1          Phase 2            Phase 3             Phase 4          Phase 5
DISCOVERY  →  DESIGN SYSTEM  →  SCREEN GENERATION  →  ITERATION  →  DESIGN-TO-CODE
(interview)    (create tokens)    (generate screens)   (variants)     (extract + map)
                                                                       ↓
                                                               Vue or Astro code
```

Each phase has a clear entry condition and exit condition. Do NOT skip phases.

| Phase | Entry Condition | Exit Condition |
|-------|----------------|----------------|
| 1. Discovery | User wants UI design | Agent has answers to all 3 question groups |
| 2. Design System | Discovery complete | Design system created and applied in Stitch |
| 3. Screen Generation | Design system exists | Key screens generated (2-3 minimum) |
| 4. Iteration | Screens exist | User explicitly approves direction |
| 5. Design-to-Code | User approved designs | Tokens mapped, component structure defined |

---

## Phase 1: Discovery — The Design Interview

The agent MUST ask these questions conversationally. Do NOT dump all questions at once — ask in groups, react to answers, adapt follow-ups.

### Group 1 — Project Context

Ask these first to understand WHAT we're building:

- **What is this project?** — Landing page, web app, mobile app, all of the above?
- **Who is the target audience?** — Age range, profession, tech-savvy or not?
- **What is the primary goal?** — Sell, inform, onboard, manage, entertain?

### Group 2 — Visual Direction

Once you understand the project, explore the FEEL:

- **What mood should it convey?** Offer pairs of opposites and ask the user to pick a side or a middle ground:
  - Playful ←→ Serious
  - Minimal ←→ Rich/Detailed
  - Warm ←→ Cool
  - Modern ←→ Classic
  - Bold ←→ Subtle
- **Do you have brand colors?** If not, what colors resonate with you?
- **Any reference sites or apps you admire?** What do you like about them?
- **Light mode, dark mode, or both?**

### Group 3 — Content & Structure

Finally, understand the SCOPE:

- **What are the key screens/pages needed?** — List the essential ones
- **What's the most important action users should take?** — The primary CTA
- **Any specific content ready?** — Copy, images, logo, brand assets?

### Conversation Tips

- Listen for emotional words: "clean", "fun", "professional", "bold" — these map directly to design system parameters
- If the user says "I don't know", offer 2-3 concrete examples with links or descriptions
- If the user provides reference sites, analyze them for color, typography, spacing, and mood
- Summarize your understanding before moving to Phase 2: "So we're building a [project type] for [audience] that feels [mood]. The key pages are [list]. Sound right?"

---

## Mood-to-Design-System Mapping

Use this table to translate the user's mood answers into Stitch design system parameters.

| Mood | Color Variant | Font Style | Roundness | Example Use |
|------|--------------|-----------|-----------|-------------|
| Modern + Minimal | MONOCHROME or NEUTRAL | INTER, GEIST, DM_SANS | ROUND_EIGHT | SaaS dashboards, dev tools |
| Warm + Friendly | TONAL_SPOT or VIBRANT | NUNITO_SANS, PLUS_JAKARTA_SANS | ROUND_FULL | Consumer apps, social platforms |
| Bold + Energetic | EXPRESSIVE or RAINBOW | MONTSERRAT, SORA, SPACE_GROTESK | ROUND_TWELVE | Startups, gaming, crypto |
| Elegant + Premium | FIDELITY or CONTENT | NOTO_SERIF, EB_GARAMOND, LITERATA | ROUND_FOUR | Luxury brands, finance, law |
| Corporate + Trustworthy | NEUTRAL or TONAL_SPOT | IBM_PLEX_SANS, SOURCE_SANS_THREE | ROUND_FOUR | Enterprise, B2B, healthcare |
| Playful + Creative | FRUIT_SALAD or RAINBOW | LEXEND, EPILOGUE, BE_VIETNAM_PRO | ROUND_FULL | Kids products, creative tools |
| Clean + Professional | NEUTRAL | WORK_SANS, PUBLIC_SANS, MANROPE | ROUND_EIGHT | Agencies, portfolios, consulting |

### Font Pairing Guide

Headlines and body fonts should contrast but complement. Common pairings:

| Headline Font | Body Font | Mood |
|--------------|-----------|------|
| MONTSERRAT | INTER | Modern professional |
| SORA | DM_SANS | Tech-forward |
| SPACE_GROTESK | WORK_SANS | Developer/creative |
| EB_GARAMOND | SOURCE_SANS_THREE | Elegant editorial |
| LITERATA | IBM_PLEX_SANS | Academic/serious |
| PLUS_JAKARTA_SANS | NUNITO_SANS | Friendly consumer |
| EPILOGUE | PUBLIC_SANS | Clean minimalist |
| LEXEND | MANROPE | Accessible/modern |
| GEIST | GEIST | Monospace-inspired tech |
| RUBIK | INTER | Geometric friendly |

### Color Choice Guide

When the user provides brand colors, use them as `customColor`. When they don't:

| Mood | Suggested Seed Colors | Why |
|------|----------------------|-----|
| Trust, stability | `#1a56db` (blue) | Universal trust signal |
| Growth, nature | `#059669` (green) | Organic, sustainable |
| Energy, urgency | `#dc2626` (red) | Action, excitement |
| Creativity, luxury | `#7c3aed` (purple) | Premium, creative |
| Warmth, optimism | `#f59e0b` (amber) | Approachable, positive |
| Innovation, tech | `#0891b2` (cyan) | Cutting-edge, digital |
| Neutrality, elegance | `#374151` (gray) | Sophisticated, serious |
| Passion, bold | `#e11d48` (rose) | Fashion, lifestyle |

---

## Phase 2: Design System Creation

With Discovery answers in hand, create the design system in Stitch.

### Step-by-Step Flow

**Step 1: Create the project**

```
create_project(title: "ProjectName")
```

This returns a project with an ID. Save it — you'll need it for everything else.

**Step 2: Create the design system**

Map Discovery answers to parameters using the Mood-to-Design-System table:

```
create_design_system(
  projectId: "<project-id>",
  designSystem: {
    displayName: "ProjectName Design System",
    theme: {
      colorMode: LIGHT | DARK,
      customColor: "#hex-from-discovery",
      colorVariant: <from-mood-table>,
      headlineFont: <from-font-pairing>,
      bodyFont: <from-font-pairing>,
      roundness: <from-mood-table>,
      // Optional overrides:
      overridePrimaryColor: "#hex",
      overrideSecondaryColor: "#hex",
      overrideTertiaryColor: "#hex",
      overrideNeutralColor: "#hex",
      // Optional design instructions:
      designMd: "Markdown instructions for generation"
    }
  }
)
```

**Step 3: Update and apply the design system**

After creation, apply it to the project so all generated screens use it:

```
update_design_system(
  name: "assets/<asset-id>",
  projectId: "<project-id>",
  designSystem: { ... same structure ... }
)
```

### Parameter Decisions

| Parameter | How to Decide |
|-----------|--------------|
| `colorMode` | Ask in Discovery. Default to LIGHT unless user prefers dark |
| `customColor` | Brand color if available, otherwise use Color Choice Guide |
| `colorVariant` | From Mood-to-Design-System table |
| `headlineFont` | From Font Pairing Guide — headlines should have personality |
| `bodyFont` | From Font Pairing Guide — body should be highly readable |
| `roundness` | From Mood-to-Design-System table |
| `designMd` | Optional. Use for extra instructions: "Use large hero images", "Prefer card-based layouts" |
| `overridePrimaryColor` | Only if the user has a specific brand primary color |
| `overrideSecondaryColor` | Only if the user has a secondary brand color |
| `overrideTertiaryColor` | Rarely needed. Let the color variant derive it |
| `overrideNeutralColor` | Only if the user wants a warm/cool neutral instead of pure gray |

### Example: Full Design System Creation

User says: "I'm building a SaaS dashboard for developers. It should feel modern and minimal. I like dark mode. Our brand color is #6366f1 (indigo)."

```
1. create_project(title: "DevDash")
   → returns project ID: "1234567890"

2. create_design_system(
     projectId: "1234567890",
     designSystem: {
       displayName: "DevDash Design System",
       theme: {
         colorMode: DARK,
         customColor: "#6366f1",
         colorVariant: NEUTRAL,
         headlineFont: GEIST,
         bodyFont: INTER,
         roundness: ROUND_EIGHT
       }
     }
   )
   → returns asset ID: "9876543210"

3. update_design_system(
     name: "assets/9876543210",
     projectId: "1234567890",
     designSystem: { ... same as above ... }
   )
```

---

## Phase 3: Screen Generation

Generate the key screens identified in Discovery. Start with 2-3 screens, not all at once.

### Writing Effective Prompts

The quality of generated screens depends heavily on the prompt. Be SPECIFIC:

```
A [device type] [page type] for [project description].
The page should have: [section 1], [section 2], [section 3].
Primary CTA: [action text and placement].
Style: [mood adjectives from Discovery].
Content: [specific copy or placeholder direction].
```

**Good prompt:**
> A desktop landing page for a developer analytics platform. The page should have: a hero section with a headline about code insights and a 'Start Free Trial' CTA button, a features grid showing 4 key metrics (deploy frequency, lead time, error rate, recovery time), a social proof section with developer testimonials, and a pricing comparison table. Style: modern, minimal, dark. Use code-themed imagery.

**Bad prompt:**
> Make a nice landing page for my app.

### Model Selection

| Scenario | Model | Why |
|----------|-------|-----|
| Initial screen generation | GEMINI_3_1_PRO | Best quality for first impressions |
| Quick iterations on feedback | GEMINI_3_FLASH | Faster, good enough for tweaks |
| Final polished version | GEMINI_3_1_PRO | Quality matters for the final version |
| Exploring many variants | GEMINI_3_FLASH | Speed over perfection when exploring |

### Device Type Selection

| Project Type | Device Type | When to Use |
|-------------|-------------|-------------|
| Web app / dashboard | DESKTOP | Primary experience is desktop |
| Mobile app | MOBILE | Native mobile feel |
| Landing page | DESKTOP | Most landing pages are desktop-first |
| Responsive site | AGNOSTIC | When you need both and can't decide |
| Tablet app | TABLET | iPad-specific experiences |

### Prompt Templates by Screen Type

#### Hero / Landing Homepage

```
A [device] landing page homepage for [project].
Hero section: [headline about value proposition], [subheadline about how],
[primary CTA button: "text"], [secondary CTA: "text"].
Below the fold: [feature highlights / social proof / how-it-works].
Style: [mood]. Brand color: [color description].
```

#### Pricing Page

```
A [device] pricing page for [project].
Show [number] tiers: [Free/Starter], [Pro], [Enterprise].
Highlight the [middle] tier as recommended.
Include feature comparison table below the pricing cards.
Primary CTA per card: [button text].
Style: [mood]. Clear hierarchy between tiers.
```

#### Features / Services Page

```
A [device] features page for [project].
Section 1: Overview headline with [value proposition].
Section 2: Feature grid with [number] features, each with icon, title, description.
Section 3: [Detailed feature spotlight with screenshot/illustration].
Section 4: CTA to [action].
Style: [mood]. Use [imagery direction].
```

#### Contact Page

```
A [device] contact page for [project].
Include: contact form (name, email, subject, message),
company information sidebar (address, phone, email, social links),
embedded map placeholder.
Primary CTA: "Send Message".
Style: [mood]. Professional and approachable.
```

#### Dashboard

```
A [device] dashboard for [project].
Top bar: user avatar, notifications, search.
Sidebar: navigation with [menu items].
Main content: [key metrics cards at top], [primary chart/table],
[secondary widgets].
Style: [mood]. Data-dense but readable.
```

#### Login / Register

```
A [device] login page for [project].
Split layout: left side with brand imagery/illustration,
right side with login form (email, password, remember me, forgot password).
Social login options: [Google, GitHub, etc.].
Link to register page.
Style: [mood]. Clean and focused on the form.
```

#### Product List / Catalog

```
A [device] product listing page for [project].
Top: filters bar (category, price range, sort).
Grid layout: product cards with image, title, price, [rating].
Pagination at bottom.
Style: [mood]. Focus on product imagery.
```

#### Detail / Profile Page

```
A [device] detail page for [project description].
Hero: [main image/header with title].
Content: [key information sections].
Sidebar: [metadata, related items, CTAs].
Style: [mood]. Content-focused layout.
```

### Screen Generation Call

```
generate_screen_from_text(
  projectId: "<project-id>",
  prompt: "<detailed prompt from templates above>",
  deviceType: DESKTOP | MOBILE | TABLET | AGNOSTIC,
  modelId: GEMINI_3_1_PRO | GEMINI_3_FLASH
)
```

---

## Phase 4: Iteration with Variants

Never settle on the first generation. Use variants to explore and refine.

### Creative Range Selection

| Range | Effect | When to Use |
|-------|--------|-------------|
| REFINE | Subtle tweaks, polishing | Direction is right, needs minor adjustments |
| EXPLORE | Moderate changes, alternatives | Good start but want to see different takes |
| REIMAGINE | Radical rethinking | Direction feels completely wrong, start over |

### Aspect Selection

Focus variants on specific aspects instead of changing everything:

| Aspect | What It Changes | When to Focus |
|--------|----------------|---------------|
| LAYOUT | Arrangement of elements | "The sections feel off" / "Too cramped" / "Wrong flow" |
| COLOR_SCHEME | Colors and contrast | "Colors don't feel right" / "Too dark" / "Not enough contrast" |
| TEXT_FONT | Typography choices | "Fonts feel wrong" / "Too playful" / "Not readable" |
| TEXT_CONTENT | Copy and text content | "Needs better copy" / "Different tone" / "More compelling" |
| IMAGES | Imagery and illustrations | "Wrong imagery" / "Need different photos" / "More abstract" |

### The Iteration Loop

```
Generate Screen
      ↓
Show to User ← ← ← ← ← ← ← ← ← ← ←
      ↓                                 ↑
Get Feedback                            |
      ↓                                 |
Feedback is...                          |
├── "Love it!" → DONE (move to Phase 5)|
├── "Close but..." → REFINE + specific  |
│   aspects → generate_variants ─ ─ ─ ─┘
├── "Interesting but..." → EXPLORE +    |
│   specific aspects → generate_variants┘
├── "Not right" → REIMAGINE ─ ─ ─ ─ ─ ┘
└── "I don't know" → Show 3 EXPLORE     |
    variants with different aspects ─ ─ ┘
```

### Variant Call

```
generate_variants(
  projectId: "<project-id>",
  selectedScreenIds: ["<screen-id>"],
  prompt: "User feedback or direction for variants",
  variantOptions: {
    variantCount: 3,
    creativeRange: REFINE | EXPLORE | REIMAGINE,
    aspects: [LAYOUT, COLOR_SCHEME, ...]
  },
  deviceType: DESKTOP | MOBILE | TABLET | AGNOSTIC,
  modelId: GEMINI_3_FLASH
)
```

### Editing Existing Screens

For targeted changes to specific screens, use `edit_screens` instead of variants:

```
edit_screens(
  projectId: "<project-id>",
  selectedScreenIds: ["<screen-id>"],
  prompt: "Specific change: make the hero section taller, add more whitespace between sections",
  deviceType: DESKTOP,
  modelId: GEMINI_3_FLASH
)
```

Use `edit_screens` when:
- The user has a specific, targeted change ("move the CTA above the fold")
- You need to change content, not style ("change the headline to...")
- Adding or removing specific sections

Use `generate_variants` when:
- Exploring different directions
- The user wants to compare options side by side
- The feedback is about overall feel rather than specific elements

### When to STOP Iterating

- **User explicitly approves** — "This is perfect", "Let's go with this one", "I'm happy"
- **3 rounds without progress** — If the user can't decide after 3 rounds, pause and ask: "We've explored several directions. Would you like to try a completely different approach, or is there a specific version you'd like to refine further?"
- **Scope creep** — If the user keeps adding new requirements, pause and re-scope: "Let's finalize what we have first, then we can add more screens/features"

---

## Phase 5: Design-to-Code Bridge

This is the critical phase. Translate the approved Stitch designs into actual code.

### Step 1: Extract Design Tokens

From the approved Stitch design system, extract and map all tokens:

#### Token Mapping Table

| Stitch Token | CSS Variable | Tailwind Config | Usage |
|-------------|-------------|-----------------|-------|
| `customColor` (primary) | `--color-primary` | `colors.primary` | Buttons, links, CTAs |
| `overridePrimaryColor` | `--color-primary` | `colors.primary` | Override if set |
| `overrideSecondaryColor` | `--color-secondary` | `colors.secondary` | Secondary actions, accents |
| `overrideTertiaryColor` | `--color-tertiary` | `colors.tertiary` | Subtle accents |
| `overrideNeutralColor` | `--color-neutral` | `colors.neutral` | Backgrounds, borders |
| `headlineFont` | `--font-headline` | `fontFamily.headline` | H1, H2, section titles |
| `bodyFont` | `--font-body` | `fontFamily.body` | Body text, paragraphs |
| `labelFont` | `--font-label` | `fontFamily.label` | Labels, captions, buttons |
| `roundness` ROUND_FOUR | `--radius: 4px` | `borderRadius.DEFAULT: '4px'` | Cards, buttons, inputs |
| `roundness` ROUND_EIGHT | `--radius: 8px` | `borderRadius.DEFAULT: '8px'` | Cards, buttons, inputs |
| `roundness` ROUND_TWELVE | `--radius: 12px` | `borderRadius.DEFAULT: '12px'` | Cards, buttons, inputs |
| `roundness` ROUND_FULL | `--radius: 9999px` | `borderRadius.DEFAULT: '9999px'` | Pills, avatars |
| `colorMode` LIGHT | `prefers-color-scheme: light` | `darkMode: 'class'` | Light theme |
| `colorMode` DARK | `prefers-color-scheme: dark` | `darkMode: 'class'` | Dark theme |

### Step 2: Generate Tailwind Config

```typescript
// tailwind.config.ts (extract from Stitch design system)
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class', // or 'media' based on colorMode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '<customColor>',
          // Generate shades using the seed color
          50: '<lightest>',
          100: '<lighter>',
          // ... full scale
          900: '<darkest>',
        },
        secondary: {
          DEFAULT: '<overrideSecondaryColor or derived>',
        },
        tertiary: {
          DEFAULT: '<overrideTertiaryColor or derived>',
        },
      },
      fontFamily: {
        headline: ['<headlineFont>', 'sans-serif'],
        body: ['<bodyFont>', 'sans-serif'],
        label: ['<labelFont or bodyFont>', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '<from roundness>',
        sm: '<roundness / 2>',
        lg: '<roundness * 1.5>',
        full: '9999px',
      },
    },
  },
} satisfies Config
```

### Step 3: Map Screens to Components

Analyze each approved Stitch screen and decompose it:

```
Stitch Screen: "Homepage"
├── Hero Section        → Hero.astro (static) or HeroSection.vue
│   ├── Headline        → <h1> with font-headline
│   ├── Subheadline     → <p> with font-body
│   ├── CTA Button      → AppButton component (primary variant)
│   └── Hero Image      → <Image> (Astro) or <img> (Vue)
├── Features Grid       → Features.astro or FeaturesSection.vue
│   └── Feature Card    → Card component (repeated)
├── Testimonials        → Testimonials.astro or TestimonialsSection.vue
│   └── Testimonial     → Card variant (repeated)
├── Pricing             → Pricing.astro or PricingSection.vue
│   └── Plan Card       → PricingCard component
└── Footer CTA          → CTA.astro or CTASection.vue
```

### For Vue Projects (using vue-frontend skill)

Follow the Vue component patterns from `vue-frontend`:

```
src/
├── modules/
│   └── landing/                    # If landing is part of the app
│       ├── components/             # Presentational sections
│       │   ├── HeroSection.vue
│       │   ├── FeaturesSection.vue
│       │   └── PricingSection.vue
│       └── containers/
│           └── LandingContainer.vue
├── shared/
│   ├── components/
│   │   ├── atoms/
│   │   │   ├── AppButton.vue       # Uses design tokens
│   │   │   └── AppCard.vue         # Uses roundness token
│   │   └── molecules/
│   │       └── PricingCard.vue
│   └── styles/
│       └── design-tokens.css       # CSS variables from Stitch
```

**Design tokens CSS file:**

```css
/* src/shared/styles/design-tokens.css */
:root {
  /* Colors from Stitch */
  --color-primary: #6366f1;
  --color-secondary: #8b5cf6;
  --color-tertiary: #a78bfa;
  --color-neutral: #374151;

  /* Typography from Stitch */
  --font-headline: 'Geist', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Spacing from roundness */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}

.dark {
  --color-neutral: #f3f4f6;
  /* Dark mode overrides */
}
```

### For Astro Projects (using astro-landing skill)

Follow the Astro patterns from `astro-landing`:

```
apps/landing/
├── src/
│   ├── pages/
│   │   ├── index.astro             # Composes sections from Stitch screens
│   │   └── pricing.astro
│   ├── components/
│   │   ├── sections/               # Map 1:1 from Stitch screen sections
│   │   │   ├── Hero.astro          # Static — no JS
│   │   │   ├── Features.astro      # Static — no JS
│   │   │   ├── Testimonials.astro  # Static — no JS
│   │   │   └── CTA.astro           # Static — no JS
│   │   ├── ui/
│   │   │   ├── Button.astro        # Uses design tokens
│   │   │   └── Card.astro          # Uses roundness token
│   │   └── interactive/            # Only if interactivity needed
│   │       └── ContactForm.vue     # Vue island (client:visible)
│   ├── styles/
│   │   └── global.css              # Design tokens + Tailwind
│   └── layouts/
│       └── BaseLayout.astro
├── tailwind.config.mjs             # Tokens mapped to Tailwind
```

**Decision: Astro component vs Vue island**

| Screen Element | Static (Astro) | Interactive (Vue Island) |
|---------------|----------------|--------------------------|
| Hero section | Yes — just HTML/CSS | No |
| Feature cards | Yes — static grid | No |
| Pricing toggle (monthly/yearly) | No | Yes — `client:visible` |
| Contact form | No | Yes — `client:visible` |
| Testimonial carousel | Maybe — CSS-only carousel | Yes if JS-driven carousel |
| Mobile menu | No | Yes — `client:media="(max-width: 768px)"` |
| Stats counter | Maybe — CSS animation | Yes if JS-driven animation |

### Step 4: Present to User

Before writing any code, present the mapping:

1. **Design tokens** — Show the extracted CSS variables and Tailwind config
2. **Component tree** — Show the screen decomposition
3. **Interactive decisions** — Which parts need Vue islands (Astro) or container components (Vue)
4. **Get approval** — "Does this mapping look right? Anything you'd change?"

Only after approval, proceed to code generation using `vue-frontend` or `astro-landing` skill patterns.

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Do This Instead |
|-------------|---------------|----------------|
| Generating screens without a design system | Inconsistent visuals, no reusable tokens | Create design system FIRST (Phase 2) |
| Skipping Discovery | Generates what the agent assumes, not what the user wants | Always ask the interview questions (Phase 1) |
| Using REIMAGINE when REFINE would do | Wastes time and tokens, loses good progress | Match creative range to feedback intensity |
| Using GEMINI_3_1_PRO for quick iterations | Slower and more expensive for minor tweaks | Use GEMINI_3_FLASH for iteration rounds |
| Not getting explicit approval before coding | User may not be happy, rework is expensive | Always ask "Is this the direction?" |
| Hardcoding colors in components | Design system becomes useless, changes are painful | Always reference design tokens |
| Generating too many screens at once | Overwhelming, hard to give feedback | Start with 2-3 key screens |
| Applying design system without updating first | Stale tokens, design drift | Always update then apply |
| Ignoring device type | Screens optimized for wrong viewport | Match device type to project type |
| Dumping all Discovery questions at once | Feels like a survey, not a conversation | Ask in groups, adapt to answers |

---

## Stitch MCP Reference

### Project Management

| Tool | Purpose |
|------|---------|
| `create_project` | Create a new Stitch project container |
| `get_project` | Get project details (includes screen instances) |
| `list_projects` | List all accessible projects |

### Design System

| Tool | Purpose |
|------|---------|
| `create_design_system` | Create a new design system with tokens |
| `update_design_system` | Update an existing design system |
| `list_design_systems` | List design systems for a project |
| `apply_design_system` | Apply a design system to specific screens |

### Screen Generation

| Tool | Purpose |
|------|---------|
| `generate_screen_from_text` | Generate a new screen from a text prompt |
| `edit_screens` | Edit existing screens with a text prompt |
| `generate_variants` | Generate variants of existing screens |
| `list_screens` | List all screens in a project |
| `get_screen` | Get details of a specific screen |

### Available Options

**Color Modes:** LIGHT, DARK

**Color Variants:** MONOCHROME, NEUTRAL, TONAL_SPOT, VIBRANT, EXPRESSIVE, FIDELITY, CONTENT, RAINBOW, FRUIT_SALAD

**Fonts:** INTER, DM_SANS, GEIST, MONTSERRAT, RUBIK, SORA, SPACE_GROTESK, PLUS_JAKARTA_SANS, WORK_SANS, EPILOGUE, MANROPE, IBM_PLEX_SANS, NUNITO_SANS, BE_VIETNAM_PRO, PUBLIC_SANS, LEXEND, HANKEN_GROTESK, ARIMO, SOURCE_SANS_THREE, METROPOLIS, SPLINE_SANS, NOTO_SERIF, NEWSREADER, DOMINE, LIBRE_CASLON_TEXT, EB_GARAMOND, LITERATA, SOURCE_SERIF_FOUR

**Roundness:** ROUND_FOUR, ROUND_EIGHT, ROUND_TWELVE, ROUND_FULL

**Models:** GEMINI_3_FLASH (fast), GEMINI_3_1_PRO (quality)

**Device Types:** MOBILE, DESKTOP, TABLET, AGNOSTIC

**Creative Ranges:** REFINE (subtle), EXPLORE (moderate), REIMAGINE (radical)

**Variant Aspects:** LAYOUT, COLOR_SCHEME, IMAGES, TEXT_FONT, TEXT_CONTENT

---

## Commands — Common Workflows

### Create a New Project with Design System

```
1. create_project(title: "MyProject")
2. create_design_system(projectId, designSystem)
3. update_design_system(name, projectId, designSystem)
```

### Generate and Iterate on a Screen

```
1. generate_screen_from_text(projectId, prompt, DESKTOP, GEMINI_3_1_PRO)
2. Show screen to user, get feedback
3. generate_variants(projectId, [screenId], feedback, {
     variantCount: 3,
     creativeRange: EXPLORE,
     aspects: [LAYOUT, COLOR_SCHEME]
   })
4. Repeat until approved
```

### Apply Design System to Existing Screens

```
1. list_design_systems(projectId) → get assetId
2. get_project(name) → get screen instances with IDs
3. apply_design_system(projectId, screenInstances, assetId)
```

### Quick Edit a Specific Screen

```
1. list_screens(projectId) → find screen ID
2. edit_screens(projectId, [screenId], "Make the header fixed, add more padding to cards")
```

### Full Project Flow (End-to-End)

```
1. Discovery interview (Phase 1)
2. create_project(title)
3. create_design_system(projectId, designSystem)
4. update_design_system(name, projectId, designSystem)
5. generate_screen_from_text(projectId, heroPrompt, DESKTOP, GEMINI_3_1_PRO)
6. generate_screen_from_text(projectId, pricingPrompt, DESKTOP, GEMINI_3_1_PRO)
7. Show screens → get feedback
8. generate_variants / edit_screens as needed
9. User approves
10. Extract tokens → map to Tailwind config
11. Decompose screens → component tree
12. Generate code using vue-frontend or astro-landing patterns
```

---

## Integration with Other Skills

This skill bridges to other Vera Sesiom skills:

| Phase | Related Skill | Why |
|-------|--------------|-----|
| Design-to-Code (Vue) | `vue-frontend` | Component patterns, container/presentational, Pinia stores |
| Design-to-Code (Astro) | `astro-landing` | Section components, islands, content collections |
| Design-to-Code (Mobile) | `flutter-mobile` | Widget mapping, theme data |
| Component architecture | `hexagonal-architecture` | Keep design layer separate from business logic |
| Shared components | `monorepo-structure` | Design tokens in shared package |
| Code quality | `testing-strategy` | Test presentational components |

**Skill loading when transitioning to code:**

1. Load `stitch-designer` for Phases 1-4
2. When entering Phase 5, ALSO load the target stack skill (`vue-frontend` or `astro-landing`)
3. Follow BOTH skills' conventions during code generation

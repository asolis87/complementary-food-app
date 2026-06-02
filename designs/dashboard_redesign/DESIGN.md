---
name: Nurture & Growth
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#404943'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#707973'
  outline-variant: '#bfc9c1'
  surface-tint: '#2c694e'
  primary: '#0f5238'
  on-primary: '#ffffff'
  primary-container: '#2d6a4f'
  on-primary-container: '#a8e7c5'
  inverse-primary: '#95d4b3'
  secondary: '#895100'
  on-secondary: '#ffffff'
  secondary-container: '#fd9d1a'
  on-secondary-container: '#663b00'
  tertiary: '#653f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#845501'
  on-tertiary-container: '#ffd29a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b1f0ce'
  primary-fixed-dim: '#95d4b3'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#0e5138'
  secondary-fixed: '#ffdcbc'
  secondary-fixed-dim: '#ffb86b'
  on-secondary-fixed: '#2c1700'
  on-secondary-fixed-variant: '#683d00'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#fabb65'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#643f00'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is centered on the concept of "Guided Growth." It balances the emotional warmth of parenting with the precision required for a health-tracking tool. The visual language avoids traditional "baby" tropes—such as primary colors or cartoonish icons—in favor of a sophisticated, modern aesthetic that respects the user's role as a primary caregiver.

The style is **Modern Tactile**, utilizing soft surfaces, generous whitespace, and a high-quality "utility" feel. It aims to evoke a sense of calm, organization, and reliability. Every interaction should feel supportive and effortless, reducing the cognitive load for busy parents while maintaining a professional standard for data entry and health monitoring.

## Colors

The palette is inspired by natural whole foods and a sense of vitality. 

- **Primary Green:** A deep, professional forest green used for primary actions, branding, and stability.
- **Secondary Orange/Yellow:** Soft, energetic tones used to highlight progress, interactive elements, and warmth.
- **Surface Neutrals:** A range of warm greys and off-whites that prevent the interface from feeling sterile or clinical.
- **Semantic Tones:** Success, warning, and error colors are slightly desaturated to maintain the "soft" aesthetic without losing their instructional clarity.

The default mode is **Light**, prioritizing readability and a "clean slate" feel, which is essential for a health and nutrition tracking environment.

## Typography

The typography uses **Plus Jakarta Sans** across all levels. This typeface is chosen for its geometric clarity and soft, open apertures, which provide a friendly yet professional tone.

- **Headlines:** Use tighter letter spacing and heavier weights to create a strong information hierarchy and anchor sections.
- **Body Text:** Set with generous line height to ensure maximum legibility during quick scans.
- **Labels:** Utilized for categories (e.g., "Allergen," "Pending") to differentiate metadata from primary content.
- **Hierarchy:** Maintain a clear distinction between parental guidance (larger, friendlier titles) and technical data (clean, structured labels).

## Layout & Spacing

This design system employs a **12-column Fluid Grid** for desktop and a **4-column Fluid Grid** for mobile. 

- **Rhythm:** An 8px base unit (baseline grid) governs all spacing. This creates a predictable and harmonious vertical rhythm.
- **Margins:** Desktop views use 40px external margins to provide "breathing room," emphasizing the clean, minimalist aesthetic.
- **Information Density:** Spacing is intentionally loose around high-level summaries (like the daily tracker) and tighter within data-heavy lists (like the food roadmap) to balance emotional space with functional efficiency.
- **Adaptive Rules:** On mobile, horizontal padding for cards is reduced to maximize screen real estate for content, while vertical stack spacing is maintained to preserve the soft, uncrowded feel.

## Elevation & Depth

Visual hierarchy is achieved through a combination of **Tonal Layers** and **Ambient Shadows**.

- **Surfaces:** The background is a very light neutral. Primary containers (cards) use a pure white surface to "pop" forward. 
- **Shadows:** Use extremely diffused, low-opacity shadows with a subtle green tint (`rgba(45, 106, 79, 0.08)`). This provides a "lifted" effect that feels soft and organic rather than harsh or mechanical.
- **Interactivity:** On hover or active states, shadows should expand slightly in blur radius rather than increasing in opacity, maintaining the gentle feel.
- **Depth Levels:**
    - Level 0: Background.
    - Level 1: Standard Cards / Navigation Bars.
    - Level 2: Modals / Popovers / Active Input states.

## Shapes

The shape language is defined by large, inviting radii that remove all visual tension.

- **Primary Radius:** Used for cards and main containers to create a "nested" look that feels safe and modern.
- **Interactive Radius:** Buttons and input fields mirror the container radius for consistency.
- **Small Elements:** Chips and badges (e.g., "Allergen" tags) utilize a full pill-shape to distinguish them as discrete, actionable items.
- **Icons:** Use rounded terminals and soft corners to match the typeface and overall design system aesthetic.

## Components

### Buttons
- **Primary:** Solid Primary Green background with White text. Rounded (0.5rem). High-quality tactile feel.
- **Secondary:** White background with Primary Green border and text.
- **Tertiary:** Ghost style; text-only with a soft background tint on hover.

### Cards
- Always White background with a 1px soft neutral border (#E9ECEF) or a Level 1 ambient shadow. Large 1rem corner radius is mandatory.

### Input Fields
- Use a soft grey background (#F1F3F5) with a 2px bottom border or subtle outline that transitions to Primary Green on focus. Labels should always be visible (never placeholder-only).

### Chips & Badges
- Used for food status (Pending, Registered, Allergen).
- **Allergen Badge:** Uses a soft Error Red tint with an icon.
- **Progress Badges:** Use a pill-shape with the secondary yellow/orange to indicate growth or energy.

### Lists & Roadmaps
- Utilize "ProgressBar" components within list items to show completion status. Use the Primary Green for "filled" states and a very light tint of the same color for the "track."

### Nutrition Icons
- Custom, simplified icons for food groups (Fruits, Vegetables, Proteins). Icons should be enclosed in a circular or soft-square background with a tonal tint corresponding to their food group.
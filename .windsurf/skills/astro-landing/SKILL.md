---
name: astro-landing
description: >
  Astro conventions for landing pages, content sites, and SSG projects at Vera Sesiom.
  Zero JS by default, Vue Islands for interactivity, and content-first architecture.
  Trigger: When building landing pages, marketing sites, blogs, docs, or any content-heavy static site.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Landing pages and marketing sites
- Corporate websites
- Content-heavy sites (blogs, documentation)
- Any project where SEO and performance are critical
- Sites that are mostly static with minimal interactivity
- Sites needing fast initial load and Core Web Vitals

**NOT for full web apps** — use `vue-frontend` for interactive applications (dashboards, CRUD apps, real-time apps).

---

## Critical Rules

1. **Zero JS by default** — Astro ships NO JavaScript unless you add a client directive
2. **TypeScript ALWAYS** — same as all Vera Sesiom projects, strict mode
3. **Use Content Collections for structured content** — blog posts, docs, case studies
4. **Islands Architecture** — Vue/React components only where interactivity is needed
5. **Static output (SSG) by default** — SSR only when dynamic content requires it
6. **Tailwind CSS for styling** — same as Vue frontend
7. **Screaming Architecture** — folders scream the domain, not the framework

---

## Decision Criteria: Astro vs Vue

| When to use Astro | When to use Vue |
|-------------------|-----------------|
| Landing page, marketing site | Web application (dashboard, admin) |
| Content-heavy (blog, docs) | Highly interactive UI |
| SEO is critical | Real-time features needed |
| Mostly static content | Complex state management |
| Minimal interactivity (forms, carousels) | Full SPA navigation |
| Zero JS is a feature | Vue ecosystem benefits matter |

**Rule**: If the site is content people **READ** → Astro. If it's an app people **USE** → Vue.

---

## Project Structure (Screaming Architecture)

```
apps/landing/   (or apps/website/)
├── src/
│   ├── pages/                    # File-based routing (.astro files)
│   │   ├── index.astro           # Homepage
│   │   ├── about.astro           # About page
│   │   ├── pricing.astro         # Pricing page
│   │   ├── blog/
│   │   │   ├── index.astro      # Blog list
│   │   │   └── [slug].astro      # Blog post (dynamic)
│   │   └── contact.astro
│   ├── layouts/                  # Page layouts
│   │   ├── BaseLayout.astro      # Base HTML structure
│   │   ├── BlogLayout.astro      # Blog post layout
│   │   └── LandingLayout.astro   # Landing page layout
│   ├── components/               # Astro components (static by default)
│   │   ├── sections/             # Page sections
│   │   │   ├── Hero.astro
│   │   │   ├── Features.astro
│   │   │   ├── Pricing.astro
│   │   │   ├── Testimonials.astro
│   │   │   └── CTA.astro
│   │   ├── ui/                   # Reusable UI atoms
│   │   │   ├── Button.astro
│   │   │   ├── Card.astro
│   │   │   ├── Badge.astro
│   │   │   └── Input.astro
│   │   └── interactive/          # Vue/React islands
│   │       ├── ContactForm.vue   # Form with validation
│   │       ├── Carousel.vue      # Image carousel
│   │       └── MobileMenu.vue    # Mobile navigation
│   ├── content/                  # Content collections
│   │   ├── blog/                 # Markdown/MDX blog posts
│   │   │   ├── post-1.md
│   │   │   └── post-2.mdx
│   │   └── config.ts             # Collection schema (Zod)
│   ├── styles/                   # Global styles
│   │   └── global.css            # Tailwind imports
│   ├── assets/                   # Optimized images, fonts
│   │   ├── images/
│   │   └── fonts/
│   └── utils/                    # Helper functions
│       ├── date-format.ts
│       └── seo.ts
├── public/                       # Static assets (no processing)
│   ├── favicon.ico
│   ├── robots.txt
│   └── fonts/
├── astro.config.mjs              # Astro configuration
├── tailwind.config.mjs           # Tailwind configuration
├── tsconfig.json
└── package.json
```

---

## Astro Component Pattern

Every `.astro` file has two parts: frontmatter (server-side) and template (HTML).

```astro
---
// src/components/ui/Button.astro
// Frontmatter: runs server-side, NO browser JS

export interface Props {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

const {
  variant = 'primary',
  size = 'md',
  href,
  ...rest
} = Astro.props

const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors'
const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
}
const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
}

const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`
---

{href ? (
  <a href={href} class={classes} {...rest}>
    <slot />
  </a>
) : (
  <button class={classes} {...rest}>
    <slot />
  </button>
)}
```

**Key points:**
- Frontmatter runs at build time (or request time for SSR)
- No `export default` needed — the template IS the export
- `<slot />` for children content
- Props are typed with TypeScript interfaces

---

## Layout Pattern

```astro
---
// src/layouts/BaseLayout.astro
import Nav from '../components/Nav.astro'
import Footer from '../components/Footer.astro'

export interface Props {
  title: string
  description?: string
  image?: string
}

const { title, description = '', image = '/og-default.png' } = Astro.props
const canonicalURL = new URL(Astro.url.pathname, Astro.site)
---

<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="canonical" href={canonicalURL} />
    <title>{title}</title>
    <meta name="description" content={description} />
    
    <!-- OpenGraph -->
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={image} />
    <meta property="og:url" href={canonicalURL} />
    <meta property="og:type" content="website" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    
    <slot name="head />
  </head>
  <body class="bg-white text-gray-900 antialiased">
    <Nav />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

**Usage:**

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro'
import Hero from '../components/sections/Hero.astro'
---

<BaseLayout title="Vera Sesiom - Software Development" description="We build software that matters.">
  <Hero />
</BaseLayout>
```

---

## Content Collection Pattern

Define structured content with Zod schema validation.

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content'

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Vera Sesiom'),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }).optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false)
  })
})

export const collections = {
  blog: blogCollection
}
```

```markdown
---
title: "Why We Chose Astro for Landing Pages"
description: "Performance and developer experience matter. Here's why Astro is our go-to for content sites."
pubDate: 2024-01-15
author: "Tech Lead"
image:
  url: "/images/blog/astro-landing.jpg"
  alt: "Astro logo on a modern website"
tags: ["astro", "performance", "architecture"]
---

Content goes here...
```

```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content'
import BaseLayout from '../../layouts/BaseLayout.astro'

const posts = (await getCollection('blog'))
  .filter(post => !post.data.draft)
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
---

<BaseLayout title="Blog" description="Latest articles from Vera Sesiom">
  <h1>Blog</h1>
  <ul>
    {posts.map(post => (
      <li>
        <a href={`/blog/${post.slug}`}>
          <h2>{post.data.title}</h2>
          <p>{post.data.description}</p>
          <time>{post.data.pubDate.toLocaleDateString()}</time>
        </a>
      </li>
    ))}
  </ul>
</BaseLayout>
```

```astro
---
// src/pages/blog/[slug].astro
import { getCollection } from 'astro:content'
import BaseLayout from '../../layouts/BaseLayout.astro

export async function getStaticPaths() {
  const posts = await getCollection('blog')
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }))
}

const { post } = Astro.props
const { Content } = await post.render()
---

<BaseLayout title={post.data.title} description={post.data.description}>
  <article>
    <header>
      <h1>{post.data.title}</h1>
      <time>{post.data.pubDate.toLocaleDateString()}</time>
      <p>By {post.data.author}</p>
    </header>
    <Content />
  </article>
</BaseLayout>
```

---

## Islands Architecture (Vue Components)

Interactive components ship JS only when needed. Use client directives to control hydration.

```vue
<!-- src/components/interactive/ContactForm.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const form = ref({
  name: '',
  email: '',
  message: ''
})

const errors = ref<Record<string, string>>({})

const isValid = computed(() => {
  return form.value.name && 
         form.value.email.includes('@') && 
         form.value.message.length > 10
})

async function submitForm() {
  if (!isValid.value) return
  
  // Submit to API
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form.value)
  })
  
  if (response.ok) {
    // Handle success
    form.value = { name: '', email: '', message: '' }
  }
}
</script>

<template>
  <form @submit.prevent="submitForm" class="space-y-4">
    <div>
      <label for="name">Name</label>
      <input v-model="form.name" type="text" id="name" required />
    </div>
    <div>
      <label for="email">Email</label>
      <input v-model="form.email" type="email" id="email" required />
    </div>
    <div>
      <label for="message">Message</label>
      <textarea v-model="form.message" id="message" rows="4" required />
    </div>
    <button type="submit" :disabled="!isValid">
      Send Message
    </button>
  </form>
</template>
```

**Using in Astro:**

```astro
---
// src/pages/contact.astro
import BaseLayout from '../layouts/BaseLayout.astro'
import ContactForm from '../components/interactive/ContactForm.vue'
---

<BaseLayout title="Contact Us">
  <h1>Get in Touch</h1>
  <p>We'd love to hear from you.</p>
  
  <!-- client:visible = hydrate when scrolled into view (BEST PRACTICE) -->
  <ContactForm client:visible />
</BaseLayout>
```

---

## Client Directives Decision Tree

| Directive | When to Use | JS Ships |
|-----------|-------------|----------|
| **No directive** | Static content, no interactivity | Zero JS |
| `client:visible` | Below-fold interactivity (forms, carousels) — **DEFAULT** | When scrolled into view |
| `client:load` | Above-fold critical interactivity | Immediately |
| `client:idle` | Non-critical enhancements (analytics, chat) | After page is idle |
| `client:media` | Conditional by breakpoint (mobile nav) | When media query matches |
| `client:only` | SPA-like components (skip SSR) | Immediately, no SSR |

**Best Practices:**
- Default to **no directive** — pure static
- Default to `client:visible` when interactivity needed
- Use `client:load` sparingly — only for critical above-fold
- Use `client:idle` for non-blocking enhancements

```astro
---
<!-- Good examples -->
import Hero from './Hero.astro'                    <!-- Static, no JS -->
import Carousel from './Carousel.vue'             
import MobileMenu from './MobileMenu.vue'         
import Chat from './Chat.vue'                     
import Stats from './Stats.astro'                  <!-- Static counter = CSS -->

<Hero />                                          <!-- Static, no hydration -->
<Carousel client:visible />                       <!-- Hydrate when visible -->
<MobileMenu client:media="(max-width: 768px)" />  <!-- Mobile only -->
<Chat client:idle />                               <!-- After page settles -->
<Stats />                                          <!-- Pure CSS animations, no JS needed -->
```

---

## Image Optimization

Use `astro:assets` for automatic optimization.

```astro
---
// src/pages/index.astro
import { Image } from 'astro:assets'
import heroImage from '../assets/images/hero.png'
---

<Image 
  src={heroImage} 
  alt="Hero image" 
  width={800} 
  height={600}
  loading="lazy"
  format="webp"
/>
```

For images from CMS or external sources:

```astro
---
import { Image } from 'astro:assets'
---

<Image 
  src="https://example.com/image.jpg" 
  alt="External image" 
  width={800}
  height={600}
/>
```

**Rules:**
- Always specify `width` and `height` for CLS prevention
- Use `loading="lazy"` for below-fold images
- Prefer `webp` or `avif` formats
- Keep hero images optimized and sized appropriately

---

## SEO Pattern

```astro
---
// src/components/SEO.astro
export interface Props {
  title: string
  description: string
  image?: string
  article?: boolean
  publishedTime?: Date
  author?: string
  tags?: string[]
}

const { 
  title, 
  description, 
  image = '/og-default.png',
  article = false,
  publishedTime,
  author,
  tags = []
} = Astro.props

const canonicalURL = new URL(Astro.url.pathname, Astro.site)
const imageURL = new URL(image, Astro.site)
---

<!-- Primary Meta Tags -->
<title>{title}</title>
<meta name="title" content={title} />
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />

<!-- Open Graph -->
<meta property="og:type" content={article ? 'article' : 'website'} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={imageURL} />

{article && publishedTime && (
  <meta property="article:published_time" content={publishedTime.toISOString()} />
)}
{author && (
  <meta property="article:author" content={author} />
)}

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content={canonicalURL} />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={imageURL} />

<!-- Structured Data -->
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": article ? "Article" : "WebPage",
  "headline": title,
  "description": description,
  "image": imageURL.toString(),
  "url": canonicalURL.toString(),
  ...(article && publishedTime ? { "datePublished": publishedTime.toISOString() } : {}),
  ...(author ? { "author": { "@type": "Person", "name": author } } : {})
})} />
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Do This Instead |
|-------------|---------------|----------------|
| Using Vue/React for everything | Ships unnecessary JS | Use `.astro` for static content |
| `client:load` everywhere | Defeats Astro's purpose | Default to `client:visible` |
| Not using content collections | Manual parsing, no validation | Use `src/content/` with Zod schema |
| Inline styles | Inconsistent, hard to maintain | Use Tailwind utility classes |
| Large hero images | Slow LCP, poor Core Web Vitals | Optimize with `astro:assets` |
| SPA routing | Unnecessary complexity | Let Astro handle routing |
| Ignoring SEO meta tags | Poor search visibility | Use SEO pattern or `astro-seo` |
| Dynamic imports for islands | Complexity, worse DX | Use framework integrations properly |

---

## Integration with Monorepo

Astro landing pages fit naturally in the pnpm monorepo structure:

```
apps/
├── web/           # Vue web app (vue-frontend skill)
├── api/           # Node backend (node-backend skill)
├── landing/       # Astro landing page (THIS skill)
│   ├── src/
│   ├── public/
│   ├── astro.config.mjs
│   └── package.json
└── mobile/        # Flutter app (flutter-mobile skill)
```

```json
// apps/landing/package.json
{
  "name": "@vera-sesiom/landing",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "type-check": "astro check && tsc --noEmit"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/vue": "^4.0.0",
    "@astrojs/tailwind": "^5.0.0",
    "@astrojs/sitemap": "^3.0.0",
    "vue": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tailwindcss": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

```javascript
// apps/landing/astro.config.mjs
import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://vera-sesiom.com',
  integrations: [
    vue(),
    tailwind(),
    sitemap()
  ],
  output: 'static',
  build: {
    assets: 'assets'
  }
})
```

---

## Key Dependencies

```
# Core
astro                    # The framework
@astrojs/vue             # Vue integration for islands
@astrojs/tailwind        # Tailwind integration
@astrojs/sitemap         # Auto-generated sitemap

# Optional
astro-seo                # SEO component (or use pattern above)
@astrojs/mdx             # MDX support for content
@astrojs/rss             # RSS feed generation
sharp                    # Image optimization (usually auto-installed)

# Vue (for islands)
vue                      # Vue 3 for interactive islands
@vueuse/core             # Vue composables (if needed)
```

---

## Commands

```bash
# Create new Astro project (in monorepo)
cd apps
pnpm create astro@latest landing --template minimal
cd landing
pnpm install

# Add integrations
pnpm astro add vue tailwind sitemap

# Development
pnpm --filter @vera-sesiom/landing dev

# Build
pnpm --filter @vera-sesiom/landing build

# Preview production build
pnpm --filter @vera-sesiom/landing preview

# Type check
pnpm --filter @vera-sesiom/landing type-check

# Check for issues
pnpm --filter @vera-sesiom/landing astro check
```

---

## Comparison: Astro vs Next.js vs Vue SPA

| Feature | Astro (This Skill) | Next.js (SSG) | Vue SPA |
|---------|-------------------|---------------|---------|
| Default JS | Zero | Bundle per page | Full runtime |
| SEO | Excellent (static HTML) | Good (SSR/SSG) | Requires SSR setup |
| Build time | Fast | Moderate | Fast |
| Interactivity | Islands (pay per use) | Client-side hydration | Full hydration |
| Learning curve | Low-Medium | Medium | Low |
| Best for | Content sites, landing pages | Hybrid apps, marketing | Interactive apps |

**When to choose each:**
- **Astro**: Landing pages, blogs, docs, marketing sites → **Use this skill**
- **Next.js**: Heavy SEO + dynamic features → Consider case-by-case
- **Vue SPA**: Dashboards, CRUD apps, real-time → **Use vue-frontend skill**
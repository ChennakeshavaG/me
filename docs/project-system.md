# Project System

## Overview

Personal site built with Astro 6, deployed to Cloudflare Workers. Three sections — Home, Atelier, About — each with isolated styling via CSS scoping (wrapper classes, no shadow DOM). Content is MDX with math (KaTeX), syntax highlighting (Shiki), and future Mermaid support.

Cyberpunk aesthetic — dual-tone cyan/magenta, interactive grid glow, frosted glass surfaces, composable effect classes. Full dark/light theming via `data-theme` attribute on `<html>`.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 6 |
| Adapter | `@astrojs/cloudflare` (Cloudflare Workers) |
| Content | MDX (`@astrojs/mdx`) |
| Math | `remark-math` + `rehype-katex` (KaTeX CDN for CSS) |
| Diagrams | `rehype-mermaid` + Playwright (build-time SVG, 0KB client JS) |
| Syntax | Shiki (built into Astro, `excludeLangs: ['mermaid']`) |
| UI Islands | Solid.js (`@astrojs/solid-js`) — client-side interactive components |
| 3D | Three.js (home page, future) |
| Types | TypeScript strict mode |
| Deploy | Wrangler (`wrangler.jsonc`) |
| Node | >= 22.12.0 |
| Vite | 7 (pinned via overrides) |

## File Structure

```
me/
├── astro.config.mjs          Astro config: cloudflare adapter, MDX, Solid.js, remark/rehype
├── tsconfig.json              strict mode, includes worker-configuration.d.ts
├── wrangler.jsonc             Cloudflare Workers deploy config, assets from ./dist/
├── package.json               scripts: dev, build, preview, create, validate
│
├── public/                    static assets (served as-is)
│   └── favicon.svg
│
├── src/
│   ├── content.config.js      unified collection: glob + Zod discriminated union
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro   HTML shell, theme system, canvas grid glow, nav, footer, ClientRouter, imports ALL CSS
│   │   ├── HomeLayout.astro   wraps BaseLayout, <div class="home">
│   │   ├── AtelierLayout.astro wraps BaseLayout, <div class="atelier">
│   │   ├── AboutLayout.astro  wraps BaseLayout, <div class="about">
│   │   └── ContentLayout.astro wraps AtelierLayout, adds <article> header (title, date, tags)
│   │
│   ├── components/
│   │   └── atelier/           Solid.js components (client-side island)
│   │       ├── types.ts        shared Item/RouteSegment interfaces
│   │       ├── AtelierHub.tsx  orchestrator: signals, filtering, view switching
│   │       ├── Dropdown.tsx    reusable styled <select>
│   │       ├── SearchInput.tsx debounced search input
│   │       ├── StreamView.tsx  stream layout (vertical card list)
│   │       ├── StreamCard.tsx  individual stream card
│   │       ├── GroupedView.tsx items bucketed by type (project/wiki/blog sections)
│   │       ├── GraphView.tsx   placeholder (Three.js force-directed, deferred to step 7)
│   │       └── icons/
│   │           ├── TypeIcon.tsx SVG per content type + [TYPE] label
│   │           └── PinIcon.tsx  pin SVG for pinned entries
│   │
│   ├── styles/
│   │   ├── global.css         design system: variables, reset, effect classes, theming, typography
│   │   ├── home.css           home section (placeholder)
│   │   ├── atelier.css        atelier controls, stream cards, search, dropdowns
│   │   └── about.css          about section prose styling
│   │
│   ├── models/
│   │   ├── base.js            common Zod fields + template shared by all content types
│   │   ├── item.js            item contract: Zod schemas (routeSegment, item) + builders
│   │   ├── blog.js            blog schema, template, metadata (indexFile: false)
│   │   ├── wiki.js            wiki schema, template, metadata (indexFile: true)
│   │   └── project.js         project schema, template, metadata (indexFile: true)
│   │
│   ├── pages/
│   │   ├── index.astro        home page (uses HomeLayout)
│   │   ├── about.astro        about page (uses AboutLayout)
│   │   ├── atelier.astro      atelier hub (AtelierLayout + Solid island)
│   │   └── [...slug].astro    catch-all route for all content
│   │
│   └── content/               all MDX content (blog, wiki, project)
│       ├── blog/
│       ├── wiki/
│       └── project/
│
├── scripts/
│   ├── create.js              scaffolding: `npm run create <type> <path>`
│   └── validate.js            schema validation: `npm run validate`
│
└── docs/
    ├── content-system.md      content collection docs
    ├── mermaid-system.md      mermaid diagram pipeline docs
    └── project-system.md      this file
```

## Layout Hierarchy

```
BaseLayout (html shell, theme system, canvas grid glow, nav, footer, ClientRouter, ALL CSS imports)
├── HomeLayout (wraps in .home)
├── AtelierLayout (wraps in .atelier)
│   └── ContentLayout (adds article header: title, date, tags)
└── AboutLayout (wraps in .about)
```

### Props

| Layout | Props |
|--------|-------|
| BaseLayout | `title: string`, `description?: string` |
| HomeLayout | `title: string` (default "Home") |
| AtelierLayout | `title: string` |
| AboutLayout | `title: string` (default "About") |
| ContentLayout | `title: string`, `date?: string`, `tags?: string[]` |

### Style Scoping

All CSS is imported in BaseLayout to prevent FOUC on ClientRouter back-navigation. Each section wraps content in a class-named div (`.home`, `.atelier`, `.about`) for CSS isolation. Utility classes (`.page-width`, `.glow-hover`, `.glow-edge`) defined in `global.css` are shared across sections.

## Markdown Pipeline

```
.mdx file
  → remark-math (parse LaTeX: $inline$, $$block$$)
  → rehype-katex (render to KaTeX HTML)
  → rehype-mermaid (```mermaid → <picture> with light+dark SVGs via Playwright)
  → Shiki (syntax highlight remaining code blocks, skips mermaid)
  → Astro render
```

KaTeX CSS loaded via CDN in BaseLayout `<head>`. Mermaid diagrams rendered at build-time to static SVGs — see `docs/mermaid-system.md`.

## Astro Config

```js
adapter:      cloudflare()
integrations: [mdx()]
markdown:
  remarkPlugins: [remarkMath]
  rehypePlugins: [rehypeKatex, [rehypeMermaid, { strategy: 'img-svg', dark: true }]]
  syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] }
```

## Routing

| Route | Layout | Source |
|-------|--------|--------|
| `/` | HomeLayout | `src/pages/index.astro` |
| `/atelier` | AtelierLayout | `src/pages/atelier.astro` |
| `/about` | AboutLayout | `src/pages/about.astro` |
| `/<any-content-path>` | ContentLayout | `src/pages/[...slug].astro` (catch-all) |

The catch-all route renders all content collection entries. Folder path = URL path. Draft blogs (`draft: true`) excluded in production builds.

## Atelier (Content Hub)

The atelier page uses a Solid.js island (`client:load`) for interactive content browsing.

### Data Flow

```
Server (atelier.astro frontmatter):
  getCollection('content') → buildItems(entries) → items[]
  
  Items passed as props to <AtelierHub items={items} client:load />
  Astro handles serialization automatically.

Client (Solid island):
  AtelierHub manages signals: filter, viewType, search
  → derived filteredItems (AND logic: type filter + search)
  → renders active view component (StreamView, GroupedView, or GraphView)
```

### Item Contract (`src/models/item.js`)

Zod-validated data shape shared by all views:
- `routeSegmentSchema` — breadcrumb segments (label, href, isType)
- `itemSchema` — full card data (id, href, type, pinned, title, description, date, route[])
- `buildItem(entry, titleMap)` — transforms a content entry into an Item
- `buildItems(entries)` — builds all items (filters drafts, sorts pinned first → date desc)

Route segments resolve parent entry titles via a `titleMap`. Type prefixes (blog/wiki/project) render as muted non-linked labels.

### Views

| View | Component | Status |
|------|-----------|--------|
| Stream | `StreamView.tsx` → `StreamCard.tsx` | done |
| Grouped | `GroupedView.tsx` → `StreamCard.tsx` (items bucketed by type) | done |
| Graph | `GraphView.tsx` (placeholder; Three.js force-directed deferred to step 7) | placeholder |

All views receive the same `Item[]` and render differently.

## Design System

All visual primitives live in `src/styles/global.css`. Composable effect classes — apply via HTML class attributes, never inline one-off effects.

### Theming

Dark/light mode via `data-theme` attribute on `<html>`. Theme persists in `localStorage`. BaseLayout handles:
- Inline script sets theme before first paint (no flash)
- `astro:before-swap` copies theme to new document during navigation
- Toggle button in nav switches and persists

CSS variables switch per theme — all colors, grid opacities, accent tones defined in `:root` and `[data-theme="light"]`.

### Effect Classes

| Class | Effect |
|-------|--------|
| `.glass` | Frosted glass — `backdrop-filter: blur(3px)` |
| `.glow-edge--bottom` | Animated gradient border on bottom edge |
| `.glow-edge--top` | Animated gradient border on top edge |
| `.glow-edge--left` | Animated gradient border on left edge |
| `.glow-edge--right` | Animated gradient border on right edge |
| `.pulse-glow` | Pulsing text-shadow glow (uses `--neon-color`) |
| `.scroll-hide--up` | Hides element upward on scroll |
| `.scroll-hide--down` | Hides element downward on scroll |

Glow edges use `repeating-linear-gradient` with `glow-flow-h`/`glow-flow-v` keyframes for seamless cyan↔magenta animation.

### Canvas Grid Glow

Interactive grid glow follows cursor/touch. Implemented as a `<canvas>` overlay (not CSS — avoids DOM mutations per frame). Uses `transition:persist` to survive page transitions. Gaussian falloff (`exp(-3t²)`) for natural decay, `Math.hypot` for circular shape. Auto-stops `requestAnimationFrame` when idle. Uses `pointermove` (unified mouse + touch).

### Typography

Global link styles: slide-underline on hover + neon text-shadow. Per-element glow color via `--neon-color` CSS variable scoping.

Fonts: Orbitron (headings), Chakra Petch (body), JetBrains Mono (code). Loaded from Google Fonts CDN.

## SPA Navigation

Site uses Astro `ClientRouter` (View Transitions API). DOM swaps on every navigation.

Interactive features must handle this:
- Wrap event listeners in `init()` + `document.addEventListener('astro:page-load', init)`
- Use `transition:persist` on elements that must survive navigation (e.g., canvas)
- Use `astro:before-swap` for state that lives on `<html>` (e.g., theme attribute)
- Solid islands (`client:load`) re-hydrate automatically on navigation — no manual re-init needed

## Content System

Single Astro collection (`content`) with three types discriminated by frontmatter `type` field. Full docs in `docs/content-system.md`.

### Models

Defined in `src/models/`. Each exports `schema` (Zod), `template` (frontmatter defaults), and `meta` (name, directory, indexFile). Base fields shared via `base.js`.

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | dev server at localhost:4321 |
| `npm run build` | production build to ./dist/ |
| `npm run preview` | preview production build |
| `npm run create <type> <path>` | scaffold new content file |
| `npm run validate` | validate all content against schemas |
| `npm run generate-types` | regenerate Cloudflare Worker types |

`validate` runs automatically before every build via `prebuild` hook.

## Deploy

Cloudflare Workers via Wrangler. Config in `wrangler.jsonc`:
- Assets served from `./dist/`
- Observability enabled
- Server entrypoint: `@astrojs/cloudflare/entrypoints/server`

## Build Steps Completed

1. **Dependencies + Markdown Config** — installed `@astrojs/mdx`, `remark-math`, `rehype-katex`, `three`; configured Astro markdown pipeline
2. **Layouts + Style Structure** — created layout hierarchy (Base → Home/Atelier/About, ContentLayout), CSS files with section scoping
3. **Content Collections** — unified collection with Zod discriminated union, models, catch-all route, create/validate scripts, sample content
4. **Base UI + Design System** — cyberpunk theming (dark/light), composable effect classes, interactive canvas grid glow, frosted glass header/footer, scroll show/hide, typography system, placeholder pages (home, about, atelier)
5. **Atelier Stream View** — Solid.js island, item data contract (Zod schemas + builders), stream cards with navigable breadcrumb routes, search + filter dropdowns, pinned entries, SVG type icons
6. **Atelier Grouped + Graph Placeholder** — GroupedView (items bucketed by project/wiki/blog, reuses StreamCard), GraphView placeholder (Three.js deferred to step 7), view switcher wired in AtelierHub
7. **Mermaid Diagrams** — build-time SVG rendering via rehype-mermaid + Playwright, dual light/dark SVGs with data-theme toggle sync, zero client JS
8. **Mobile Responsiveness** — single breakpoint (640px), stacked nav, atelier controls column layout, tighter card/footer padding, pointermove for touch glow, content safety (img max-width, table overflow, word-break)

# Project System

## Overview

Personal site built with Astro 6 as a fully static site, deployed to Cloudflare Workers Static Assets (no Worker runtime). Three sections — Home, Atelier, About — each with isolated styling via CSS scoping (wrapper classes, no shadow DOM). Content is MDX with math (KaTeX), syntax highlighting (Shiki), and future Mermaid support.

Minimalist monochrome aesthetic — cyan as the sole accent color, monochrome interactive grid with cyan mouse glow, clean surfaces. Full dark/light theming via `data-theme` attribute on `<html>`. Light mode is default.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 6 (`output: 'static'`, no SSR adapter) |
| Content | MDX (`@astrojs/mdx`) |
| Math | `remark-math` + `rehype-katex` (KaTeX CDN for CSS) |
| Diagrams | `rehype-mermaid` + Playwright (build-time SVG, 0KB client JS) |
| Syntax | Shiki (built into Astro, `excludeLangs: ['mermaid']`) |
| UI Islands | Solid.js (`@astrojs/solid-js`) — client-side interactive components |
| 3D | Three.js (home page, future) |
| Types | TypeScript strict mode |
| Deploy | Wrangler static assets (`wrangler.jsonc`, no `main`) |
| Node | >= 22.12.0 |
| Vite | 7 (pinned via overrides) |

## File Structure

```
me/
├── astro.config.mjs          Astro config: static output, MDX, Solid.js, remark/rehype
├── tsconfig.json              strict mode
├── wrangler.jsonc             Cloudflare static-assets deploy config, assets from ./dist/
├── package.json               scripts: dev, build, preview, create, validate
│
├── public/                    static assets (served as-is)
│   └── favicon.svg
│
├── src/
│   ├── content.config.js      unified collection: glob + Zod discriminated union
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro   HTML shell, theme system, canvas grid glow, nav, ClientRouter, SEO meta, global.css
│   │   ├── HomeLayout.astro   wraps BaseLayout, <div class="home">
│   │   ├── AtelierLayout.astro wraps BaseLayout, imports atelier.css, <div class="atelier">
│   │   ├── AboutLayout.astro  wraps BaseLayout, imports about.css, <div class="about">
│   │   └── ContentLayout.astro wraps BaseLayout, imports canvas-lab.css, adds <article> header (title, date, tags)
│   │
│   ├── components/
│   │   └── atelier/           Solid.js components (client-side island)
│   │       ├── types.ts        shared Item/RouteSegment interfaces
│   │       ├── AtelierHub.tsx  orchestrator: signals, filtering, view switching
│   │       ├── SearchInput.tsx debounced search input
│   │       ├── StreamView.tsx  stream layout (vertical card list)
│   │       ├── StreamCard.tsx  individual stream card
│   │       ├── GroupedView.tsx items bucketed by type (project/wiki/blog sections)
│   │       ├── GraphView.tsx   placeholder (Three.js force-directed, deferred to step 7)
│   │       └── icons/
│   │           ├── TypeIcon.tsx SVG per content type + [TYPE] label
│   │           └── PinIcon.tsx  pin SVG for pinned entries
│   │   └── canvas-lab/        Astro components for Canvas Lab wiki section
│   │       ├── CanvasRender.astro  live code playground (canvas + textarea editor)
│   │       ├── Concept.astro       concept callout block
│   │       ├── LessonHeader.astro  lesson title + number + description
│   │       └── LessonNav.astro     prev/next lesson navigation
│   │
│   ├── styles/
│   │   ├── global.css         design system: variables, reset, effect classes, theming, typography
│   │   ├── home.css           home section (placeholder)
│   │   ├── atelier.css        atelier controls, stream cards, search, dropdowns
│   │   ├── about.css          about section prose styling
│   │   └── canvas-lab.css     canvas-lab wiki: render playground, concept callouts, lesson nav
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
    ├── content-styles.md      CSS conventions for content pages (typography, spacing, width tiers, color tokens)
    ├── mermaid-system.md      mermaid diagram pipeline docs
    └── project-system.md      this file
```

## Layout Hierarchy

```
BaseLayout (html shell, theme system, canvas grid glow, nav, ClientRouter, global.css only)
├── HomeLayout (wraps in .home)
├── AtelierLayout (wraps in .atelier, imports atelier.css)
├── ContentLayout (wraps BaseLayout directly, imports canvas-lab.css, adds article with breadcrumb, header, prose body)
└── AboutLayout (wraps in .about, imports about.css)
```

### Props

| Layout | Props |
|--------|-------|
| BaseLayout | `title: string`, `description?: string`, `ogType?: string` (default "website") |
| HomeLayout | `title: string` (default "Home"), `description?: string` |
| AtelierLayout | `title: string`, `description?: string` |
| AboutLayout | `title: string` (default "About"), `description?: string` |
| ContentLayout | `title`, `description`, `type`, `date`, `updatedAt?`, `tags?`, `draft?`, `category?`, `status?`, `url?`, `repo?` (passes `ogType="article"`) |

### Style Scoping

`global.css` (design system, typography, content layout) is imported in BaseLayout. Page-specific CSS is imported in the respective layout: `atelier.css` in AtelierLayout, `about.css` in AboutLayout, `canvas-lab.css` in ContentLayout. Astro/Vite handles CSS bundling — styles load when the layout is navigated to. Each section wraps content in a class-named div (`.home`, `.atelier`, `.about`) for CSS isolation. Utility classes (`.page-width`, `.glass`, `.scroll-hide--up`) defined in `global.css` are shared across sections.

### SEO

BaseLayout renders Open Graph (`og:title`, `og:description`, `og:type`, `og:url`), Twitter Card (`summary`), and canonical URL meta tags. `<title>` includes site name suffix: `{title} | gck.sh` (home page renders just `gck.sh`). ContentLayout overrides `og:type` to `article`.

## Width System

Four CSS custom properties in `:root` control all horizontal sizing. Every width in the layout derives from these — change one variable and the whole chain adjusts.

| Variable | Default | Purpose |
|----------|---------|---------|
| `--w-gutter` | `clamp(1rem, 0.5rem + 2vw, 3rem)` | Breathing room between content and viewport edge |
| `--w-prose` | `clamp(320px, 60vw, 680px)` | Reading column — 65–75 CPL for Chakra Petch |
| `--w-wide` | `clamp(320px, 78vw, 900px)` | Code blocks, tables, CanvasRender demos |
| `--w-full` | `clamp(320px, 90vw, 1200px)` | Maximum content width, diagrams, dashboards |

### Width Chain

```
viewport → body (100%)
  → main.page-width: min(--w-full, 100% - --w-gutter * 2)
    → article.content: 100% of main
      → .content__breadcrumb, .content__header: --w-prose
      → .content__body: --w-full
        → > * (default): --w-prose
        → > pre, table, .cl-render, .wide: --w-wide
        → > .full: --w-full
```

### Content Tiers

| Tier | Max width | Auto-applied to | Explicit class |
|------|-----------|-----------------|----------------|
| Prose | 680px | All direct children of `.content__body` | — |
| Wide | 900px | `pre`, `table`, `.cl-render`, `.content__body-table-wrap` | `.wide` |
| Full | 1200px | — | `.full` |

In MDX, use `<div class="wide">` or `<div class="full">` to promote elements. Code blocks and tables auto-promote to wide.

### Non-content Pages

Home, atelier, and about pages share the same `main.page-width` container. Their section-specific CSS (`.about { max-width: 65ch }`, atelier's `100vw` breakout) works inside the wider main without changes.

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
output:       'static'
integrations: [mdx(), solid()]
markdown:
  remarkPlugins: [remarkMath]
  rehypePlugins: [rehypeKatex, [rehypeMermaid, { strategy: 'img-svg', dark: true }]]
  syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] }
  shikiConfig:      { themes: { light: 'github-light', dark: 'nord' } }
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

CSS variables switch per theme — all colors defined in `:root` (light default) and `[data-theme="dark"]`.

### Effect Classes

| Class | Effect |
|-------|--------|
| `.glass` | Translucent surface background (both themes) |
| `.scroll-hide--up` | Hides element upward on scroll |

### Canvas Grid Glow

Interactive monochrome grid follows cursor. Implemented as a `<canvas>` overlay (not CSS — avoids DOM mutations per frame). Uses `transition:persist` to survive page transitions. Grid lines are gray; mouse glow uses cyan (the sole accent color). Radial gradient mask for circular decay. Auto-stops `requestAnimationFrame` when idle. Uses `pointermove` (unified mouse + touch). Disabled on mobile (<=640px).

### Typography

Global link styles: no underlines (all states). Fonts: Chakra Petch (headings + body), JetBrains Mono (code). Loaded from Google Fonts CDN.

## SPA Navigation

Site uses Astro `ClientRouter` (View Transitions API). DOM swaps on every navigation.

Interactive features must handle this:
- Wrap event listeners in `init()` + `document.addEventListener('astro:page-load', init)`
- Use `AbortController` to clean up listeners registered in `init()` — abort previous controller at start of each `init()` call, pass `{ signal }` to `addEventListener`. BaseLayout uses this pattern for scroll and theme-change listeners.
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
| `npm run deploy` | build + `wrangler deploy` (static assets) |

`validate` runs automatically before every build via `prebuild` hook.

## Deploy

Cloudflare Workers Static Assets via Wrangler — no Worker runtime, so static
files are served directly (unlimited, free; requests do not count against the
Workers 100k/day limit). Config in `wrangler.jsonc`:
- Static assets served from `./dist/`
- No `main` entrypoint (pure static; adding one would route every request
  through a billable Worker invocation)

Run `npm run deploy` (local build + `wrangler deploy`); deploys are not driven
by Cloudflare Git builds (Mermaid needs Chromium, unavailable in CF's container).

## Build Steps Completed

1. **Dependencies + Markdown Config** — installed `@astrojs/mdx`, `remark-math`, `rehype-katex`, `three`; configured Astro markdown pipeline
2. **Layouts + Style Structure** — created layout hierarchy (Base → Home/Atelier/About, ContentLayout), CSS files with section scoping
3. **Content Collections** — unified collection with Zod discriminated union, models, catch-all route, create/validate scripts, sample content
4. **Base UI + Design System** — cyberpunk theming (dark/light), composable effect classes, interactive canvas grid glow, frosted glass header/footer, scroll show/hide, typography system, placeholder pages (home, about, atelier)
5. **Atelier Stream View** — Solid.js island, item data contract (Zod schemas + builders), stream cards with navigable breadcrumb routes, search + filter dropdowns, pinned entries, SVG type icons
6. **Atelier Grouped + Graph Placeholder** — GroupedView (items bucketed by project/wiki/blog, reuses StreamCard), GraphView placeholder (Three.js deferred to step 7), view switcher wired in AtelierHub
7. **Mermaid Diagrams** — build-time SVG rendering via rehype-mermaid + Playwright, dual light/dark SVGs with data-theme toggle sync, zero client JS
8. **Mobile Responsiveness** — single breakpoint (640px), stacked nav, atelier controls column layout, tighter card/footer padding, pointermove for touch glow, content safety (img max-width, table overflow, word-break)

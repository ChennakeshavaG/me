# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal site. Astro 6, Cloudflare Workers via `@astrojs/cloudflare` adapter.

## Commands

- `npm run dev` — dev server, localhost:4321
- `npm run build` — prod build, ./dist/ (runs validate first)
- `npm run preview` — preview prod build locally
- `npm run validate` — validate all content against schemas
- `npm run create <type> <name> [location]` — scaffold content (blog/wiki/project). Location = full path from content root (e.g., `project/blurrysite`, not just `blurrysite`)
- `npm run create help` — full scaffolding docs with examples
- `npm run generate-types` — regen Cloudflare Worker types (worker-configuration.d.ts)

## Props Convention

Every layout and page **must** pass `title` and `description` to BaseLayout. BaseLayout renders `<title>` and `<meta name="description">` from these. Never omit description — it feeds SEO and content cards.

## Architecture

See `docs/project-system.md` for full structure. Key entry points: `src/layouts/BaseLayout.astro` (shell), `src/styles/global.css` (design system), `src/pages/[...slug].astro` (content routing).

## Content

Never create `.mdx` files manually — always use `npm run create`. See `docs/content-system.md` for usage. For Mermaid diagrams in MDX, see `docs/mermaid-system.md`. For prose styling rules, width tiers, spacing rhythm, and color tokens, see `docs/content-styles.md`.

## SPA Navigation

Site uses `ClientRouter` — DOM swaps on every navigation. Any interactive feature must handle page transitions (see `BaseLayout.astro` for patterns).

## Design System

Visual effects are composable CSS classes in `global.css`. When adding UI:

- **Check existing effect classes first** before writing one-off styles. If no class fits, create a new reusable effect class — never inline effects.
- **Both themes must work** — every visual change needs testing in dark and light mode.

## Constraints

- Node >=22.12.0 required
- Vite 7 pinned via package.json overrides

## Documentation

All system documentation lives in `docs/`. These docs are the source of truth for how the project is structured and how its subsystems work. **You must keep them accurate at all times.**

- `docs/project-system.md` — full project architecture: stack, file structure, layouts, routing, markdown pipeline, deploy
- `docs/content-system.md` — content collection: types, schemas, nesting rules, querying, create/validate scripts

**Rules:**
1. When any change affects project structure, layouts, routing, content schemas, scripts, or config — update the relevant doc in the same session.
2. When a new subsystem or major feature is added — create a corresponding doc in `docs/` and add a reference here.
3. These rules apply regardless of mode (caveman, auto, fast) or task type (bug fix, feature, refactor).
4. Never defer doc updates to a later step or session. Docs update alongside code.

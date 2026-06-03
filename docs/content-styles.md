# Content Styles Guide

CSS conventions for blog, wiki, and project content pages. All content renders through `ContentLayout` → `.content` → `.content__body`.

## Width Tiers

All direct children of `.content__body` auto-constrain to prose width. Override with utility classes in MDX.

| Tier | Variable | Max | Applied to | MDX class |
|------|----------|-----|------------|-----------|
| Prose | `--w-prose` | 680px | Default — all `> *` children | *(automatic)* |
| Wide | `--w-wide` | 900px | `pre`, `table`, `.cl-render`, `.content__body-table-wrap` | `.wide` |
| Full | `--w-full` | 1200px | *(nothing auto)* | `.full` |

680px prose = ~65 CPL with Chakra Petch at body font size. Industry standard range (600-720px). Do not change without retesting CPL.

```mdx
Normal paragraph — auto prose width.

<div class="wide">
  This content spans up to 900px.
</div>

<div class="full">
  This content spans up to 1200px.
</div>
```

## Spacing Rhythm

Vertical spacing uses design tokens. Consistent top-heavy rhythm: more space above headings than below.

| Element | Top | Bottom | Token |
|---------|-----|--------|-------|
| `p` | — | `--space-sm` (1rem) | token |
| `h2` | `--space-md` (1.5rem) | `--space-xs` (0.5rem) | token |
| `h3`, `h4` | 1.25rem | `--space-xs` (0.5rem) | fine-tuned |
| `ul`, `ol` | — | `--space-sm` (1rem) | token |
| `li` | — | 0.25rem | fine-tuned |
| `blockquote` | — | `--space-sm` (1rem) | token |
| `pre` (code block) | — | `--space-sm` (1rem) | token |
| `img` | `--space-sm` (1rem) | `--space-sm` (1rem) | token |
| `hr` | `--space-lg` (2rem) | `--space-lg` (2rem) | token |

**Rule:** Use design tokens (`--space-xs` through `--space-lg`) for all standard spacing. Fine-tuned values (0.25rem, 1.25rem) are acceptable only for sub-element tweaks where no token fits — document with a comment if the value is non-obvious.

## Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Body | `--font-body` (Chakra Petch) | 400 | `clamp(0.9rem, 0.8rem + 0.5vw, 1.125rem)` | 1.6 |
| h1 | `--font-heading` | 600 | `clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem)` | 1.2 |
| h2 | `--font-heading` | 600 | `clamp(1.25rem, 1rem + 1vw, 1.75rem)` | 1.2 |
| h3 | `--font-heading` | 600 | `clamp(1.1rem, 0.95rem + 0.6vw, 1.4rem)` | 1.2 |
| h4 | `--font-heading` | 600 | `clamp(1rem, 0.9rem + 0.4vw, 1.2rem)` | 1.2 |
| Inline code | `--font-mono` (JetBrains Mono) | 400 | `clamp(0.8em, 0.75em + 0.25vw, 0.95em)` | — |
| Code blocks | `--font-mono` | 400 | 0.85rem | 1.5 |
| Breadcrumb | `--font-mono` | — | 0.75rem | — |
| Meta line | `--font-mono` | — | 0.8rem | — |

All sizes use `clamp()` for fluid scaling. Never use fixed `px` for body/heading font sizes.

## Color Rules

**Always use design tokens.** No hardcoded hex/rgb values in content styles.

| Purpose | Token |
|---------|-------|
| Body text | `--color-text` |
| Muted / secondary text | `--color-muted` |
| Accent (links, markers, highlights) | `--color-accent` |
| Borders, dividers | `--color-border` |
| Inline code background | `--color-bg` (inside `.content` card) |
| Code block background (Shiki) | theme-dependent: `github-light` (#fff) in light mode, Nord (#2e3440) in dark mode |
| Content card background | `--color-content-bg` |
| Surface / cards | `--color-surface` |

**Exception:** Shiki uses dual themes (`github-light` / `nord`) configured in `astro.config.mjs` under `shikiConfig.themes`. Each token is emitted with inline light colors plus `--shiki-dark` / `--shiki-dark-bg` CSS variables; `global.css` swaps to those variables under `[data-theme="dark"]`. Not controlled by manual color CSS.

## Element Styles

### Headings
- Margin above creates visual sections. `h2` gets the most (`--space-md`).
- No underline or border decorations — spacing alone separates.
- Content `h1` is in the header, not in `.content__body`. MDX content starts at `h2`.

### Lists
- Cyan accent markers (`li::marker { color: var(--color-accent) }`).
- Left padding: 1.5rem (enough for markers without feeling indented).
- Nested lists inherit — no special nesting styles needed.

### Blockquotes
- 3px left border in accent color.
- Muted text color, italic.
- Inner paragraphs have no bottom margin (blockquote has its own).

### Code
- **Inline code:** `--color-bg` background (contrasts with `--color-content-bg` card). Small border-radius.
- **Code blocks:** dual-theme via Shiki — light `github-light` (white bg, dark syntax) in light mode, `nord` (#2e3440 navy) in dark mode. Wrapped in a `.code-block` panel (language label + copy button) by BaseLayout. Prose width. On mobile: reduced font size (0.8em) and padding.
- **Inside `.content`:** inline code uses `--color-bg` (not `--color-surface`) because the card already uses `--color-content-bg` as its background — surface-on-surface has no contrast.

### Tables
- Auto-promote to `--w-wide`.
- Accent-colored headers with `--color-bg` background.
- Bottom borders on cells, none on last row.
- On mobile: `display: block` + `overflow-x: auto` for horizontal scroll.

### Images
- Block display, centered.
- Border radius `--radius-md`.
- Responsive: `max-width: 100%; height: auto` (global rule).

### Horizontal Rules
- 1px `--color-border` line. Large vertical margin (`--space-lg`) for strong section breaks.

## Content Card

The `.content` wrapper provides the "page" feel:

| Property | Desktop | Mobile (≤640px) |
|----------|---------|-----------------|
| Background | `--color-content-bg` | same |
| Padding | `--space-lg`, left += 40px (margin line) | `--space-sm` |
| Margin line | `::before`, 2px `--color-border`, full height | hidden |
| Shadow (light) | `0 2px 6px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.06)` | same |
| Shadow (dark) | white glow (3-layer) | same |
| Border radius | `--radius-md` | same |

## Breakpoints

Single mobile breakpoint at **640px**. Reference values from `:root` comment:

| Name | Width | Target |
|------|-------|--------|
| Mobile | 360px | Smallest common phone |
| Phablet | 480px | Large phone / landscape |
| **Tablet** | **640px** | **← active breakpoint** |
| Laptop | 1024px | Small laptop |
| Desktop | 1280px | Standard desktop |
| Wide | 1536px | Large desktop |
| WCAG floor | 320px | Minimum supported width |

Content must not overflow or break down to 320px. Test at 360px as the practical minimum.

### Mobile content changes
- Margin line hidden
- Padding reduced to `--space-sm`
- Code blocks: smaller font, smaller padding
- Tables: horizontal scroll
- Breadcrumb/meta: smaller font

## Blog vs Wiki vs Project

All three types share **identical** `.content__body` prose styles. The only visual differences are in the `.content__header` metadata line:

| Type | Header extras |
|------|---------------|
| Blog | `BLOG · date · DRAFT` (if draft) |
| Wiki | `WIKI · category · date` |
| Project | `PROJECT · status · date · [Live Site] [Repository]` |

**Do not create type-specific body styles.** Readers expect consistent prose rendering across all content. Differentiation happens in the header metadata, not in body typography.

## Adding New Content Elements

When adding a new styled element to content pages:

1. **Check if a global rule already handles it.** Read `global.css` content section before writing new CSS.
2. **Use design tokens** for all colors, spacing, and radii. Never hardcode.
3. **Add to `.content__body > .your-element`** selector to get automatic prose-width constraint.
4. **Choose width tier:** default (prose), `.wide`, or `.full`. Add to the selector group in global.css if it should auto-promote.
5. **Test both themes.** Every visual change must work in dark and light.
6. **Test at 360px.** Check for overflow, truncation, and readability.
7. **Prefix wiki-specific component classes** (e.g., `cl-` for Canvas Lab). Keep them in their own CSS file, imported in the relevant layout.

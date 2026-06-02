# Content System

## Overview

Unified content collection with three types: blog, wiki, project. All content lives in `src/content/` and is validated by a single Astro collection with a Zod discriminated union on the `type` field.

Folder path = URL path. No prefixes or transformations.

## Content Types

### Blog (`type: blog`)
Atomic markdown post. Can contain images, LaTeX, code, diagrams.

### Wiki (`type: wiki`)
Container page with its own markdown. Links to related writeups and blogs underneath.

### Project (`type: project`)
Landing page that links to its wikis, blogs, and notes.

## Nesting Rules

Types can nest inside each other:
- Blog can be standalone, inside a wiki, or inside a project
- Wiki can be standalone or inside a project
- Project is always top-level
- A wiki can contain a `blog/` subfolder
- A project can contain `blog/`, `wiki/`, `notes/` subfolders

## Common Base Fields (all types)

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `type` | `'blog'` \| `'wiki'` \| `'project'` | yes | Discriminator |
| `title` | string | yes | Display name |
| `description` | string | yes | Summary for listings and SEO |
| `createdAt` | date (YYYY-MM-DD) | yes | Creation date |
| `updatedAt` | date (YYYY-MM-DD) | no | Last modification date |
| `tags` | string[] | no (default []) | Categorization |

## Type-Specific Fields

### Blog
| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `draft` | boolean | no (default false) | Hide from prod build and listings |

### Wiki
| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `category` | string | yes | Topic category for grouping |

### Project
| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `status` | `'active'` \| `'completed'` \| `'archived'` | yes | Current state |
| `url` | string | no | Live site URL |
| `repo` | string | no | Source repo URL |

## Folder Structure

```
src/content/
├── blog/                           ← standalone blogs
├── wiki/
│   └── <topic>/
│       ├── index.mdx               ← wiki landing
│       ├── <writeup>.mdx           ← wiki sub-page
│       └── blog/
│           └── <post>.mdx          ← blog inside wiki
└── project/
    └── <project-name>/
        ├── index.mdx               ← project landing
        ├── <standalone>.mdx        ← loose pages
        ├── notes/                  ← notes subfolder
        ├── blog/                   ← blogs inside project
        └── wiki/
            └── <topic>/            ← wiki inside project
                ├── index.mdx
                └── blog/           ← blog inside wiki inside project
```

## CLI Commands

### Create content

```bash
npm run create <type> <name> [location]
npm run create help
```

Arguments:
- `type` — blog, wiki, or project
- `name` — content name (used as filename/folder name)
- `location` — optional. **Full path from content root** (e.g., `project/blurrysite`, not just `blurrysite`). Must be an existing directory. If omitted, uses type's root directory.

Examples:
```bash
# Root level (no location — type prefix added automatically)
npm run create blog my-post              → content/blog/my-post.mdx
npm run create wiki wiki-one             → content/wiki/wiki-one/index.mdx
npm run create project project-one       → content/project/project-one/index.mdx

# Nested (with location — FULL path from content root)
npm run create blog my-post project/project-one
                                         → content/project/project-one/my-post.mdx
npm run create wiki wiki-two project/project-one
                                         → content/project/project-one/wiki-two/index.mdx
npm run create blog intro wiki/wiki-one
                                         → content/wiki/wiki-one/intro.mdx

# WRONG — just folder name, not full path
npm run create blog my-post project-one  → Error (use project/project-one)
```

- Blog: always a single `.mdx` file
- Wiki/Project: always a folder with `index.mdx`
- Will not overwrite existing files
- Location = full path from `src/content/`, not just folder name
- Location must exist (create parents first)
- Invalid location throws error with suggestion

### Validate content

```bash
npm run validate
```

- Checks all `.md`/`.mdx` files against their schemas
- Runs automatically before every build (`prebuild` hook)
- Reports all errors at once
- Exits with code 1 on failure

## Querying Content

```js
import { getCollection } from 'astro:content';

const all = await getCollection('content');
const blogs = all.filter(e => e.data.type === 'blog');
const published = blogs.filter(e => !e.data.draft);
const recent = all.sort((a, b) => b.data.createdAt - a.data.createdAt);
const tagged = all.filter(e => e.data.tags.includes('security'));
const projectContent = all.filter(e => e.id.startsWith('project/my-app/'));
```

## Models

Single source of truth in `src/models/`:
- `base.js` — common fields (schema + template)
- `blog.js` — blog-specific fields + metadata
- `wiki.js` — wiki-specific fields + metadata
- `project.js` — project-specific fields + metadata

Used by `src/content.config.js` (validation) and `scripts/create.js` (scaffolding).

## Canvas Lab Wiki (Custom Components)

The `wiki/canvas-lab/` section contains 10 interactive HTML Canvas lessons migrated from a standalone site. It uses custom Astro components importable in MDX:

| Component | File | Purpose |
|---|---|---|
| `CanvasRender` | `src/components/canvas-lab/CanvasRender.astro` | Live code playground — editable textarea + canvas with Run/Reset |
| `Concept` | `src/components/canvas-lab/Concept.astro` | Styled callout block for key concepts |
| `LessonNav` | `src/components/canvas-lab/LessonNav.astro` | Prev/next lesson navigation |
| `LessonHeader` | `src/components/canvas-lab/LessonHeader.astro` | Lesson number badge + description |

Styles live in `src/styles/canvas-lab.css` (all classes prefixed `cl-`). Canvas demo backgrounds are forced-dark so hardcoded canvas drawing colors render correctly in both themes.

Structure:
```
src/content/wiki/canvas-lab/
  index.mdx              ← wiki (landing with lesson list)
  00-foundation.mdx      ← blog (lesson, nested in wiki)
  01-basics.mdx          ← blog
  ...
  08-particle-system.mdx ← blog
  09-drift.mdx           ← blog (final boss: full fluid sim)
  appendix-bezier-math.mdx ← wiki
```

## Adding a New Content Type

1. Create `src/models/<type>.js` (schema, template, meta)
2. Add to discriminated union in `src/content.config.js`
3. Add type to `TYPES` array in `scripts/create.js`
4. Schema imports in `scripts/validate.js` will auto-discover via model import

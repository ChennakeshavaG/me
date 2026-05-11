import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const contentDir = join(rootDir, 'src', 'content');

const TYPES = ['blog', 'wiki', 'project'];

const rawArgs = process.argv.slice(2);
const dryRun = rawArgs.includes('dry-run');
const args = rawArgs.filter(a => a !== 'dry-run');
const type = args[0];
const name = args[1];
const location = args[2];

if (type === 'help' || type === '--help' || type === '-h') {
  printHelp();
  process.exit(0);
}

if (!type || !name) {
  printUsage();
  process.exit(1);
}

if (!TYPES.includes(type)) {
  console.error(`Unknown type: "${type}". Available types: ${TYPES.join(', ')}`);
  process.exit(1);
}

function printUsage() {
  console.error(`Usage: npm run create <${TYPES.join('|')}> <name> [location]`);
  console.error('       npm run create help');
}

function printHelp() {
  console.log(`
Content Scaffolding Tool
========================

Usage: npm run create <type> <name> [location] [dry-run]

Arguments:
  type        blog | wiki | project
  name        Content name (used as filename/folder name)
  location    Optional. FULL path from content root to the parent directory.
              NOT just the folder name — include the type prefix.
              If omitted, content goes under type's root directory.
              Must be an existing directory in src/content/.

Types:
  blog      Always a single .mdx file.
  wiki      Always a folder with index.mdx.
  project   Always a folder with index.mdx.

Examples:

  Root level (no location — type prefix added automatically):
    npm run create blog my-post              → content/blog/my-post.mdx
    npm run create wiki wiki-one             → content/wiki/wiki-one/index.mdx
    npm run create project project-one       → content/project/project-one/index.mdx

  Nested (with location — use FULL path from content root):
    npm run create blog my-post project/project-one
                                             → content/project/project-one/my-post.mdx
    npm run create wiki wiki-two project/project-one
                                             → content/project/project-one/wiki-two/index.mdx
    npm run create blog intro wiki/wiki-one
                                             → content/wiki/wiki-one/intro.mdx
    npm run create blog deep-dive project/project-one/wiki-two
                                             → content/project/project-one/wiki-two/deep-dive.mdx

  WRONG — folder name alone is not a valid location:
    npm run create blog my-post project-one
                                             → Error: location "project-one" does not exist
                                             → Use: project/project-one

  Location must exist (create parents first):
    npm run create blog intro project/project-two
                                             → Error: location "project/project-two" does not exist

Flags:
  dry-run     Preview what would be created without writing files
              Can be placed anywhere in the command

Behavior:
  - Will NOT overwrite existing files
  - Location = full path from src/content/ (not just folder name)
  - Location must exist (create parents first)
  - Adds type field and createdAt (today) to frontmatter
  - Blog files start with draft: true

Other commands:
  npm run validate     Validate all content against schemas
  npm run build        Build site (runs validate first via prebuild)
`);
}

async function main() {
  const model = await import(join(rootDir, 'src', 'models', `${type}.js`));
  const { template, meta } = model;

  const today = new Date().toISOString().split('T')[0];
  const displayName = basename(name);

  let contentPath;
  if (location) {
    const locationDir = join(contentDir, location);
    if (!existsSync(locationDir)) {
      console.error(`Error: Location "${location}" does not exist.`);
      const locParts = location.split('/');
      const locType = TYPES.includes(locParts[0]) ? locParts[0] : null;
      if (locType && locParts.length >= 2) {
        console.error(`Create it first:`);
        console.error(`  npm run create ${locType} ${locParts[locParts.length - 1]}${locParts.length > 2 ? ' ' + locParts.slice(0, -1).join('/') : ''}`);
      }
      process.exit(1);
    }
    contentPath = join(location, name);
  } else {
    contentPath = join(meta.directory, name);
  }

  let filePath;
  if (meta.indexFile) {
    filePath = join(contentDir, contentPath, 'index.mdx');
  } else {
    filePath = join(contentDir, contentPath + '.mdx');
  }

  if (existsSync(filePath)) {
    console.error(`File already exists: ${filePath}`);
    console.error('Will not overwrite.');
    process.exit(1);
  }

  const frontmatter = {};
  for (const [key, value] of Object.entries(template)) {
    if (value === '{{name}}') {
      frontmatter[key] = displayName;
    } else if (value === '{{today}}') {
      frontmatter[key] = today;
    } else {
      frontmatter[key] = value;
    }
  }

  const yaml = toYaml(frontmatter);
  const content = `---\n${yaml}---\n\n# ${displayName}\n`;

  if (dryRun) {
    console.log(`[dry-run] Would create ${type}: ${filePath}`);
    console.log(`[dry-run] URL: /${contentPath.replace(/\/index$/, '')}`);
    console.log(`[dry-run] Frontmatter:\n${yaml}`);
    return;
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
  console.log(`Created ${type}: ${filePath}`);
}

function toYaml(obj) {
  let lines = [];
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'string' && value === '') {
      lines.push(`${key}: ""`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join('\n') + '\n';
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

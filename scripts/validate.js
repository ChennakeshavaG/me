import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const contentDir = join(rootDir, 'src', 'content');

async function main() {
  const blogModel = await import(join(rootDir, 'src', 'models', 'blog.js'));
  const wikiModel = await import(join(rootDir, 'src', 'models', 'wiki.js'));
  const projectModel = await import(join(rootDir, 'src', 'models', 'project.js'));

  const schemas = {
    blog:    blogModel.schema,
    wiki:    wikiModel.schema,
    project: projectModel.schema,
  };

  const files = findFiles(contentDir, ['.md', '.mdx']);

  if (files.length === 0) {
    console.log('No content files found.');
    return;
  }

  let passed = 0;
  let failed = 0;
  const errors = [];

  for (const file of files) {
    const rel = relative(contentDir, file);
    const raw = readFileSync(file, 'utf-8');
    const frontmatter = parseFrontmatter(raw);

    if (!frontmatter) {
      errors.push({ file: rel, messages: ['No frontmatter found'] });
      failed++;
      continue;
    }

    if (!frontmatter.type) {
      errors.push({ file: rel, messages: ['Missing required field: type'] });
      failed++;
      continue;
    }

    const schema = schemas[frontmatter.type];
    if (!schema) {
      errors.push({
        file: rel,
        messages: [`Unknown type: "${frontmatter.type}". Valid types: ${Object.keys(schemas).join(', ')}`],
      });
      failed++;
      continue;
    }

    const result = schema.safeParse(frontmatter);
    if (result.success) {
      console.log(`  ✓ ${rel} (${frontmatter.type})`);
      passed++;
    } else {
      const messages = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      errors.push({ file: rel, messages });
      failed++;
    }
  }

  console.log('');

  if (errors.length > 0) {
    for (const { file, messages } of errors) {
      console.error(`  ✗ ${file}`);
      for (const msg of messages) {
        console.error(`    - ${msg}`);
      }
    }
    console.log('');
  }

  console.log(`${passed} passed, ${failed} failed out of ${files.length} files.`);

  if (failed > 0) {
    process.exit(1);
  }
}

function findFiles(dir, extensions) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...findFiles(full, extensions));
    } else if (extensions.some((ext) => full.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const data = {};

  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner === '' ? [] : inner.split(',').map((s) => s.trim());
    } else if (value === 'true') {
      data[key] = true;
    } else if (value === 'false') {
      data[key] = false;
    } else if (value.startsWith('"') && value.endsWith('"')) {
      data[key] = value.slice(1, -1);
    } else {
      data[key] = value;
    }
  }

  return data;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

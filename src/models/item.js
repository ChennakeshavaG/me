import { z } from 'zod';

export const routeSegmentSchema = z.object({
  label:  z.string(),
  href:   z.string().nullable(),
  isType: z.boolean().default(false),
});

export const itemSchema = z.object({
  id:          z.string(),
  href:        z.string(),
  type:        z.enum(['blog', 'wiki', 'project']),
  pinned:      z.boolean(),
  title:       z.string(),
  description: z.string(),
  date:        z.string(),
  route:       z.array(routeSegmentSchema),
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function buildRoute(entry, titleMap) {
  const segments = entry.id.split('/');
  return segments.map((seg, i) => {
    if (i === 0) {
      return { label: seg, href: null, isType: true };
    }
    if (i === segments.length - 1) {
      return { label: entry.data.title, href: null, isType: false };
    }
    const path = segments.slice(0, i + 1).join('/');
    const title = titleMap.get(path) || seg;
    return { label: title, href: '/' + path, isType: false };
  });
}

export function buildItem(entry, titleMap) {
  return itemSchema.parse({
    id:          entry.id,
    href:        '/' + entry.id,
    type:        entry.data.type,
    pinned:      entry.data.pinned ?? false,
    title:       entry.data.title,
    description: entry.data.description,
    date:        dateFormatter.format(entry.data.createdAt),
    route:       buildRoute(entry, titleMap),
  });
}

export function buildItems(entries) {
  const titleMap = new Map(entries.map(e => [e.id, e.data.title]));

  const filtered = import.meta.env.PROD
    ? entries.filter(e => !(e.data.type === 'blog' && e.data.draft))
    : entries;

  const items = filtered.map(e => buildItem(e, titleMap));

  const dateMap = new Map(filtered.map(e => [e.id, e.data.createdAt.getTime()]));
  return items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return dateMap.get(b.id) - dateMap.get(a.id);
  });
}

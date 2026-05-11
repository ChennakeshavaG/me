import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro:schema';
import { baseSchema } from './models/base.js';

const content = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: 'src/content' }),
  schema: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('blog'),
      ...baseSchema,
      draft: z.boolean().default(false),
    }),
    z.object({
      type: z.literal('wiki'),
      ...baseSchema,
      category: z.string(),
    }),
    z.object({
      type: z.literal('project'),
      ...baseSchema,
      status: z.enum(['active', 'completed', 'archived']),
      url:    z.string().optional(),
      repo:   z.string().optional(),
    }),
  ]),
});

export const collections = { content };

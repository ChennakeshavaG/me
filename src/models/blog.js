import { z } from 'zod';
import { baseSchema, baseTemplate } from './base.js';

export const schema = z.object({
  type: z.literal('blog'),
  ...baseSchema,
  draft: z.boolean().default(false),
});

export const template = {
  type:  'blog',
  ...baseTemplate,
  draft: true,
};

export const meta = {
  name:      'blog',
  directory: 'blog',
  indexFile: false,
};

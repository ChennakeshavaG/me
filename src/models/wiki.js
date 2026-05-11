import { z } from 'zod';
import { baseSchema, baseTemplate } from './base.js';

export const schema = z.object({
  type: z.literal('wiki'),
  ...baseSchema,
  category: z.string(),
});

export const template = {
  type:     'wiki',
  ...baseTemplate,
  category: '',
};

export const meta = {
  name:      'wiki',
  directory: 'wiki',
  indexFile: true,
};

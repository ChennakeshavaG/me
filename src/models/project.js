import { z } from 'zod';
import { baseSchema, baseTemplate } from './base.js';

export const schema = z.object({
  type: z.literal('project'),
  ...baseSchema,
  status: z.enum(['active', 'completed', 'archived']),
  url:    z.string().optional(),
  repo:   z.string().optional(),
});

export const template = {
  type:   'project',
  ...baseTemplate,
  status: 'active',
};

export const meta = {
  name:      'project',
  directory: 'project',
  indexFile: true,
};

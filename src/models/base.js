import { z } from 'zod';

export const baseSchema = {
  title:       z.string(),
  description: z.string(),
  createdAt:   z.coerce.date(),
  updatedAt:   z.coerce.date().optional(),
  tags:        z.array(z.string()).default([]),
  pinned:      z.boolean().default(false),
};

export const baseTemplate = {
  title:       '{{name}}',
  description: '',
  createdAt:   '{{today}}',
  tags:        [],
};

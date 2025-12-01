import { z } from 'zod';

export const createClusterSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  short_name: z.string(),
  created_by_id: z.number(),
  updated_by_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Cluster = z.infer<typeof createClusterSchema>;

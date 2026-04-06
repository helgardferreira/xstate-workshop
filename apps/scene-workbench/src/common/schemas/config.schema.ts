import * as z from 'zod';

import { PersistenceConfigSchema } from './persistence-config.schema';

/**
 * Schema for environment variables.
 *
 * This schema is used to validate the environment variables used in the
 * application.
 */
export const ConfigSchema = z.object({
  ...PersistenceConfigSchema.shape,
});

export type Config = z.infer<typeof ConfigSchema>;

import * as z from 'zod';

/**
 * Schema for the persistence configuration.
 *
 * This schema is used to validate the persistence configuration used in the
 * application.
 */
export const PersistenceConfigSchema = z.object({});

export type PersistenceConfig = z.infer<typeof PersistenceConfigSchema>;

import { z } from 'zod';

import { SceneEntitySchema } from '../entities/scene-entity.js';

// ────────────────────────────────────────────
// Scene config
// ────────────────────────────────────────────

const SceneConfigSchema = z.object({
  /** Human-readable scene name. */
  name: z.string(),

  /**
   * Reference to an environment map by name.
   * Your application code resolves this to an actual loaded texture.
   */
  environment: z.string().optional(),

  /** Ordered list of entities in the scene. */
  entities: z.array(SceneEntitySchema).prefault([]),
});

type SceneConfig = z.infer<typeof SceneConfigSchema>;

export { SceneConfigSchema };

export type { SceneConfig };

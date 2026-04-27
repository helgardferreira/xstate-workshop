import { z } from 'zod';

import { TransformSchema } from './spatial.schema.js';

const SceneEntitySchema = z.object({
  /** Unique identifier for this entity within the scene. */
  id: z.string(),

  /**
   * Reference to a known model by name.
   * Your application code resolves this to an actual loaded GLTF.
   */
  model: z.string(),

  /** World-space transform. All fields optional with sensible defaults. */
  transform: TransformSchema.prefault({}),
});

type SceneEntity = z.output<typeof SceneEntitySchema>;

export { SceneEntitySchema };

export type { SceneEntity };

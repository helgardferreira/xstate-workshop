/**
 * Client -> Server messages (what the frontend sends).
 */
import * as z from 'zod';

import { SceneConfigSchema } from '../../scenes/scene-config.js';
import { EnvelopeMetaSchema } from '../envelope-meta.schema.js';

const ClientUpdateSceneSchema = z.object({
  type: z.literal('UPDATE_SCENE'),
  scene: SceneConfigSchema,
});

// TODO: implement any additional client -> server message schemas
const ClientMessageSchema = z
  .object({ meta: EnvelopeMetaSchema.optional() })
  .and(z.discriminatedUnion('type', [ClientUpdateSceneSchema]));

export { ClientMessageSchema, ClientUpdateSceneSchema };

type ClientMessage = z.output<typeof ClientMessageSchema>;
type ClientUpdateScene = z.output<typeof ClientUpdateSceneSchema>;

export type { ClientMessage, ClientUpdateScene };

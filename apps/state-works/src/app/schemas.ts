import { z } from 'zod';

import {
  SceneConfigSchema,
  SceneEntitySchema,
} from '@xstate-workshop/scene-protocol';

import { APP_TAGS, MODEL_NAMES } from './constants';

const AppEntitySchema = z.object({
  ...SceneEntitySchema.shape,
  model: z.enum(MODEL_NAMES),
});

const AppEntityUserDataSchema = z.object({
  tags: z.enum(APP_TAGS).array(),
});

const AppSceneConfigSchema = z.object({
  ...SceneConfigSchema.shape,
  entities: AppEntitySchema.array(),
});

type AppEntity = z.output<typeof AppEntitySchema>;
type AppEntityInput = z.input<typeof AppEntitySchema>;

type AppEntityUserData = z.output<typeof AppEntityUserDataSchema>;

type AppSceneConfig = z.output<typeof AppSceneConfigSchema>;
type AppSceneConfigInput = z.input<typeof AppSceneConfigSchema>;

export { AppEntitySchema, AppEntityUserDataSchema, AppSceneConfigSchema };

export type {
  AppEntity,
  AppEntityInput,
  AppEntityUserData,
  AppSceneConfig,
  AppSceneConfigInput,
};

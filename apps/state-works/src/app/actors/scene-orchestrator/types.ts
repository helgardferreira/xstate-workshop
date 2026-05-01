import type { Subject } from 'rxjs';
import type z from 'zod';

import type {
  SceneConfig,
  SceneConfigSchema,
  SceneSummary,
} from '@xstate-workshop/scene-protocol';

type SceneOrchestratorActorContext = {
  currentScene: SceneConfig;
  sceneConfigQueueSubject: Subject<SceneConfig>;
  sceneSummaries: SceneSummary[];
};

type SceneOrchestratorActorInput = {
  scene?: string;
};

type InitEvent = {
  type: 'INIT';
};

type UpsertSceneConfigEvent = {
  type: 'UPSERT_SCENE_CONFIG';
  sceneConfig: z.input<typeof SceneConfigSchema>;
};

type InitializedEvent = {
  type: 'INITIALIZED';
  sceneConfig: SceneConfig | undefined;
  sceneSummaries: SceneSummary[];
};

type SceneOrchestratorActorEvent =
  | InitEvent
  | InitializedEvent
  | UpsertSceneConfigEvent;

export type {
  InitEvent,
  InitializedEvent,
  SceneOrchestratorActorContext,
  SceneOrchestratorActorEvent,
  SceneOrchestratorActorInput,
  UpsertSceneConfigEvent,
};

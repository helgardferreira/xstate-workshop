import type { Subject } from 'rxjs';
import type { ZodError } from 'zod';

import { type SceneSummary } from '@xstate-workshop/scene-protocol';

import type {
  AppEntityInput,
  AppSceneConfig,
  AppSceneConfigInput,
} from '../../schemas';

type SceneManagerActorContext = {
  currentScene: AppSceneConfig;
  sceneConfigQueueSubject: Subject<AppSceneConfig>;
  sceneSummaries: SceneSummary[];
};

type SceneManagerActorInput = {
  scene?: string;
};

type AddEntityEvent = {
  type: 'ADD_ENTITY';
  entity: AppEntityInput;
};

type InitEvent = {
  type: 'INIT';
};

type InitializedEvent = {
  type: 'INITIALIZED';
  sceneConfig: AppSceneConfig | undefined;
  sceneSummaries: SceneSummary[];
};

type ParseErrorEvent = {
  type: 'PARSE_ERROR';
  error: ZodError;
};

type RemoveEntityEvent = {
  type: 'REMOVE_ENTITY';
  id: string;
};

type UnknownErrorEvent = {
  type: 'UNKNOWN_ERROR';
  error: unknown;
};

type UpsertSceneConfigEvent = {
  type: 'UPSERT_SCENE_CONFIG';
  sceneConfig: AppSceneConfigInput;
};

type SceneManagerActorEvent =
  | AddEntityEvent
  | InitEvent
  | InitializedEvent
  | ParseErrorEvent
  | RemoveEntityEvent
  | UnknownErrorEvent
  | UpsertSceneConfigEvent;

export type {
  AddEntityEvent,
  InitEvent,
  InitializedEvent,
  ParseErrorEvent,
  RemoveEntityEvent,
  SceneManagerActorContext,
  SceneManagerActorEvent,
  SceneManagerActorInput,
  UnknownErrorEvent,
  UpsertSceneConfigEvent,
};

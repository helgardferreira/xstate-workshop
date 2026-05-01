import { forkJoin, map } from 'rxjs';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '@xstate-workshop/actors';
import { io } from '@xstate-workshop/io';
import {
  SceneConfigSchema,
  SceneSummarySchema,
} from '@xstate-workshop/scene-protocol';

import type { InitializedEvent } from '../types';

type InitSceneOrchestratorActorInput = {
  sceneName: string;
};

const initSceneOrchestrator: EventObservableCreator<
  InitializedEvent,
  InitSceneOrchestratorActorInput
> = ({ input }) =>
  forkJoin({
    getSceneConfigResult: io(SceneConfigSchema).get(
      `/api/scenes/${input.sceneName}`
    ),
    getSceneSummariesResult: io(SceneSummarySchema.array()).get('/api/scenes'),
  }).pipe(
    map(({ getSceneConfigResult, getSceneSummariesResult }) => {
      if (!getSceneSummariesResult.ok) {
        throw new Error('Failed to get scene summaries.');
      }

      const sceneConfig = getSceneConfigResult.ok
        ? getSceneConfigResult.value
        : undefined;
      const sceneSummaries = getSceneSummariesResult.value;

      return { type: 'INITIALIZED', sceneConfig, sceneSummaries };
    })
  );

export const initSceneOrchestratorLogic = fromEventObservable(
  initSceneOrchestrator
);

export type InitSceneOrchestratorActorRef = ActorRefFrom<
  typeof initSceneOrchestratorLogic
>;

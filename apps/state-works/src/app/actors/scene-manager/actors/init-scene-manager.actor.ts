import { forkJoin, map } from 'rxjs';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '@xstate-workshop/actors';
import { io } from '@xstate-workshop/io';
import { SceneSummarySchema } from '@xstate-workshop/scene-protocol';

import { AppSceneConfigSchema } from '../../../schemas';
import type { InitializedEvent } from '../types';

type InitSceneManagerActorInput = {
  sceneName: string;
};

const initSceneManager: EventObservableCreator<
  InitializedEvent,
  InitSceneManagerActorInput
> = ({ input }) =>
  forkJoin({
    getSceneConfigResult: io(AppSceneConfigSchema).get(
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

export const initSceneManagerLogic = fromEventObservable(initSceneManager);

export type InitSceneManagerActorRef = ActorRefFrom<
  typeof initSceneManagerLogic
>;

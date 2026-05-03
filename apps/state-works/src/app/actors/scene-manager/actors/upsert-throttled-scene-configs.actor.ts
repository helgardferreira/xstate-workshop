import { EMPTY, type Subject, catchError, concatMap, throttleTime } from 'rxjs';
import { type ActorRefFrom, fromObservable } from 'xstate';

import type { ObservableCreator } from '@xstate-workshop/actors';
import { io } from '@xstate-workshop/io';
import { SceneConfigSchema } from '@xstate-workshop/scene-protocol';

import type { AppSceneConfig } from '../../../schemas';

const upsertThrottledSceneConfigs: ObservableCreator<
  unknown,
  Subject<AppSceneConfig>
> = ({ input }) =>
  input.pipe(
    throttleTime(1000, undefined, { leading: true, trailing: true }),
    concatMap((sceneConfig) =>
      io(SceneConfigSchema, SceneConfigSchema)
        .post('/api/scenes', sceneConfig)
        .pipe(catchError(() => EMPTY))
    )
  );

export const upsertThrottledSceneConfigsLogic = fromObservable(
  upsertThrottledSceneConfigs
);

export type UpsertThrottledSceneConfigsActorRef = ActorRefFrom<
  typeof upsertThrottledSceneConfigsLogic
>;

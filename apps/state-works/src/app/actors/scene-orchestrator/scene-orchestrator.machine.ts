import { Subject } from 'rxjs';
import { type ActorRefFrom, type SnapshotFrom, assign, setup } from 'xstate';

import { SceneConfigSchema } from '@xstate-workshop/scene-protocol';

import { initSceneOrchestratorLogic } from './actors/init-scene-orchestrator.actor';
import { upsertThrottledSceneConfigsLogic } from './actors/upsert-throttled-scene-configs.actor';
import type {
  InitializedEvent,
  SceneOrchestratorActorContext,
  SceneOrchestratorActorEvent,
  SceneOrchestratorActorInput,
  UpsertSceneConfigEvent,
} from './types';

const sceneOrchestratorMachine = setup({
  types: {
    context: {} as SceneOrchestratorActorContext,
    events: {} as SceneOrchestratorActorEvent,
    input: {} as SceneOrchestratorActorInput,
  },
  actions: {
    initialize: assign(
      (_, { sceneConfig, sceneSummaries }: Omit<InitializedEvent, 'type'>) => ({
        currentScene: sceneConfig,
        sceneSummaries,
      })
    ),
    logError: (_, { error }: { error: unknown }) => console.error(error),
    upsertSceneConfig: (
      { context },
      { sceneConfig }: Omit<UpsertSceneConfigEvent, 'type'>
    ) => {
      context.sceneConfigQueueSubject.next(
        SceneConfigSchema.decode(sceneConfig)
      );
    },
  },
  actors: {
    initSceneOrchestratorLogic,
    upsertThrottledSceneConfigsLogic,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwMZgHZgOoHsBOA1gEYYoAWAdAJYQA2YAxAJIByTAKgNoAMAuoqAAOOWFQAuVHOgEgAHogCMAZm4UAbAFYAHFo0AmAJxKFGlXr0AaEAE9EehXvUB2NUqdaALAYOvuJgL7+VqgY2PjEpJRU6OJUAIa0VABe0VAMYHh4+BSCtHFiAGb4ALYUMGIAymiYFQCuxcVxeFRwPPxIIMKiElIy8gjKqpo6+kYmZpY2inqqHtyGTspOY9w6gcHVYYQk6OTUMRIJyakMFQCi7AD6FQDCZyxn1wCqALIvAIIASkxnFW0yXVivQ6-Rcqi0ei0q0W5jUiwUVlsAycSgoSm83G4Gm4ajGeiU6xAIUwuG2kQocRQEgAbowngAFc6fK63e6PG4AeRYADEmABxf4dQE9aQgxSrNQUBweDwKNQKBSyrQIqYIZVo8xaAxygyQpweNRqQJBEDoHAQOAyYlbCK7MgAkRA0WgfoAWjUiMQ7sJ1tJtr2NHoDu6kmdckQHkmSJmHgoLj0uMhehRKg0Hh9mz9OwDB3iiRS6CgwadfUQSjUsa0Shm3Cc+qhngMnoGrjR7gUBm4c1laj0GdCWfJlJpYGLItLA0xks8biUHlM8pRzYU6o0Bica78Bu0Bghxv8QA */
  id: 'sceneOrchestrator',

  context: ({ input }) => ({
    currentScene: {
      name: input.scene ?? 'default',
      entities: [],
    },
    sceneConfigQueueSubject: new Subject(),
    sceneSummaries: [],
  }),

  initial: 'idle',

  states: {
    idle: {
      on: {
        INIT: 'initializing',
      },
    },

    initializing: {
      invoke: [
        {
          id: 'initSceneOrchestrator',
          input: ({ context }) => ({ sceneName: context.currentScene.name }),
          src: 'initSceneOrchestratorLogic',
          onError: {
            actions: {
              params: ({ event }) => ({ error: event.error }),
              type: 'logError',
            },
            target: 'idle',
          },
        },
      ],

      on: {
        INITIALIZED: {
          actions: {
            params: ({ event }) => ({
              sceneConfig: event.sceneConfig,
              sceneSummaries: event.sceneSummaries,
            }),
            type: 'initialize',
          },
          target: 'active',
        },
      },
    },

    active: {
      invoke: {
        id: 'upsertThrottledSceneConfigs',
        input: ({ context }) => context.sceneConfigQueueSubject,
        src: 'upsertThrottledSceneConfigsLogic',
      },

      on: {
        UPSERT_SCENE_CONFIG: {
          actions: {
            params: ({ event }) => ({ sceneConfig: event.sceneConfig }),
            type: 'upsertSceneConfig',
          },
        },
      },
    },
  },
});

type SceneOrchestratorActorRef = ActorRefFrom<typeof sceneOrchestratorMachine>;
type SceneOrchestratorActorSnapshot = SnapshotFrom<
  typeof sceneOrchestratorMachine
>;

export { sceneOrchestratorMachine };

export type { SceneOrchestratorActorRef, SceneOrchestratorActorSnapshot };

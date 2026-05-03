import { Subject } from 'rxjs';
import {
  type ActorRefFrom,
  type SnapshotFrom,
  assign,
  enqueueActions,
  setup,
} from 'xstate';
import { ZodError } from 'zod';

import { AppEntitySchema, AppSceneConfigSchema } from '../../schemas';

import { initSceneManagerLogic } from './actors/init-scene-manager.actor';
import { upsertThrottledSceneConfigsLogic } from './actors/upsert-throttled-scene-configs.actor';
import type {
  AddEntityEvent,
  InitializedEvent,
  RemoveEntityEvent,
  SceneManagerActorContext,
  SceneManagerActorEvent,
  SceneManagerActorInput,
  UpsertSceneConfigEvent,
} from './types';

// TODO: implement ability to manage multiple `Scene` instances in memory
const sceneManagerMachine = setup({
  types: {
    context: {} as SceneManagerActorContext,
    events: {} as SceneManagerActorEvent,
    input: {} as SceneManagerActorInput,
  },
  actions: {
    addEntity: enqueueActions(
      ({ context, enqueue }, { entity }: Omit<AddEntityEvent, 'type'>) => {
        try {
          const decodedEntity = AppEntitySchema.decode(entity);

          enqueue.assign({
            currentScene: {
              ...context.currentScene,
              entities: context.currentScene.entities.concat(decodedEntity),
            },
          });
        } catch (error) {
          if (error instanceof ZodError) {
            enqueue.raise({ type: 'PARSE_ERROR', error });
          } else {
            enqueue.raise({ type: 'UNKNOWN_ERROR', error });
          }
        }
      }
    ),
    initialize: assign(
      (
        { context },
        { sceneConfig, sceneSummaries }: Omit<InitializedEvent, 'type'>
      ) => ({
        currentScene: sceneConfig ?? context.currentScene,
        sceneSummaries,
      })
    ),
    logError: (_, { error }: { error: unknown }) => console.error(error),
    removeEntity: enqueueActions(
      ({ context, enqueue }, { id }: Omit<RemoveEntityEvent, 'type'>) => {
        try {
          const currentEntities = context.currentScene.entities;

          const entityIdx = context.currentScene.entities.findIndex(
            (entity) => entity.id === id
          );

          if (entityIdx === -1) throw new Error(`Entity "${id}" not found`);

          enqueue.assign({
            currentScene: {
              ...context.currentScene,
              entities: currentEntities
                .slice(0, entityIdx)
                .concat(currentEntities.slice(entityIdx + 1)),
            },
          });
        } catch (error) {
          enqueue.raise({ type: 'UNKNOWN_ERROR', error });
        }
      }
    ),
    upsertSceneConfig: (
      { context },
      { sceneConfig }: Omit<UpsertSceneConfigEvent, 'type'>
    ) => {
      context.sceneConfigQueueSubject.next(
        AppSceneConfigSchema.decode(sceneConfig)
      );
    },
  },
  actors: {
    initSceneManagerLogic,
    upsertThrottledSceneConfigsLogic,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwMZgHZgLIEN05gCcBiABQEEAlAZQFEB9WyygeUoG0AGAXUVAAcA9rACWAFxGD0fEAA9EAVgAcATgB0KgMwqALAHZNnPQDYATMaV6ANCACeiAIxG1pvfofHOWztoWmAvv42qBjYeARgJACqAHIA0jEsAOoxjMxsXLxIIEKiElIy8ggKBmoepg6VnDqapgqcDjb2CA4BQSAhmLj4RGoiEAA2YMQAkjEjACqZMrniktLZRQ6aCmrGykrGDjpemjqbpk2KKkpqenoKhpzmepZKCoHBaF3hvSLoczgDIgBe71DESKEQSENT8AY4MQAMxBAFs+h8xNRnmEepFptlZvkFqAlis1hstjstPszEdipxjGp6g57kpNA49ComUpHh0Ud0IqD3p9vn90ACxpMRuQADIjABatAAIhiBMI5gVFogLpwXD4nBcdCpTKYlOSFAp1NqmSoHMydOtzmzOqiuWocCgJAA3YZRUh0SgTejUADCtBiDF9LBiADERgBxOU5BXYwqIZmnHSmFTVBQWPQOBQ6BTky16NTJ2mVLaVZR6G0c16RB1OkSu4jkaXSxgxCaTACa0ax83jLWuDjWdWMOc0Shq9005M0elMZXc5vppk4XkroU5vUdLuGlFoWBYADUGAH2xMuzwZrHe8r+5xVkolNcZ+dzkpGnZEK4qZZTDPlsudBNYxAnadBBAgOAZFtDdIkvPJr1xRAAFp32aWl1GzXQR08HMTiUNonnXatuUGMA4MVHE5EQfQDVTNRNg8VVsxndM1xeNFuUREQvl+f5yLjG8Vh0dU9DvPVfy0FQVANbVC3OLNRIsOlNDYu1NzrV1+IQqiEFUdRtnHS5ah0RkpINYwC2MFR1k8VpXFpED-CAA */
  id: 'sceneManager',

  context: ({ input }) => ({
    currentScene: {
      name: input.scene ?? 'default',
      entities: [
        {
          id: 'robot-arm-a-example',
          model: 'robot-arm-a',
          transform: {
            position: { x: -2, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, order: 'XYZ' },
            scale: { x: 1, y: 1, z: 1 },
          },
        },
        {
          id: 'robot-arm-a-example-alt',
          model: 'robot-arm-a',
          transform: {
            position: { x: 2, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, order: 'XYZ' },
            scale: { x: 1, y: 1, z: 1 },
          },
        },
      ],
    },
    sceneConfigQueueSubject: new Subject(),
    sceneSummaries: [],
  }),

  initial: 'idle',

  on: {
    PARSE_ERROR: {
      actions: {
        params: ({ event }) => ({ error: event.error }),
        type: 'logError',
      },
    },
    UNKNOWN_ERROR: {
      actions: {
        params: ({ event }) => ({ error: event.error }),
        type: 'logError',
      },
    },
  },

  states: {
    idle: {
      on: {
        INIT: 'initializing',
      },
    },

    initializing: {
      invoke: [
        {
          id: 'initSceneManager',
          input: ({ context }) => ({ sceneName: context.currentScene.name }),
          src: 'initSceneManagerLogic',
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
        ADD_ENTITY: {
          actions: {
            params: ({ event }) => ({ entity: event.entity }),
            type: 'addEntity',
          },
        },
        REMOVE_ENTITY: {
          actions: {
            params: ({ event }) => ({ id: event.id }),
            type: 'removeEntity',
          },
        },
      },
    },
  },
});

type SceneManagerActorRef = ActorRefFrom<typeof sceneManagerMachine>;
type SceneManagerActorSnapshot = SnapshotFrom<typeof sceneManagerMachine>;

export { sceneManagerMachine };

export type { SceneManagerActorRef, SceneManagerActorSnapshot };

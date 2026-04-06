import {
  type ActorRefFrom,
  type SnapshotFrom,
  assign,
  emit,
  sendTo,
  setup,
} from 'xstate';

import type { ToastType } from '../../../../types.js';
import { getToastDuration } from '../../../../utils/get-toast-duration.js';

import { waitForDurationLogic } from './actors/wait-for-duration.actor.js';
import { waitForNextTickLogic } from './actors/wait-for-next-tick.actor.js';
import { waitForRemoveDelayLogic } from './actors/wait-for-remove-delay.actor.js';
import type {
  ToastActorContext,
  ToastActorEmittedEvent,
  ToastActorEmittedStatusEvent,
  ToastActorInput,
  ToastActorTag,
  ToastEvent,
  UpdateEvent,
} from './types.js';

const toastMachine = setup({
  types: {
    context: {} as ToastActorContext,
    emitted: {} as ToastActorEmittedEvent,
    events: {} as ToastEvent,
    input: {} as ToastActorInput,
    tags: {} as ToastActorTag,
  },
  actions: {
    emitEvent: emit(
      (_, { status }: { status: ToastActorEmittedStatusEvent['status'] }) => ({
        type: 'status',
        status,
      })
    ),
    removeFromParent: sendTo(
      ({ context }) => context.parentActor,
      ({ context, self }) => ({
        placement: context.placement,
        id: self.id,
        type: 'REMOVE_CHILD',
      })
    ),
    setCloseTimer: assign({
      closeTimerStartTime: () => Date.now(),
    }),
    setProgress: assign({
      progress: (_, { progress }: { progress: number }) => progress,
    }),
    syncRemainingTime: assign(({ context }) => {
      const closeTimerStartTime = context.closeTimerStartTime;
      const elapsedTime = Date.now() - closeTimerStartTime;
      const prev = context.remainingTime;

      return {
        remainingTime: prev - elapsedTime,
      };
    }),
    update: assign(({ context }, { options }: Pick<UpdateEvent, 'options'>) => {
      const {
        closable = context.closable,
        description = context.description,
        duration = context.duration,
        removeDelay = context.removeDelay,
        title = context.title,
        type = context.type,
      } = options;

      return {
        closable,
        closeTimerStartTime: Date.now(),
        description,
        duration,
        progress: 0,
        remainingTime: getToastDuration(duration, type),
        removeDelay,
        title,
        type,
      };
    }),
  },
  actors: {
    waitForDuration: waitForDurationLogic,
    waitForNextTick: waitForNextTickLogic,
    waitForRemoveDelay: waitForRemoveDelayLogic,
  },
  guards: {
    isNotLoadingType: ({ context }) => context.type !== 'loading',
    shouldPersist: (
      _,
      { duration, type }: { duration: number; type: ToastType }
    ) => type === 'loading' || duration === Infinity,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcD2BDWyDEAlAogLIDyAavgNoAMAuoqAA6qwCWyLqAdvSAB6IAWAEwAaEAE9EARgDsADgB0ANgFSAnAGY1AnTKVUArAIC+xsWkzIFANxasARgBsw2AArEAkgDkAKvlwA+vi+-tR0SCBMrOxcPPwIegIKAhpSBmpKemoZUkpikggaRQoywkICBgZCUqmlpuYYWDZ2LE4u7t5+gQAy+ACC5GE8UWwc3BHxegYKRUqVVFJy2nJUMvmIQhqKApkCMkVCBhrVSkr1IBZNtg7O2ACqrgAifX5DESMx46DxUrLrCAI1Ioimp5PJTlQlKkDOdLlZrq1bg9nq8pOFGMxRrEJtI-hJEKdpgYZEIlnIUjtThpYY14S02goWBBbo8PABlQjstlvDHRMZxaRKQ7JORCUG5KQLHYaf7aGQKTTCJRqKhqI7CGmWZo3MCM5ntPp3NmUWjDTGfAUIX5qIQKKjHASi1ZHKRCPL4hIaJQlAyLPQyX1ValmC607WI3VM248yLm-k4q3qW328pOgOpN3-OTHO1umT58kquS-TVXenOBQMMAAJ1YWDw+DZd0IJvRsb52O+uJtdodaZdmY9KikyXzkoqlSqdRDcPDDKrtbsOFZHK5MY+8a7Vqh00dYpkEqlUP+pzUdoMkPJMlWwg0MlLdJ1CgArgwIOh2JwoNg2QAJYgAOrrnGnZ8IgB7yoYQirGkBgqDIahSCeciKPuOjFtmcgwucnCoBAcA8HCZodl8YEIAAtO6BSUQ+CgQHYAC2disF+xFYqRPwBmeJI1KqNpKNaVEEhUChYTaaqyBoVAobRz6cAxqBycgkBsRaCa5FJIr7oeUjSv8aRJLp5JGHsyr5lCtEIm0qmbmRyr-KoI4LEocjyCqVDlMSwYNFqVkVlGYA2aB8Sit6JJUPauTXhkxInnM56QqUILyKKlnlrqC51sgQUcdIlIKNBcGilsF7mXFZ7VHIKinHoKxqGlT6vu+n5QDllp3raAZVLpXpCKS6hxdMhiJSkWgpUIpimEAA */
  id: 'toast',

  context: ({ input }) => ({
    closable: input.closable ?? true,
    closeTimerStartTime: Date.now(),
    createdAt: Date.now(),
    description: input.description,
    duration: input.duration ?? getToastDuration(input.duration, input.type),
    id: input.id,
    parentActor: input.parentActor,
    placement: input.placement,
    progress: 0,
    remainingTime: getToastDuration(input.duration, input.type),
    removeDelay: input.removeDelay,
    title: input.title,
    type: input.type,
  }),

  entry: [{ params: { status: 'visible' }, type: 'emitEvent' }],
  exit: 'removeFromParent',
  initial: 'visible',

  on: {
    REMOVE: '.removed',
  },

  states: {
    dismissing: {
      entry: {
        params: { status: 'dismissing' },
        type: 'emitEvent',
      },

      invoke: {
        id: 'waitForRemoveDelay',
        input: ({ context }) => ({ removeDelay: context.removeDelay }),
        src: 'waitForRemoveDelay',
      },
    },

    removed: {
      type: 'final',
      entry: {
        params: { status: 'removed' },
        type: 'emitEvent',
      },
    },

    visible: {
      initial: 'idle',

      on: {
        UPDATE: [
          {
            actions: {
              params: ({ event }) => ({ options: event.options }),
              type: 'update',
            },
            guard: {
              params: ({ context, event }) => ({
                duration: event.options.duration ?? context.duration,
                type: event.options.type ?? context.type,
              }),
              type: 'shouldPersist',
            },
            target: '.persist',
          },
          {
            actions: {
              params: ({ event }) => ({ options: event.options }),
              type: 'update',
            },
            target: '.updating',
          },
        ],
      },

      states: {
        idle: {
          invoke: {
            id: 'waitForDuration',
            input: ({ context }) => ({
              duration: context.duration,
              remainingTime: context.remainingTime,
            }),
            src: 'waitForDuration',
          },

          tags: ['visible'],

          on: {
            DISMISS: {
              target: '#toast.dismissing',
            },

            PAUSE: {
              actions: 'syncRemainingTime',
              target: 'persist',
            },

            PROGRESS: {
              actions: {
                params: ({ event }) => ({ progress: event.progress }),
                type: 'setProgress',
              },
            },
          },

          always: {
            guard: {
              params: ({ context }) => ({
                duration: context.duration,
                type: context.type,
              }),
              type: 'shouldPersist',
            },
            target: 'persist',
          },
        },

        persist: {
          tags: ['visible', 'paused'],
          on: {
            RESUME: {
              actions: 'setCloseTimer',
              guard: 'isNotLoadingType',
              target: 'idle',
            },
            DISMISS: {
              target: '#toast.dismissing',
            },
          },
        },

        updating: {
          invoke: {
            id: 'waitForNextTick',
            src: 'waitForNextTick',
          },
          on: {
            SHOW: { target: 'idle' },
          },
          tags: ['visible', 'updating'],
        },
      },
    },
  },
});

export { toastMachine };

type ToastActorRef = ActorRefFrom<typeof toastMachine>;
type ToastActorSnapshot = SnapshotFrom<typeof toastMachine>;

export type { ToastActorRef, ToastActorSnapshot };

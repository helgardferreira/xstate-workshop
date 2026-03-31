import {
  type ActorRefFrom,
  type SnapshotFrom,
  assign,
  enqueueActions,
  setup,
} from 'xstate';

import { documentVisibilityLogic } from './actors/document-visibility.actor.js';
import { toastCountLogic } from './actors/toast-count.actor.js';
import { toastGroupMachine } from './actors/toast-group/toast-group.machine.js';
import type {
  CreateEvent as CreateToastEvent,
  ToastGroupActorEvent,
} from './actors/toast-group/types.js';
import {
  type CreateEvent,
  ToastPlacement,
  type ToastsActorContext,
  type ToastsActorEvent,
  type ToastsActorInput,
} from './types.js';

const toastsMachine = setup({
  types: {
    context: {} as ToastsActorContext,
    events: {} as ToastsActorEvent,
    input: {} as ToastsActorInput,
  },
  actions: {
    dispose: enqueueActions(({ context, enqueue }) =>
      Object.values(context.toastGroups).forEach((toastGroup) => {
        enqueue.sendTo(toastGroup, { type: 'REMOVE_ALL' });
      })
    ),
    sendToAllChildToastGroups: enqueueActions(
      (
        { context, enqueue },
        { event }: { event: Exclude<ToastGroupActorEvent, CreateToastEvent> }
      ) =>
        Object.values(context.toastGroups).forEach((toastGroup) => {
          enqueue.sendTo(toastGroup, event);
        })
    ),
    spawnToastInToastGroup: enqueueActions(
      ({ context, enqueue }, { options }: Omit<CreateEvent, 'type'>) => {
        const {
          duration: defaultDuration,
          max,
          placement: defaultPlacement,
          removeDelay: defaultRemoveDelay,
          toastCount,
        } = context;

        const {
          closable,
          description,
          duration = defaultDuration,
          id,
          placement = defaultPlacement,
          removeDelay = defaultRemoveDelay,
          title,
          type,
        } = options;

        const toastGroup = context.toastGroups[placement];

        if (max && toastCount >= max) return;

        if (toastGroup && toastGroup.src === 'toastGroupActor') {
          enqueue.sendTo(toastGroup, {
            type: 'CREATE',
            options: {
              closable,
              description,
              duration,
              id,
              placement,
              removeDelay,
              title,
              type,
            },
          });
        }
      }
    ),
    updateToastCount: assign((_, { count }: { count: number }) => ({
      toastCount: count,
    })),
  },
  actors: {
    documentVisibility: documentVisibilityLogic,
    toastCountActor: toastCountLogic,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toastGroupActor: toastGroupMachine as any,
  },
  guards: {
    shouldPauseOnPageIdle: ({ context }) => context.pauseOnPageIdle,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcD2BDWzYDp0GNkBLANzAGIBhAJQFEBBAFVoG0AGAXUVAAdVYixVADtuIAB6IAjACYAzDgAcATgDs6gCxsZGgGwblUqQBoQAT2ky1ODRoCsc21Lsapy3TIC+n02kzY8QlIKABEASQBlAFlIiIB9egAZRPYuJBA+ASFRdMkEI1UcOVkDe3s5RX1dUwt8mW0cKVU2OztVXVU5VTs1b18MLFwCYjJycOjY1LFMwSIRMTyCopLlModKvRrpKTZdJWU7RTa2VXr7KT6QP0HAkdDIgAUAeQjWTmn+WfncxA0ZQrYcmU2kUbCkuiBqy2+S6GiU-wMikcuh6qku1wCw2CYyelAAqlFaAA5RhxAASYRCIWJU3SM2yC1+MmhOyMOA8Rjs+macjku3RA0xQVGIVxBOJpIAapEwgAhRJvNK8T4Mn4IDQKXbtZq6ZRdHmqaGGPbI+yHXSVcEC-xDYUUB70PGvBLJWnKrJzHKgRZNZY6VYudZVaGKGRSHAncG6iqKJqra03LGjB1OxUfD3fb3bQrFf1rCrB8yIU52HCqdzuRSqDb6RQJoV3ch0KJPSW0F0pd50lWexn5X250qBgubIsICFsHB2GRh0N83QgjT122N5uttPdjNeiTZv1D8o16EOUs6VSuLka7qVZe3bF0CLijtujI9zM7-s5lb5w9jjXKHBqDIugWuW7itF0N5JhQ97is+9K9mqSyDgGB6FrUjhwrq5ZhgcrTTs4kF2uQjBPPQESkpQTx4iScGvtuiwauyyhAVWMigpUbCKNC-o2PITR2EYUi2CohGNniDwhEwG7ul89G7sh376MoLIuI0GiKE4GjlvYHR2N4PggMIqAQHAYgYvAm6yX2AC01RjrZonBOmVmIUcNh2Gw6nAgcRhsXZtRSEChSnGwnlaa0hgnDeEBELAmSQM5qpZggrRwmGcj4RlnFAnILJAnsWm8i0cjAVyob6Z4QA */
  id: 'toasts',

  context: ({ input, self, spawn }) => ({
    duration: input.duration,
    max: input.max,
    pauseOnPageIdle: input.pauseOnPageIdle ?? true,
    placement: input.placement ?? ToastPlacement.BottomEnd,
    removeDelay: input.removeDelay ?? 0,
    toastCount: 0,
    toastGroups: {
      [ToastPlacement.BottomEnd]: spawn('toastGroupActor', {
        id: ToastPlacement.BottomEnd,
        input: {
          parentActor: self,
          placement: ToastPlacement.BottomEnd,
        },
      }),
      [ToastPlacement.BottomStart]: spawn('toastGroupActor', {
        id: ToastPlacement.BottomStart,
        input: {
          parentActor: self,
          placement: ToastPlacement.BottomStart,
        },
      }),
      [ToastPlacement.Bottom]: spawn('toastGroupActor', {
        id: ToastPlacement.Bottom,
        input: {
          parentActor: self,
          placement: ToastPlacement.Bottom,
        },
      }),
      [ToastPlacement.TopEnd]: spawn('toastGroupActor', {
        id: ToastPlacement.TopEnd,
        input: {
          parentActor: self,
          placement: ToastPlacement.TopEnd,
        },
      }),
      [ToastPlacement.TopStart]: spawn('toastGroupActor', {
        id: ToastPlacement.TopStart,
        input: {
          parentActor: self,
          placement: ToastPlacement.TopStart,
        },
      }),
      [ToastPlacement.Top]: spawn('toastGroupActor', {
        id: ToastPlacement.Top,
        input: {
          parentActor: self,
          placement: ToastPlacement.Top,
        },
      }),
    },
  }),

  initial: 'active',

  invoke: [
    {
      id: 'documentVisibility',
      src: 'documentVisibility',
    },
    {
      id: 'toastCount',
      input: ({ context }) => ({ toastGroups: context.toastGroups }),
      src: 'toastCountActor',
    },
  ],

  states: {
    active: {
      on: {
        CREATE: {
          actions: {
            params: ({ event }) => ({ options: event.options }),
            type: 'spawnToastInToastGroup',
          },
        },

        DISMISS_ALL: {
          actions: {
            params: ({ event }) => ({ event }),
            type: 'sendToAllChildToastGroups',
          },
        },

        DISMISS: {
          actions: {
            params: ({ event }) => ({ event }),
            type: 'sendToAllChildToastGroups',
          },
        },

        DISPOSE: {
          target: 'disposed',
          actions: 'dispose',
        },

        DOCUMENT_HIDDEN: {
          actions: {
            params: { event: { type: 'PAUSE_ALL' } },
            type: 'sendToAllChildToastGroups',
          },

          guard: 'shouldPauseOnPageIdle',
        },

        DOCUMENT_VISIBLE: {
          actions: {
            params: { event: { type: 'RESUME_ALL' } },
            type: 'sendToAllChildToastGroups',
          },

          guard: 'shouldPauseOnPageIdle',
        },

        PAUSE_ALL: {
          actions: {
            params: ({ event }) => ({ event }),
            type: 'sendToAllChildToastGroups',
          },
        },

        PAUSE: {
          actions: {
            params: ({ event }) => ({ event }),
            type: 'sendToAllChildToastGroups',
          },
        },

        REMOVE_ALL: {
          actions: {
            params: ({ event }) => ({ event }),
            type: 'sendToAllChildToastGroups',
          },
        },

        REMOVE: {
          actions: {
            params: ({ event }) => ({ event }),
            type: 'sendToAllChildToastGroups',
          },
        },

        RESUME_ALL: {
          actions: {
            params: ({ event }) => ({ event }),
            type: 'sendToAllChildToastGroups',
          },
        },

        RESUME: {
          actions: {
            params: ({ event }) => ({ event }),
            type: 'sendToAllChildToastGroups',
          },
        },

        TOAST_COUNT: {
          actions: {
            params: ({ event }) => ({ count: event.count }),
            type: 'updateToastCount',
          },
        },

        UPDATE: {
          actions: {
            params: ({ event }) => ({ event }),
            type: 'sendToAllChildToastGroups',
          },
        },
      },
    },

    disposed: {
      type: 'final',
    },
  },
});

export { toastsMachine };

type ToastsActorRef = ActorRefFrom<typeof toastsMachine>;
type ToastsActorSnapshot = SnapshotFrom<typeof toastsMachine>;

export type { ToastsActorRef, ToastsActorSnapshot };

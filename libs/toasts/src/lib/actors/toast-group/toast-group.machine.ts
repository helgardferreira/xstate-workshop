import {
  type ActorRefFrom,
  type SnapshotFrom,
  enqueueActions,
  setup,
} from 'xstate';

import {
  type ToastActorRef,
  toastMachine,
} from './actors/toast/toast.machine.js';
import type { ToastEvent } from './actors/toast/types.js';
import type {
  CreateEvent,
  RemoveChildEvent,
  ToastGroupActorContext,
  ToastGroupActorEvent,
  ToastGroupActorInput,
} from './types.js';

const toastGroupMachine = setup({
  types: {
    context: {} as ToastGroupActorContext,
    events: {} as ToastGroupActorEvent,
    input: {} as ToastGroupActorInput,
  },
  actors: {
    toastActor: toastMachine,
  },
  actions: {
    removeChildToast: enqueueActions(
      (
        { context: { toasts }, enqueue },
        { id }: Omit<RemoveChildEvent, 'type'>
      ) => {
        enqueue.stopChild(id);
        enqueue.assign({ toasts: toasts.filter((toast) => toast.id !== id) });
      }
    ),
    sendToChildToast: enqueueActions(
      ({ enqueue, self }, { event, id }: { event: ToastEvent; id: string }) => {
        const child = self.getSnapshot().children[id] as
          | ToastActorRef
          | undefined;

        if (child && child.src === 'toastActor') enqueue.sendTo(child, event);
      }
    ),
    sendToAllChildToasts: enqueueActions(
      ({ enqueue, self }, { event }: { event: ToastEvent }) => {
        const children = self.getSnapshot().children as Record<
          string,
          ToastActorRef | undefined
        >;

        for (const child of Object.values(children)) {
          if (
            child &&
            child.src === 'toastActor' &&
            child.getSnapshot().status === 'active'
          )
            enqueue.sendTo(child, event);
        }
      }
    ),
    spawnChildToast: enqueueActions(
      (
        { enqueue, self },
        { options, paused }: Omit<CreateEvent, 'type'> & { paused: boolean }
      ) => {
        const {
          closable,
          description,
          duration,
          id,
          placement,
          removeDelay,
          title,
          type,
        } = options;

        for (const child of Object.values(self.getSnapshot().children)) {
          if (child && child.src === 'toastActor') {
            if (child.id === id) return;
          }
        }

        enqueue.assign({
          toasts: ({ context, spawn }) =>
            context.toasts.concat(
              spawn('toastActor', {
                id,
                input: {
                  closable,
                  description,
                  duration,
                  id,
                  parentActor: self,
                  placement,
                  removeDelay,
                  title,
                  type,
                },
              })
            ),
        });

        if (paused) {
          enqueue.sendTo(id, { type: 'PAUSE' });
        }
      }
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcD2BDWyDiAnVArgA4DEASgKIDKAqgLIUD6AggDKsDaADALqKhFUsAJbJhqAHb8QAD0QBOAOwAaEAE9EAVk2KAdADZ5+-YoBMp-afkAWQwF87qtJhz5iJAAoB5AJIA5ABUKMkZWCmYANQpuPiQQQRExSWk5BCVVDQR9TVNdJQBGa1srQy58xQcnDCw8QlJKWgYY6QTRcSk41Pz5eV0AZj7rLlN84x0bEwzEPvk+3S55AA4e8q5NIqM+ypBnGrd6ijovKMYAYQAJH1YAEWa41qSO0C6e3Xy+9f0uPsV8zXl-ip1IgrHpFqZrKZwTYuNZFP9trtXHVyIdjtFeC0hG1kp1EN1egMhiMxooJkDMqZhrp1gDrIsuCZ5Atsojqsj3JQjic2JxMfdsY8UgoKYhFPTdBD9PlFvlRhNFmyXLV3NcfFQ6OqqCx2HcBIL2sK0qKEItrHMclxFopvpofnDNEq9ijvP4giEKIFgnr4gbcc8RVMEPlvtZ5jbrDLIaMdKYnRzSB5mDQqExeT6Hoa8cag7NFroyZp9EU+tabRD4yrSGqNVqM36nrJ8a8icNRtkybYTSG9KZxYpxd8ZutFltHDt2VXPMnU-XElmA8GW4M26TyUH8nHx0iq7p0ABjMQANzAJFOlGYQTnOMbqT6jLeij6fZmcrWFn0QZMXF0i30Mz6P4zSKSFK32XQiHQAhYEgM8Lyvfl9Xnf0mwQe99EfZ8n3kN8cmMXMiwMRZZRsGxIVMBFt0nfYSBoDxrkvDFYiQm8jVMe8CwZf8bHMPtRj6DcZUJaxND+JYRk3UYHHHCRUAgOBpB3fYsWQ29EGseQgzhH8fh+dZnytCFrDAuo90PYQTxU1js0GMMrHBIshmGdYnyDAd8jeUsbSLGUZhwkziAgqCYIgKyhRsmYaXMa0FllCw-g3NYMKMEplkUWUGQqaSgA */
  id: 'toastGroup',

  context: ({ input }) => ({
    parentActor: input.parentActor,
    placement: input.placement,
    toasts: [],
  }),

  initial: 'active',

  states: {
    active: {
      on: {
        CREATE: {
          actions: {
            params: ({ event }) => ({ options: event.options, paused: false }),
            type: 'spawnChildToast',
          },
        },
      },
    },

    paused: {
      on: {
        CREATE: {
          actions: {
            params: ({ event }) => ({ options: event.options, paused: true }),
            type: 'spawnChildToast',
          },
        },
      },
    },
  },

  on: {
    RESUME_ALL: {
      actions: {
        params: { event: { type: 'RESUME' } },
        type: 'sendToAllChildToasts',
      },

      target: '.active',
    },

    POINTER_LEAVE: {
      actions: {
        params: { event: { type: 'RESUME' } },
        type: 'sendToAllChildToasts',
      },

      target: '.active',
    },

    RESUME: {
      actions: {
        params: ({ event }) => ({ event, id: event.id }),
        type: 'sendToChildToast',
      },
    },

    REMOVE_CHILD: {
      actions: {
        params: ({ event }) => ({ id: event.id }),
        type: 'removeChildToast',
      },
    },

    REMOVE: {
      actions: {
        params: ({ event }) => ({ event, id: event.id }),
        type: 'sendToChildToast',
      },
    },

    REMOVE_ALL: {
      actions: {
        params: { event: { type: 'REMOVE' } },
        type: 'sendToAllChildToasts',
      },

      target: '.active',
    },

    DISMISS_ALL: {
      actions: {
        params: { event: { type: 'DISMISS' } },
        type: 'sendToAllChildToasts',
      },

      target: '.active',
    },

    POINTER_ENTER: {
      actions: {
        params: { event: { type: 'PAUSE' } },
        type: 'sendToAllChildToasts',
      },

      target: '.paused',
    },

    PAUSE_ALL: {
      actions: {
        params: { event: { type: 'PAUSE' } },
        type: 'sendToAllChildToasts',
      },

      target: '.paused',
    },

    DISMISS: {
      actions: {
        params: ({ event }) => ({ event, id: event.id }),
        type: 'sendToChildToast',
      },
    },

    PAUSE: {
      actions: {
        params: ({ event }) => ({ event, id: event.id }),
        type: 'sendToChildToast',
      },
    },

    UPDATE: {
      actions: {
        params: ({ event }) => ({ event, id: event.id }),
        type: 'sendToChildToast',
      },
    },
  },
});

export { toastGroupMachine };

type ToastGroupActorRef = ActorRefFrom<typeof toastGroupMachine>;
type ToastGroupActorSnapshot = SnapshotFrom<typeof toastGroupMachine>;

export type { ToastGroupActorRef, ToastGroupActorSnapshot };

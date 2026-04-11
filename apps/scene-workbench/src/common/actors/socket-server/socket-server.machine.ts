import { Logger } from '@nestjs/common';
import type { WebSocket } from 'ws';
import {
  type ActorRefFrom,
  type SnapshotFrom,
  assign,
  enqueueActions,
  setup,
} from 'xstate';

import { heartbeatIntervalLogic } from './actors/heartbeat-interval.actor';
import { serverLifeCycleLogic } from './actors/server-life-cycle.actor';
import { socketClientMachine } from './actors/socket-client/socket-client.machine';
import type {
  BroadcastEvent,
  InitEvent,
  SocketServerActorContext,
  SocketServerActorEvent,
} from './types';

const socketServerMachine = setup({
  types: {
    context: {} as SocketServerActorContext,
    events: {} as SocketServerActorEvent,
  },
  actions: {
    addClient: assign(
      ({ context, self, spawn }, { client }: { client: WebSocket }) => {
        if (client.clientId !== undefined) return {};

        const clientId = crypto.randomUUID();
        client.clientId = clientId;

        const clients = context.clients.concat(
          spawn('socketClientActor', {
            id: clientId,
            input: { client, parentActor: self },
          })
        );

        return { clients };
      }
    ),
    broadcast: enqueueActions(
      ({ context, enqueue }, { data, options }: Omit<BroadcastEvent, 'type'>) =>
        context.clients.forEach((client) =>
          enqueue.sendTo(client, { type: 'SEND_MESSAGE', data, options })
        )
    ),
    heartbeat: enqueueActions(({ context, enqueue }) =>
      context.clients.forEach((client) =>
        enqueue.sendTo(client, { type: 'PING' })
      )
    ),
    init: assign((_, { server }: Pick<InitEvent, 'server'>) => ({ server })),
    logError: (_, { error }: { error: Error }) => Logger.error(error),
    removeClient: enqueueActions(
      ({ context, enqueue }, { id }: { id: string }) => {
        enqueue.stopChild(id);
        enqueue.assign({
          clients: context.clients.filter((client) => client.id !== id),
        });
      }
    ),
  },
  actors: {
    heartbeatInterval: heartbeatIntervalLogic,
    serverLifeCycle: serverLifeCycleLogic,
    socketClientActor: socketClientMachine,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwPYGMDWYAuBaWYATgG5EDEAogEpUDyVA2gAwC6ioADirAJbY8oAduxAAPRAGYAnAHYAdFICMigCwA2JqoBMMzQA4ANCACeiRVoC+Fo6kw58RUoTkBDNP1JkAggBEfAfQBhABkASQoAOQAVZjYkEC5efiERcQQJCS05FRktJgkZCTU9LQBWFS0jUwR1eQrFPUUpKT1SiRUVUqsbdCw8AhIiV3ceTwAhOl9ArwBlGNYRRL4BYXi0jMU5GTVStTVVZVKytSrJXLlVXT0mJhaitW3ukFs+h0HnNw8wMh9QmYAFWgzCixRbcZYpNaIUqtBRSW55LRqLR5KQqU4IDQSBQqRQFUptfIwrrWZ69ewDJzDL5kAASFC8VCiYwZ8zinHByVWoHW7Tk+XMMhkKgyQoJEgxOjUcj0uQKege5lKaKeLwpjiGn1G3yoFAAsrQAGoUIJhSJssFJFapSSKaW5HZ6PQqJjKl2dDENTbK7YSWXOrSNGSq8n9DXOHgQAA231CEVCFviSy5NoQeKYckdrRFUmRTGdhhM0P2MoktyYMnKRzReispMEKAgcBEarD70tEO5YkQuEUGLRch0OUDehaHQyahDdjbVK1pA7KahCBRejkMLyBUrZUaEqLCF28jUuYJLTlKIkU9elKGEB4sESkAX1qXMjxFx2FUDbS0dpOe40WQKmUMhARWuJSJe6rvHIkYxk+kI8ogOQYjCKhbFo7RHCUlZCpOdZAA */
  id: 'socket-server',

  context: {
    clients: [],
    server: undefined,
  },

  initial: 'idle',

  on: {
    ERROR: {
      actions: {
        params: ({ event }) => ({ error: event.error }),
        type: 'logError',
      },
    },
  },

  states: {
    active: {
      invoke: [
        {
          id: 'heartbeatInterval',
          input: ({ context }) => ({ server: context.server }),
          src: 'heartbeatInterval',
        },
        {
          id: 'serverLifeCycle',
          input: ({ context }) => ({ server: context.server }),
          src: 'serverLifeCycle',
        },
      ],

      on: {
        ADD_CLIENT: {
          actions: {
            params: ({ event }) => ({ client: event.client }),
            type: 'addClient',
          },
        },
        BROADCAST: {
          actions: {
            params: ({ event }) => ({
              data: event.data,
              options: event.options,
            }),
            type: 'broadcast',
          },
        },
        DISPOSE: { target: 'disposed' },
        HEARTBEAT: { actions: 'heartbeat' },
        REMOVE_CLIENT: {
          actions: {
            params: ({ event }) => ({ id: event.id }),
            type: 'removeClient',
          },
        },
      },
    },

    disposed: {
      type: 'final',
    },

    idle: {
      on: {
        INIT: {
          actions: {
            params: ({ event }) => ({ server: event.server }),
            type: 'init',
          },
          target: 'active',
        },
      },
    },
  },
});

type SocketServerActorRef = ActorRefFrom<typeof socketServerMachine>;
type SocketServerActorSnapshot = SnapshotFrom<typeof socketServerMachine>;

export { socketServerMachine };

export type { SocketServerActorRef, SocketServerActorSnapshot };

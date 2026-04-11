import { Logger } from '@nestjs/common';
import { CLOSED, CLOSING, OPEN } from 'ws';
import {
  type ActorRefFrom,
  type SnapshotFrom,
  assign,
  enqueueActions,
  sendTo,
  setup,
} from 'xstate';

import { ServerMessageSchema } from '@xstate-workshop/scene-protocol';

import { messageListenerLogic } from './actors/message-listener.actor';
import { pongListenerLogic } from './actors/pong-listener.actor';
import type {
  CloseEvent,
  MessageEvent,
  ReadyState,
  SendErrorEvent,
  SendMessageEvent,
  SocketClientActorContext,
  SocketClientActorEvent,
  SocketClientActorInput,
} from './types';

const socketClientMachine = setup({
  types: {
    context: {} as SocketClientActorContext,
    events: {} as SocketClientActorEvent,
    input: {} as SocketClientActorInput,
  },
  actions: {
    close: (
      { context },
      { code, reason }: Pick<CloseEvent, 'code' | 'reason'>
    ) => context.client.close(code, reason),
    // TODO: implement this
    handleMessage: enqueueActions(
      ({ enqueue: _ }, { message }: Pick<MessageEvent, 'message'>) => {
        if (message.type === 'UPDATE_SCENE') {
          // TODO: implement this
          Logger.log('UPDATE_SCENE message received', message);
          /*
          enqueue.sendTo(({ context }) => context.parentActor, {
            type: 'UPDATE_SCENE',
            ...
          });
          */
        }
      }
    ),
    ping: enqueueActions(({ context, enqueue }) => {
      if (context.pulse === false) {
        enqueue.raise({ type: 'TERMINATE' });
      } else {
        enqueue.assign({ pulse: false });
        context.client.ping();
      }
    }),
    pong: assign({ pulse: true }),
    removeFromParent: sendTo(
      ({ context }) => context.parentActor,
      ({ self }) => ({ type: 'REMOVE_CLIENT', id: self.id })
    ),
    sendError: ({ context }, { error }: Pick<SendErrorEvent, 'error'>) => {
      const response = ServerMessageSchema.encode({
        error,
        meta: { ts: new Date() },
        type: 'ERROR',
      });
      context.client.send(JSON.stringify(response));
    },
    sendMessage: (
      { context },
      { data, options }: Pick<SendMessageEvent, 'data' | 'options'>
    ) =>
      options ? context.client.send(data, options) : context.client.send(data),
    terminate: ({ context }) => context.client.terminate(),
  },
  actors: {
    messageListener: messageListenerLogic,
    pongListener: pongListenerLogic,
  },
  guards: {
    isClosed: (_, { readyState }: { readyState: ReadyState }) =>
      readyState === CLOSED,
    isClosing: (_, { readyState }: { readyState: ReadyState }) =>
      readyState === CLOSING,
    isOpen: (_, { readyState }: { readyState: ReadyState }) =>
      readyState === OPEN,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwPYGMDWYAuBaNANgJZgB22AdISrEaVAMQDCAMgPIDKAogCIDaABgC6iUAAcaRbERSlRIAB6IAHAFYAzBXUA2AOwAmAJwAWAIwCBp-doA0IAJ6JVuzceOrThy-oPrDugF8Au1RMHHxiMkpqWnoGABUuACUAWQBJADkAQUTBESQQCVppWXklBDVNHQMTc29bB0RtfU0fAV1jXW11AwFuoJD0LDxCEnIqWVIwNGk41k4uPPkiqRk5AvL9HwpdVVV9U2U+w0N9Y2VdO0cK5W0KZX0BZXddV9fTAZBQ4Yix6MnprNGPNuPxhMtJCV1qBNttdvtDsdTudLo0EIYHhQBIY9rpTuoPAJjJ9vuFRlEJqQpjM6Iw2AAFLgZXhLAorKFlRBbXQ7PYHI7aE5nC5XRCvQwUQnqR4HTrNQwkoZkyLjNAAmlxRKpTI5RbgtmQtachDc3kIgVClGihDmdSmCinczGR6qZReAT6RVhEYq-5UwG0his8SG0obLlwvmIwXIkVolzGCieCzGbTOx7qdRen7k1XqoFB0z5EPFI3hk2R81I4Wo66mKw8zzOeGmZqZz3BL5Kn1-SnUgt8fTFwqh6GKCM8+H86tWtGIpNuVTtDotese7PK3soMRkZjsbjBkelsMwpwYyWqbQCO0aInOVTW7St+57B7NR56XYbnsU7e7kEsvqJarCe44IKo557FeN7qHeuzWrobpJtKHSGNob5mB2gzer8v47qQDApFwHAcFkADierDuyZanggZh3M8PRPj40HPMYj54hQxjXleVjNA8ugfJ2pI-uMf4EfSmRkYe1GgeUbgSgYiEPB4+iqG4tZOM8Sb6MotyIQI6m1N+uFifhDD0mwGTSUBR4gWO8mdBQV4XJejrnDi7FoucygvmY6jGAFyitkJ2E5r6FDiQw3AZDwAD6yRJGwSQyaOxrppKXSHA8DxeNoDTXH4mjOCYFhuk8Pj+CZuaUFFMXxURJHkZRELHg5iBmPahzNKYAU4h4xg4taRi+bBqZ6IFfXnMSwndqZtXmVq6TZLktmye14GQZe16mLeLwPt5sFaO0wW6a8elfp8pAoBAcDyCJ82tfZxq4AViC4KoDonN9P3fYF1URTEkBPRy5bmAc9ywWoljBS4pgIXpWIaCY6n8YhWFdjhNVUAQkj0CDNFgR0PKWDiFzMX0amPn4OzTbpMa7MoAO9mq-oalABNyR1+jWvW5jOa8ziDYzWwzWFm54WQnMbe4iZPsc3GHIYnjPAhnF6MomadI8raWEEQRAA */
  id: 'socket-client',

  context: ({ input }) => ({
    client: input.client,
    parentActor: input.parentActor,
    pulse: true,
  }),

  exit: 'removeFromParent',

  invoke: [
    {
      id: 'messageListener',
      input: ({ context }) => ({ client: context.client }),
      src: 'messageListener',
    },
    {
      id: 'pongListener',
      input: ({ context }) => ({ client: context.client }),
      src: 'pongListener',
    },
  ],

  initial: 'connecting',

  states: {
    closed: {
      type: 'final',
    },

    closing: {
      on: {
        CLOSED: { target: 'closed' },
        TERMINATE: {
          actions: 'terminate',
          target: 'closed',
        },
      },
    },

    connecting: {
      on: {
        CLOSE: {
          actions: {
            params: ({ event }) => ({ code: event.code, reason: event.reason }),
            type: 'close',
          },
          target: 'closing',
        },
        CLOSED: { target: 'closed' },
        OPENED: { target: 'open' },
        TERMINATE: {
          actions: 'terminate',
          target: 'closed',
        },
      },

      always: [
        {
          guard: {
            params: ({ context }) => ({
              readyState: context.client.readyState,
            }),
            type: 'isOpen',
          },
          target: 'open',
        },
        {
          guard: {
            params: ({ context }) => ({
              readyState: context.client.readyState,
            }),
            type: 'isClosed',
          },
          target: 'closed',
        },
        {
          guard: {
            params: ({ context }) => ({
              readyState: context.client.readyState,
            }),
            type: 'isClosing',
          },
          target: 'closing',
        },
      ],
    },

    open: {
      on: {
        CLOSE: {
          actions: {
            params: ({ event }) => ({ code: event.code, reason: event.reason }),
            type: 'close',
          },
          target: 'closing',
        },
        CLOSED: { target: 'closed' },
        MESSAGE: {
          actions: {
            params: ({ event }) => ({ message: event.message }),
            type: 'handleMessage',
          },
        },
        PING: { actions: 'ping' },
        PONG: { actions: 'pong' },
        SEND_ERROR: {
          actions: {
            params: ({ event }) => ({ error: event.error }),
            type: 'sendError',
          },
        },
        SEND_MESSAGE: {
          actions: {
            params: ({ event }) => ({
              data: event.data,
              options: event.options,
            }),
            type: 'sendMessage',
          },
        },
        TERMINATE: { actions: 'terminate', target: 'closed' },
      },
    },
  },
});

type SocketClientActorRef = ActorRefFrom<typeof socketClientMachine>;
type SocketClientActorSnapshot = SnapshotFrom<typeof socketClientMachine>;

export { socketClientMachine };

export type { SocketClientActorRef, SocketClientActorSnapshot };

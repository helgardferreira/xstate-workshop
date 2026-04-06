import { Observable } from 'rxjs';
import type { RawData, WebSocket } from 'ws';
import { type ActorRefFrom, fromEventObservable } from 'xstate';
import * as z from 'zod';

import type { EventObservableCreator } from '@xstate-workshop/actors';
import { ClientMessageSchema } from '@xstate-workshop/scene-protocol';

import type { SocketClientActorEvent } from '../types';

type MessageListenerInput = {
  client: WebSocket;
};

const fromMessageListener: EventObservableCreator<
  SocketClientActorEvent,
  MessageListenerInput
> = ({ input: { client } }) =>
  new Observable<SocketClientActorEvent>((subscriber) => {
    const handleMessage = (data: RawData, isBinary: boolean) => {
      if (isBinary) {
        return subscriber.next({
          type: 'SEND_ERROR',
          error: {
            code: 'VALIDATION',
            message: 'Binary client messages are not supported',
          },
        });
      }

      try {
        subscriber.next({
          type: 'MESSAGE',
          message: ClientMessageSchema.parse(JSON.parse(data.toString('utf8'))),
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          subscriber.next({
            type: 'SEND_ERROR',
            error: { code: 'VALIDATION', message: z.prettifyError(err) },
          });
        } else {
          subscriber.next({
            type: 'SEND_ERROR',
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Internal Server Error',
            },
          });
        }
      }
    };

    client.on('message', handleMessage);

    return () => client.off('message', handleMessage);
  });

export const messageListenerLogic = fromEventObservable(fromMessageListener);

export type MessageListenerActorRef = ActorRefFrom<typeof messageListenerLogic>;

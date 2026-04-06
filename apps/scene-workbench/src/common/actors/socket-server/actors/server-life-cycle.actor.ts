import type { IncomingMessage } from 'http';

import { EMPTY, Observable } from 'rxjs';
import type { WebSocket, WebSocketServer } from 'ws';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '@xstate-workshop/actors';

import type { AddClientEvent, DisposeEvent, ErrorEvent } from '../types';

type ServerLifeCycleInput = {
  server: WebSocketServer | undefined;
};

const fromServerEvent: EventObservableCreator<
  AddClientEvent | DisposeEvent | ErrorEvent,
  ServerLifeCycleInput
> = ({ input: { server } }) =>
  server === undefined
    ? EMPTY
    : new Observable<AddClientEvent | DisposeEvent | ErrorEvent>(
        (subscriber) => {
          const handleClose = () => subscriber.next({ type: 'DISPOSE' });
          const handleConnection = (
            client: WebSocket,
            request: IncomingMessage
          ) => subscriber.next({ type: 'ADD_CLIENT', client, request });
          const handleError = (error: Error) =>
            subscriber.next({ type: 'ERROR', error });

          server.on('close', handleClose);
          server.on('connection', handleConnection);
          server.on('error', handleError);

          /*
           * This is useful for updating headers before response is sent to
           * server (via mutating provided headers array).
           */
          /* server.on('headers', (headers, request) => ...); */

          return () => {
            server.off('close', handleClose);
            server.off('connection', handleConnection);
            server.off('error', handleError);
          };
        }
      );

export const serverLifeCycleLogic = fromEventObservable(fromServerEvent);

export type ServerLifeCycleActorRef = ActorRefFrom<typeof serverLifeCycleLogic>;

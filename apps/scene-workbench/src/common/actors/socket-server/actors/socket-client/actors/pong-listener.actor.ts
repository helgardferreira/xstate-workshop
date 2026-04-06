import { Observable } from 'rxjs';
import type { WebSocket } from 'ws';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '@xstate-workshop/actors';

import type { SocketClientActorEvent } from '../types';

type PongListenerInput = {
  client: WebSocket;
};

const fromPongListener: EventObservableCreator<
  SocketClientActorEvent,
  PongListenerInput
> = ({ input: { client } }) =>
  new Observable<SocketClientActorEvent>((subscriber) => {
    const handleClose = (code: number, reason: Buffer) =>
      subscriber.next({ type: 'CLOSED', code, reason });
    const handleOpen = () => subscriber.next({ type: 'OPENED' });
    const handlePongListener = () => subscriber.next({ type: 'PONG' });

    client.on('close', handleClose);
    client.on('open', handleOpen);
    client.on('pong', handlePongListener);

    return () => {
      client.off('close', handleClose);
      client.off('open', handleOpen);
      client.off('pong', handlePongListener);
    };
  });

export const pongListenerLogic = fromEventObservable(fromPongListener);

export type PongListenerActorRef = ActorRefFrom<typeof pongListenerLogic>;

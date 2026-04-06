import type { WebSocket } from 'ws';
import type { ActorRef, Snapshot } from 'xstate';

import type { ClientMessage, WsError } from '@xstate-workshop/scene-protocol';
import type { BufferLike } from '@xstate-workshop/utils';

type ParentActor = ActorRef<
  Snapshot<unknown>,
  { type: 'REMOVE_CLIENT'; id: string }
>;

type ReadyState =
  | typeof WebSocket.CONNECTING
  | typeof WebSocket.OPEN
  | typeof WebSocket.CLOSING
  | typeof WebSocket.CLOSED;

type SocketClientActorContext = {
  client: WebSocket;
  parentActor: ParentActor;
  pulse: boolean;
};

type SocketClientActorInput = {
  client: WebSocket;
  parentActor: ParentActor;
};

type CloseEvent = {
  type: 'CLOSE';
  code?: number;
  reason?: string | Buffer;
};

type ClosedEvent = {
  type: 'CLOSED';
  code: number;
  reason: Buffer;
};

type MessageEvent = {
  type: 'MESSAGE';
  message: ClientMessage;
};

type OpenedEvent = {
  type: 'OPENED';
};

type PingEvent = {
  type: 'PING';
};

type PongEvent = {
  type: 'PONG';
};

type SendErrorEvent = {
  type: 'SEND_ERROR';
  error: WsError;
};

type SendMessageEvent = {
  type: 'SEND_MESSAGE';
  data: BufferLike;
  options?: {
    mask?: boolean | undefined;
    binary?: boolean | undefined;
    compress?: boolean | undefined;
    fin?: boolean | undefined;
  };
};

type TerminateEvent = {
  type: 'TERMINATE';
};

type SocketClientActorEvent =
  | CloseEvent
  | ClosedEvent
  | MessageEvent
  | OpenedEvent
  | PingEvent
  | PongEvent
  | SendErrorEvent
  | SendMessageEvent
  | TerminateEvent;

export type {
  CloseEvent,
  ClosedEvent,
  MessageEvent,
  OpenedEvent,
  PingEvent,
  PongEvent,
  ReadyState,
  SendErrorEvent,
  SendMessageEvent,
  SocketClientActorContext,
  SocketClientActorEvent,
  SocketClientActorInput,
  TerminateEvent,
};

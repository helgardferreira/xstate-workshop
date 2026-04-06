import type { IncomingMessage } from 'http';

import type { WebSocket, WebSocketServer } from 'ws';

import type { BufferLike } from '@xstate-workshop/utils';

import type { SocketClientActorRef } from './actors/socket-client/socket-client.machine';

type SocketServerActorContext = {
  clients: SocketClientActorRef[];
  server: WebSocketServer | undefined;
};

type AddClientEvent = {
  type: 'ADD_CLIENT';
  client: WebSocket;
  request?: IncomingMessage;
};

type BroadcastEvent = {
  type: 'BROADCAST';
  data: BufferLike;
  options?: {
    binary?: boolean | undefined;
    compress?: boolean | undefined;
    fin?: boolean | undefined;
    mask?: boolean | undefined;
  };
};

type DisposeEvent = {
  type: 'DISPOSE';
};

type ErrorEvent = {
  type: 'ERROR';
  error: Error;
};

type HeartbeatEvent = {
  type: 'HEARTBEAT';
};

type InitEvent = {
  type: 'INIT';
  server: WebSocketServer;
};

type RemoveClientEvent = {
  type: 'REMOVE_CLIENT';
  id: string;
};

type SocketServerActorEvent =
  | AddClientEvent
  | BroadcastEvent
  | DisposeEvent
  | ErrorEvent
  | HeartbeatEvent
  | InitEvent
  | RemoveClientEvent;

export type {
  AddClientEvent,
  BroadcastEvent,
  DisposeEvent,
  ErrorEvent,
  HeartbeatEvent,
  InitEvent,
  RemoveClientEvent,
  SocketServerActorContext,
  SocketServerActorEvent,
};

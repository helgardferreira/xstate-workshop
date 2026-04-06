import {
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import type { WebSocket, WebSocketServer } from 'ws';
import { createActor } from 'xstate';

import {
  ServerMessage,
  ServerMessageSchema,
  ServerTodosCreated,
  ServerTodosDeleted,
  ServerTodosPatched,
} from '@xstate-workshop/scene-protocol';

import {
  type SocketServerActorRef,
  type SocketServerActorSnapshot,
  socketServerMachine,
} from '../common/actors';

@Injectable()
export class BroadcastService implements OnModuleInit, OnApplicationShutdown {
  private readonly socketServerActor: SocketServerActorRef =
    createActor(socketServerMachine);

  private get snapshot(): SocketServerActorSnapshot {
    return this.socketServerActor.getSnapshot();
  }

  addClient = (client: WebSocket) => {
    if (this.snapshot.status === 'done') return;

    this.socketServerActor.send({ type: 'ADD_CLIENT', client });
  };

  private broadcastMessage = (message: ServerMessage) => {
    if (this.snapshot.status === 'done') return;

    const { success, data } = ServerMessageSchema.safeEncode({
      ...message,
      meta: { ts: new Date() },
    });

    if (success) {
      this.socketServerActor.send({
        type: 'BROADCAST',
        data: JSON.stringify(data),
      });
    }
  };

  broadcast = {
    created: (message: Omit<ServerTodosCreated, 'type'>) => {
      this.broadcastMessage({ type: 'TODOS.CREATED', ...message });
    },
    deleted: (message: Omit<ServerTodosDeleted, 'type'>) => {
      this.broadcastMessage({ type: 'TODOS.DELETED', ...message });
    },
    patched: (message: Omit<ServerTodosPatched, 'type'>) => {
      this.broadcastMessage({ type: 'TODOS.PATCHED', ...message });
    },
  };

  init = (server: WebSocketServer) => {
    if (this.snapshot.status === 'done') return;

    this.socketServerActor.send({ type: 'INIT', server });
  };

  removeClient = (client: WebSocket) => {
    const { clientId } = client;

    if (this.snapshot.status === 'done' || clientId === undefined) return;

    this.socketServerActor.send({ type: 'REMOVE_CLIENT', id: clientId });
  };

  onModuleInit = () => {
    this.socketServerActor.start();
  };

  onApplicationShutdown = () => {
    this.socketServerActor.stop();
  };
}

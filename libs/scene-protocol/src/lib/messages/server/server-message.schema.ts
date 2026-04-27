/**
 * Server -> Client messages (what the backend sends)
 */
import * as z from 'zod';

import { TodoSchema, UpdateTodoSchema } from '../../todos/todo.schema.js';
import { isoDatetimeToDate } from '../../utils/codecs/index.js';
import { EnvelopeMetaSchema } from '../envelope-meta.schema.js';
import { WsErrorSchema } from '../ws-error.schema.js';

const ServerAckSchema = z.object({
  type: z.literal('ACK'),
  id: z.uuid().optional(),
  ok: z.literal(true),
});

const ServerErrorSchema = z.object({
  type: z.literal('ERROR'),
  error: WsErrorSchema,
});

// TODO: remove this after debugging
const ServerTodosCreatedSchema = z.object({
  type: z.literal('TODOS.CREATED'),
  item: TodoSchema,
});

// TODO: remove this after debugging
const ServerTodosDeletedSchema = z.object({
  type: z.literal('TODOS.DELETED'),
  id: z.uuid(),
});

// TODO: remove this after debugging
const ServerTodosPatchedSchema = z.object({
  type: z.literal('TODOS.PATCHED'),
  id: z.uuid(),
  changes: UpdateTodoSchema,
  updatedAt: isoDatetimeToDate,
});

// TODO: remove this after debugging
const ServerTodosSnapshotSchema = z.object({
  type: z.literal('TODOS.SNAPSHOT'),
  items: z.array(TodoSchema),
});

const ServerMessageSchema = z
  .object({ meta: EnvelopeMetaSchema.optional() })
  .and(
    z.discriminatedUnion('type', [
      ServerAckSchema,
      ServerErrorSchema,
      ServerTodosCreatedSchema,
      ServerTodosDeletedSchema,
      ServerTodosPatchedSchema,
      ServerTodosSnapshotSchema,
    ])
  );

export {
  ServerAckSchema,
  ServerErrorSchema,
  ServerMessageSchema,
  ServerTodosCreatedSchema,
  ServerTodosDeletedSchema,
  ServerTodosPatchedSchema,
  ServerTodosSnapshotSchema,
};

type ServerAck = z.output<typeof ServerAckSchema>;
type ServerError = z.output<typeof ServerErrorSchema>;
type ServerMessage = z.output<typeof ServerMessageSchema>;
type ServerTodosCreated = z.output<typeof ServerTodosCreatedSchema>;
type ServerTodosDeleted = z.output<typeof ServerTodosDeletedSchema>;
type ServerTodosPatched = z.output<typeof ServerTodosPatchedSchema>;
type ServerTodosSnapshot = z.output<typeof ServerTodosSnapshotSchema>;

export type {
  ServerAck,
  ServerError,
  ServerMessage,
  ServerTodosCreated,
  ServerTodosDeleted,
  ServerTodosPatched,
  ServerTodosSnapshot,
};

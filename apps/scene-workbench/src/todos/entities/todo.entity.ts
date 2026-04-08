import { defineEntity, p } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

// TODO: remove this later
const TodoEntitySchema = defineEntity({
  name: 'Todo',
  properties: {
    id: p
      .uuid()
      .primary()
      .onCreate(() => v4()),
    completed: p.boolean().default(false),
    description: p.string().nullable(),
    title: p.string(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
});

export class TodoEntity extends TodoEntitySchema.class {}
TodoEntitySchema.setClass(TodoEntity);

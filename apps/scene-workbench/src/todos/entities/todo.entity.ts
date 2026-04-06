import { Entity, Opt, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

import type { Todo } from '@xstate-workshop/scene-protocol';

@Entity({ tableName: 'todo' })
export class TodoEntity implements Todo {
  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @Property({ type: 'boolean' })
  completed: boolean & Opt = false;

  @Property({ nullable: true })
  description: string | null;

  @Property()
  title: string;

  @Property({ type: 'datetime' })
  createdAt: Date & Opt = new Date();

  @Property({ onUpdate: () => new Date(), type: 'datetime' })
  updatedAt: Date & Opt = new Date();

  constructor(
    title: string,
    description: string | undefined,
    completed: boolean | undefined
  ) {
    this.completed = completed ?? false;
    this.description = description ?? null;
    this.title = title;
  }
}

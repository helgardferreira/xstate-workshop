import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { TodoFactory } from '../factories/todo.factory';

import { SeederContext } from './types/seeder-context';

export class TodoSeeder extends Seeder {
  private static count = 5;

  static withCount(count: number): typeof TodoSeeder {
    TodoSeeder.count = count;

    return TodoSeeder;
  }

  async run(em: EntityManager, context: SeederContext): Promise<void> {
    const todoFactory = new TodoFactory(em);

    context.todos = todoFactory.make(TodoSeeder.count);
  }
}

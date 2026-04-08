import { faker } from '@faker-js/faker';
import { Factory } from '@mikro-orm/seeder';
import type { EntityData } from '@mikro-orm/sqlite';

import { TodoEntity } from '../../src/todos/entities';

// TODO: remove this later
export class TodoFactory extends Factory<TodoEntity, EntityData<TodoEntity>> {
  model = TodoEntity;

  override definition(input?: EntityData<TodoEntity>): EntityData<TodoEntity> {
    const completed = input?.completed ?? false;
    const createdAt = input?.createdAt ? input.createdAt : faker.date.past();
    const description = input?.description ?? faker.food.description();
    const id = input?.id ?? faker.string.uuid();
    const title = input?.title ?? faker.food.dish();

    return {
      completed,
      createdAt,
      description,
      id,
      title,
    };
  }
}

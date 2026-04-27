import { Seeder } from '@mikro-orm/seeder';
import type { EntityManager } from '@mikro-orm/sqlite';

import { SeederContext } from './types/seeder-context';

export class SqliteSeeder extends Seeder<SeederContext> {
  run(_em: EntityManager): Promise<void> {
    // return this.call(em, [TodoSeeder.withCount(10)]);
    return Promise.resolve();
  }
}

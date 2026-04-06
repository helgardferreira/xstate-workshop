import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import config from '../../mikro-orm/sqlite.config';
import { PersistenceConfig } from '../common/schemas';

@Module({})
export class PersistenceModule {
  static async register(): Promise<DynamicModule> {
    const sqliteOrm = await MikroOrmModule.forRootAsync({
      driver: SqliteDriver,
      inject: [ConfigService<PersistenceConfig>],
      useFactory: (_configService: ConfigService<PersistenceConfig>) => config,
    });

    return {
      imports: [sqliteOrm],
      module: PersistenceModule,
      exports: [sqliteOrm],
    };
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConfigSchema } from './common/schemas';
import { PersistenceModule } from './persistence/persistence.module';
import { ScenesModule } from './scenes/scenes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: (config: Record<string, unknown>) => ConfigSchema.parse(config),
    }),
    PersistenceModule.register(),

    ScenesModule,
  ],
})
export class AppModule {}

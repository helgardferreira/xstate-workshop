import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConfigSchema } from './common/schemas';
import { PersistenceModule } from './persistence/persistence.module';
import { TextToSpeechModule } from './text-to-speech/text-to-speech.module';
import { TodosModule } from './todos/todos.module';

// TODO: implement HTTP REST request module to handle scene config serialization and de-serialization
// TODO: implement bare bones WS gateway
// TODO: implement bare bones mikro-orm setup with mikro-orm v7
//       - update TypeScript config (remove `tsconfig.prod.json` if possible) for mikro-orm v7
//       - update mikro-orm config in `apps/scene-workbench/mikro-orm/sqlite.config.ts`
//       - update `PersistenceModule`
//       - update seeders (if necessary)
// TODO: continue here...
@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: (config: Record<string, unknown>) => ConfigSchema.parse(config),
    }),
    PersistenceModule.register(),

    // TODO: rename this
    TextToSpeechModule,
    // TODO: implement new module for HTTP requests based on this
    TodosModule,
  ],
})
export class AppModule {}

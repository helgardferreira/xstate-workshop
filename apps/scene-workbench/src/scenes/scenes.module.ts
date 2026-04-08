import { Module } from '@nestjs/common';

import { BroadcastModule } from '../broadcast/broadcast.module';
import { TodosModule } from '../todos/todos.module';

import { ScenesController } from './scenes.controller';
import { ScenesGateway } from './scenes.gateway';
import { ScenesService } from './scenes.service';
import { TodosController } from './todos.controller';

@Module({
  imports: [
    BroadcastModule,
    // TODO: remove TodosModule later
    TodosModule,
  ],
  controllers: [ScenesController, TodosController],
  providers: [ScenesGateway, ScenesService],
})
export class ScenesModule {}

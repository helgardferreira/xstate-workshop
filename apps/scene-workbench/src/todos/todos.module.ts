import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { BroadcastModule } from '../broadcast/broadcast.module';

import { TodoEntity } from './entities';
import { TodosService } from './todos.service';

// TODO: remove this later
@Module({
  imports: [MikroOrmModule.forFeature([TodoEntity]), BroadcastModule],
  providers: [TodosService],
  exports: [TodosService],
})
export class TodosModule {}

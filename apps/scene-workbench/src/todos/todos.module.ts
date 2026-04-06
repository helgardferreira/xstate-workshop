import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { BroadcastModule } from '../broadcast/broadcast.module';

import { TodoEntity } from './entities';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

@Module({
  imports: [MikroOrmModule.forFeature([TodoEntity]), BroadcastModule],
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}

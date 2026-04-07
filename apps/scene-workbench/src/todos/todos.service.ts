import { wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { Injectable, NotFoundException } from '@nestjs/common';

import {
  type CreateTodo,
  type Todo,
  TodoSchema,
  type UpdateTodo,
} from '@xstate-workshop/scene-protocol';

import { BroadcastService } from '../broadcast/broadcast.service';

import { TodoEntity } from './entities';

@Injectable()
export class TodosService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(TodoEntity)
    private readonly todoRepository: EntityRepository<TodoEntity>,
    private readonly broadcastService: BroadcastService
  ) {}

  async create(data: CreateTodo): Promise<Todo> {
    const entity = this.todoRepository.create(data);
    await this.em.flush();

    const todo = TodoSchema.parse(entity);

    this.broadcastService.broadcast.created({ item: todo });

    return todo;
  }

  async findAll(): Promise<Todo[]> {
    const entities = await this.todoRepository.findAll();

    const todos = TodoSchema.array().parse(entities);

    return todos;
  }

  async findOne(id: string): Promise<Todo> {
    const entity = await this.todoRepository.findOne(id);

    if (!entity) throw new NotFoundException('Todo not found');

    const todo = TodoSchema.parse(entity);

    return todo;
  }

  async update(id: string, data: UpdateTodo): Promise<Todo> {
    const entity = await this.todoRepository.findOne(id);

    if (!entity) throw new NotFoundException('Todo not found');

    wrap(entity).assign(data);
    await this.em.flush();

    const todo = TodoSchema.parse(entity);

    this.broadcastService.broadcast.patched({
      changes: data,
      id,
      updatedAt: todo.updatedAt,
    });

    return todo;
  }

  async remove(id: string): Promise<void> {
    const count = await this.todoRepository.nativeDelete(id);

    if (count === 0) throw new NotFoundException('Todo not found');

    this.broadcastService.broadcast.deleted({ id });
  }
}

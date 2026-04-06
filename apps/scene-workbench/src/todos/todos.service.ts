import { wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { Injectable, NotFoundException } from '@nestjs/common';

import type {
  CreateTodo,
  Todo,
  UpdateTodo,
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
    const todo = this.todoRepository.create(data);
    await this.em.flush();

    this.broadcastService.broadcast.created({ item: todo });

    return todo;
  }

  async findAll(): Promise<Todo[]> {
    const todos = await this.todoRepository.findAll();

    return todos;
  }

  async findOne(id: string): Promise<Todo> {
    const todo = await this.todoRepository.findOne(id);

    if (!todo) throw new NotFoundException('Todo not found');

    return todo;
  }

  async update(id: string, data: UpdateTodo): Promise<Todo> {
    const todo = await this.todoRepository.findOne(id);

    if (!todo) throw new NotFoundException('Todo not found');

    wrap(todo).assign(data);
    await this.em.flush();

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

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import * as z from 'zod';

import {
  type CreateTodo,
  CreateTodoSchema,
  type Todo,
  TodoSchema,
  type UpdateTodo,
  UpdateTodoSchema,
} from '@xstate-workshop/scene-protocol';

import { ZodHttpInterceptor } from '../common/interceptors';
import { ZodHttpPipe } from '../common/pipes';
import { TodosService } from '../todos/todos.service';

// TODO: remove this later
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @UseInterceptors(new ZodHttpInterceptor(TodoSchema))
  createTodo(
    @Body(new ZodHttpPipe(CreateTodoSchema)) body: CreateTodo
  ): Promise<Todo> {
    return this.todosService.create(body);
  }

  @Get()
  @UseInterceptors(new ZodHttpInterceptor(TodoSchema))
  findAllTodos(): Promise<Todo[]> {
    return this.todosService.findAll();
  }

  @Get(':id')
  @UseInterceptors(new ZodHttpInterceptor(TodoSchema))
  findTodoById(
    @Param('id', new ZodHttpPipe(z.uuid())) id: string
  ): Promise<Todo> {
    return this.todosService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(new ZodHttpInterceptor(TodoSchema))
  updateTodoById(
    @Param('id', new ZodHttpPipe(z.uuid())) id: string,
    @Body(new ZodHttpPipe(UpdateTodoSchema)) body: UpdateTodo
  ): Promise<Todo> {
    return this.todosService.update(id, body);
  }

  @Delete(':id')
  removeTodoById(
    @Param('id', new ZodHttpPipe(z.uuid())) id: string
  ): Promise<void> {
    return this.todosService.remove(id);
  }
}

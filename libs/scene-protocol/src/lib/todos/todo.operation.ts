import { io } from '@xstate-workshop/io';

import {
  type CreateTodo,
  CreateTodoSchema,
  TodoSchema,
  type UpdateTodo,
  UpdateTodoSchema,
} from './todo.schema.js';

const createTodo = (todo: CreateTodo) =>
  io(TodoSchema, CreateTodoSchema).post('/api/todos/', todo);

const findAllTodos = () => io(TodoSchema.array()).get('/api/todos');

const findTodoById = (todoId: string) =>
  io(TodoSchema).get(`/api/todos/${todoId}`);

const updateTodoById = (todoId: string, todo: UpdateTodo) =>
  io(TodoSchema, UpdateTodoSchema).patch(`/api/todos/${todoId}`, todo);

const removeTodoById = (todoId: string) => io().delete(`/api/todos/${todoId}`);

export {
  createTodo,
  findAllTodos,
  findTodoById,
  removeTodoById,
  updateTodoById,
};

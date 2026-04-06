import {
  type CreateTodo,
  CreateTodoSchema,
  type Todo,
  TodoSchema,
  type UpdateTodo,
  UpdateTodoSchema,
} from './todo.schema.js';

const createTodo = async (todo: CreateTodo): Promise<Todo> => {
  const body = JSON.stringify(CreateTodoSchema.encode(todo));

  const res = await fetch('/api/todos', {
    body,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    method: 'POST',
  });
  const data: any = await res.json();

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return TodoSchema.decode(data);
};

const findAllTodos = async (): Promise<Todo[]> => {
  const res = await fetch('/api/todos', {
    headers: { Accept: 'application/json' },
    method: 'GET',
  });
  const data: any = await res.json();

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return TodoSchema.array().decode(data);
};

const findTodoById = async (id: string): Promise<Todo> => {
  const res = await fetch(`/api/todos/${id}`, {
    headers: { Accept: 'application/json' },
    method: 'GET',
  });
  const data: any = await res.json();

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return TodoSchema.decode(data);
};

const updateTodoById = async (id: string, todo: UpdateTodo): Promise<Todo> => {
  const body = JSON.stringify(UpdateTodoSchema.encode(todo));

  const res = await fetch(`/api/todos/${id}`, {
    body,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    method: 'PATCH',
  });
  const data: any = await res.json();

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return TodoSchema.decode(data);
};

const removeTodoById = async (id: string): Promise<void> => {
  const res = await fetch(`/api/todos/${id}`, {
    headers: { Accept: 'application/json' },
    method: 'DELETE',
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

export {
  createTodo,
  findAllTodos,
  findTodoById,
  removeTodoById,
  updateTodoById,
};

import * as z from 'zod';

import { isoDatetimeToDate } from '../utils/codecs/iso-datetime-to-date.codec.js';

// TODO: remove todo example schemas later when implementing actual features
// TODO: continue here...
const TodoSchema = z.object({
  id: z.uuid(),

  completed: z.boolean().default(false),
  description: z.string().max(200).nullish(),
  title: z.string().min(1).max(200),

  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
});

const CreateTodoSchema = z.object({
  completed: z.boolean().optional(),
  description: z.string().max(200).optional(),
  title: z.string().min(1).max(200),
});

const UpdateTodoSchema = z.object({
  completed: z.boolean().optional(),
  description: z.string().max(200).nullish(),
  title: z.string().min(1).max(200).optional(),
});

export { CreateTodoSchema, TodoSchema, UpdateTodoSchema };

type Todo = z.output<typeof TodoSchema>;
type CreateTodo = z.output<typeof CreateTodoSchema>;
type UpdateTodo = z.output<typeof UpdateTodoSchema>;

export type { Todo, CreateTodo, UpdateTodo };

import * as z from 'zod';

export const WsErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});

export type WsError = z.output<typeof WsErrorSchema>;

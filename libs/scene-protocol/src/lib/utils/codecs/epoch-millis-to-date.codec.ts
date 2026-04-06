import * as z from 'zod';

export const epochMillisToDate = z.codec(z.union([z.int().min(0)]), z.date(), {
  decode: (millis) =>
    new Date(typeof millis === 'string' ? Number(millis) : millis),
  encode: (date) => date.getTime(),
});

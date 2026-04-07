import * as z from 'zod';

export const EnvelopeMetaSchema = z.object({
  /**
   * Sent time on sender's clock—server can set on outbound
   */
  ts: z.date().optional(),
});

export type EnvelopeMeta = z.output<typeof EnvelopeMetaSchema>;

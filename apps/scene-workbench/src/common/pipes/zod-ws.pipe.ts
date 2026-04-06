import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import * as z from 'zod';

import { WsErrorException } from '../exceptions';

@Injectable()
export class ZodWsPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      return this.schema.decode(value);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new WsErrorException({
          code: 'VALIDATION',
          message: z.prettifyError(err),
        });
      }

      throw new WsErrorException({
        code: 'VALIDATION',
        message: 'Validation failed',
      });
    }
  }
}

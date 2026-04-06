import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import * as z from 'zod';

@Injectable()
export class ZodHttpPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      return this.schema.decode(value);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new BadRequestException('Validation failed', {
          cause: err,
          description: z.prettifyError(err),
        });
      }

      throw new BadRequestException('Validation failed', { cause: err });
    }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ZodType } from 'zod';

@Injectable()
export class ZodHttpInterceptor<T> implements NestInterceptor {
  constructor(private readonly schema: ZodType<T>) {}

  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((value) => {
        try {
          return Array.isArray(value)
            ? this.schema.array().encode(value)
            : this.schema.encode(value);
        } catch (err) {
          Logger.error(err);

          throw new InternalServerErrorException(
            'Internal response did not match the contract'
          );
        }
      })
    );
  }
}

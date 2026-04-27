import {
  type OperatorFunction,
  catchError,
  from,
  map,
  mergeMap,
  of,
} from 'rxjs';
import type { ZodError, ZodType } from 'zod';

import { type Result, err, ok } from '../utils/index.js';

export const toEncoded =
  <Output, Input = unknown, Error = ZodError<Output>>(
    schema: ZodType<Output, Input>
  ): OperatorFunction<Output, Result<Input, Error>> =>
  (source) =>
    source.pipe(
      mergeMap((data) =>
        from(schema.encodeAsync(data)).pipe(
          map(ok),
          catchError((error) => of(err(error)))
        )
      )
    );

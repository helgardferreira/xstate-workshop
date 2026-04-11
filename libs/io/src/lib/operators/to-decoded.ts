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

export const toDecoded =
  <Output, Input = unknown, Error = ZodError<Output>>(
    schema: ZodType<Output, Input>
  ): OperatorFunction<Input, Result<Output, Error>> =>
  (source) =>
    source.pipe(
      mergeMap((data) =>
        from(schema.decodeAsync(data)).pipe(
          map(ok),
          catchError((error) => of(err(error)))
        )
      )
    );

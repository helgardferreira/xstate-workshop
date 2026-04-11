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

export const toParsed =
  <Output, Error = ZodError<Output>>(
    schema: ZodType<Output, unknown>
  ): OperatorFunction<unknown, Result<Output, Error>> =>
  (source) =>
    source.pipe(
      mergeMap((data) =>
        from(schema.parseAsync(data)).pipe(
          map(ok),
          catchError((error) => of(err(error)))
        )
      )
    );

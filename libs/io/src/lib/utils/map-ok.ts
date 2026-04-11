import { type OperatorFunction, catchError, map, of } from 'rxjs';

import { err } from './err.js';
import { ok } from './ok.js';
import type { Result } from './types.js';

export const mapOk =
  <T, R, E = unknown>(
    project: (value: T, index: number) => R
  ): OperatorFunction<Result<T, E>, Result<R, E>> =>
  (source) =>
    source.pipe(
      map((result, index) =>
        result.ok ? ok(project(result.value, index)) : result
      ),
      catchError((error) => of(err(error)))
    );

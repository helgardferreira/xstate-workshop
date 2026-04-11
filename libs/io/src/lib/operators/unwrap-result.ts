import { Observable, type OperatorFunction } from 'rxjs';

import type { Result } from '../utils/index.js';

export const unwrapResult =
  <T, E = unknown>(): OperatorFunction<Result<T, E>, T> =>
  (src) =>
    new Observable<T>((subscriber) =>
      src.subscribe({
        next: (r) =>
          r.ok ? subscriber.next(r.value) : subscriber.error(r.error),
        error: (e) => subscriber.error(e),
        complete: () => subscriber.complete(),
      })
    );

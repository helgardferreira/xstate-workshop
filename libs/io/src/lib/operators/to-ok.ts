import { type OperatorFunction, map } from 'rxjs';

import { type Err, type Ok, ok } from '../utils/index.js';

type ToOkReturnType<T> =
  T extends Err<infer E> ? Err<E> : T extends Ok<infer V> ? Ok<V> : Ok<T>;

export const toOk = <T>(): OperatorFunction<T, ToOkReturnType<T>> =>
  map((data) =>
    typeof data === 'object' && data !== null && 'ok' in data
      ? (data as ToOkReturnType<T>)
      : (ok(data) as ToOkReturnType<T>)
  );

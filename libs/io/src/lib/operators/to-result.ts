import type { Observable } from 'rxjs';

import type { Err, Ok, Result } from '../utils/index.js';

import { toErr } from './to-err.js';
import { toOk } from './to-ok.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractOk<T> = T extends Ok<infer V> ? V : T extends Err<any> ? never : T;
type ExtractErr<T> = T extends Err<infer E> ? E : never;

type ToResultReturnType<T> =
  Result<
    [ExtractOk<T>] extends [never] ? unknown : ExtractOk<T>,
    [ExtractErr<T>] extends [never] ? unknown : ExtractErr<T>
  > extends infer R
    ? R
    : never;

export const toResult = <T>() => {
  return (source: Observable<T>): Observable<ToResultReturnType<T>> => {
    return source.pipe(toOk(), toErr()) as Observable<ToResultReturnType<T>>;
  };
};

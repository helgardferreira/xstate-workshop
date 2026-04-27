import { type Observable, type OperatorFunction, catchError, of } from 'rxjs';

import { type Err, err } from '../utils/index.js';

export const toErr = <T, E>(): OperatorFunction<T, T | Err<E>> =>
  catchError<T, Observable<Err<E>>>((error) => of(err(error)));

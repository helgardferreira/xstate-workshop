import type { Err, Result } from './types.js';

const err = <E>(error: E): Err<E> => ({ ok: false, error });

const isErr = <T, E>(result: Result<T, E>): result is Err<E> => !result.ok;

export { err, isErr };

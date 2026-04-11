import type { Ok, Result } from './types.js';

const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok;

export { isOk, ok };

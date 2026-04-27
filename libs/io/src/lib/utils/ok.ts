import type { Ok, Result } from './types.js';

const ok = <V>(value: V): Ok<V> => ({ ok: true, value });

const isOk = <V, E>(result: Result<V, E>): result is Ok<V> => result.ok;

export { isOk, ok };

type Ok<V> = { ok: true; value: V };
type Err<E> = { ok: false; error: E };
type Result<V, E = unknown> = Ok<V> | Err<E>;

export type { Err, Ok, Result };

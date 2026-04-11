type Ok<T> = { ok: true; value: T };
type Err<E> = { ok: false; error: E };
type Result<T, E = unknown> = Ok<T> | Err<E>;

export type { Err, Ok, Result };

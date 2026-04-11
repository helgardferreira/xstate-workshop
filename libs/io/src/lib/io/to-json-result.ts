import { type OperatorFunction, from, map, of, switchMap } from 'rxjs';

import { type Result, err, ok } from '../utils/index.js';

export const toJSONResult = (): OperatorFunction<
  Response,
  Result<unknown, { message: string }>
> =>
  switchMap((response) =>
    response.ok
      ? from(response.json()).pipe(map(ok))
      : of(err({ message: `Error ${response.status}` }))
  );

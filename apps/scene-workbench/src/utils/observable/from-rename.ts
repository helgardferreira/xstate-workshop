import fs from 'node:fs';

import { Observable } from 'rxjs';

import { type Result, err, ok } from '@xstate-workshop/io';

export function fromRename(
  oldPath: string,
  newPath: string
): Observable<Result<undefined, NodeJS.ErrnoException>> {
  return new Observable<Result<undefined, NodeJS.ErrnoException>>(
    (subscriber) => {
      fs.rename(oldPath, newPath, (error) => {
        if (error) {
          subscriber.next(err(error));
          subscriber.complete();
        } else {
          subscriber.next(ok(undefined));
          subscriber.complete();
        }
      });
    }
  );
}

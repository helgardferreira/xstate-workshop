import fs from 'node:fs';

import { Observable } from 'rxjs';

import { type Result, err, ok } from '@xstate-workshop/io';

type FromMakeDirectoryOptions = {
  mode?: number | string | undefined;
  recursive?: boolean | undefined;
};

export function fromMakeDirectory(
  dirPath: string,
  options?: FromMakeDirectoryOptions
): Observable<Result<string | undefined, NodeJS.ErrnoException>> {
  return new Observable<Result<string | undefined, NodeJS.ErrnoException>>(
    (subscriber) => {
      fs.mkdir(dirPath, { ...options }, (error, path) => {
        if (error) {
          subscriber.next(err(error));
          subscriber.complete();
        } else {
          subscriber.next(ok(path));
          subscriber.complete();
        }
      });
    }
  );
}

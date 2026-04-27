import fs from 'node:fs';

import { Observable } from 'rxjs';

import { type Result, err, ok } from '@xstate-workshop/io';

type FromReadDirectoryOptions = {
  encoding?: BufferEncoding | null | undefined;
  recursive?: boolean | undefined;
};

export function fromReadDirectory(
  dirPath: string,
  options?: FromReadDirectoryOptions
): Observable<Result<fs.Dirent[], NodeJS.ErrnoException>> {
  return new Observable<Result<fs.Dirent[], NodeJS.ErrnoException>>(
    (subscriber) => {
      fs.readdir(
        dirPath,
        { ...options, withFileTypes: true },
        (error, entries) => {
          if (error) {
            subscriber.next(err(error));
            subscriber.complete();
          } else {
            subscriber.next(ok(entries));
            subscriber.complete();
          }
        }
      );
    }
  );
}

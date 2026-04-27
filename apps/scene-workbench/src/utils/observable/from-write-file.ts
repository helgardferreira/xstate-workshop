import fs from 'node:fs';

import { Observable } from 'rxjs';

import { type Result, err, ok } from '@xstate-workshop/io';

type FromWriteFileOptions = {
  encoding?: BufferEncoding;
  mode?: number | string | undefined;
  flag?: string | undefined;
  flush?: boolean | undefined;
};

export function fromWriteFile(
  filePath: string,
  data: string | NodeJS.ArrayBufferView,
  options?: FromWriteFileOptions
): Observable<Result<undefined, NodeJS.ErrnoException>> {
  return new Observable<Result<undefined, NodeJS.ErrnoException>>(
    (subscriber) => {
      const controller = new AbortController();

      fs.writeFile(
        filePath,
        data,
        { ...options, signal: controller.signal },
        (error) => {
          if (error) {
            if (error.name === 'AbortError') return;
            subscriber.next(err(error));
            subscriber.complete();
          } else {
            subscriber.next(ok(undefined));
            subscriber.complete();
          }
        }
      );

      return () => controller.abort();
    }
  );
}

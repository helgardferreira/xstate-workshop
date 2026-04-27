import fs from 'node:fs';

import { Observable } from 'rxjs';

import { type Result, err, ok } from '@xstate-workshop/io';

type FromReadFileOptions = {
  encoding?: BufferEncoding;
  flag?: string | undefined;
};

type FromReadFileResult<T extends FromReadFileOptions> = T extends {
  encoding: BufferEncoding;
}
  ? Observable<Result<string, NodeJS.ErrnoException>>
  : Observable<Result<Buffer, NodeJS.ErrnoException>>;

export function fromReadFile<T extends FromReadFileOptions>(
  filePath: string,
  options?: T
): FromReadFileResult<T> {
  return new Observable<Result<string | Buffer, NodeJS.ErrnoException>>(
    (subscriber) => {
      const controller = new AbortController();

      fs.readFile(
        filePath,
        { ...options, signal: controller.signal },
        (error, data) => {
          if (error) {
            if (error.name === 'AbortError') return;
            subscriber.next(err(error));
            subscriber.complete();
          } else {
            subscriber.next(ok(data));
            subscriber.complete();
          }
        }
      );

      return () => controller.abort();
    }
  ) as FromReadFileResult<T>;
}

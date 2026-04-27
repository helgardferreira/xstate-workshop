import fs from 'node:fs';

import { Observable } from 'rxjs';

import { type Result, err, ok } from '@xstate-workshop/io';

type FromFileStatsOptions = {
  bigint?: boolean;
};

type FromFileStatsResult<T extends FromFileStatsOptions> = T extends {
  bigint: true;
}
  ? Observable<Result<fs.BigIntStats, NodeJS.ErrnoException>>
  : Observable<Result<fs.Stats, NodeJS.ErrnoException>>;

export function fromFileStats<T extends FromFileStatsOptions>(
  filePath: string,
  options?: T
): FromFileStatsResult<T> {
  return new Observable<
    Result<fs.Stats | fs.BigIntStats, NodeJS.ErrnoException>
  >((subscriber) => {
    fs.stat(filePath, { ...options }, (error, stats) => {
      if (error) {
        subscriber.next(err(error));
        subscriber.complete();
      } else {
        subscriber.next(ok(stats));
        subscriber.complete();
      }
    });
  }) as FromFileStatsResult<T>;
}

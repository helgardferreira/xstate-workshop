import fs from 'node:fs';
import path from 'node:path';

import { Injectable, NotFoundException } from '@nestjs/common';
import { kebabCase } from 'es-toolkit';
import {
  type Observable,
  filter,
  forkJoin,
  map,
  mergeMap,
  of,
  throwIfEmpty,
  toArray,
} from 'rxjs';
import { ZodError } from 'zod';

import {
  type Err,
  type Result,
  toDecoded,
  toParsed,
  toResult,
  unwrapResult,
} from '@xstate-workshop/io';
import {
  SceneConfig,
  SceneConfigSchema,
  SceneSummary,
  SceneSummarySchema,
} from '@xstate-workshop/scene-protocol';

import {
  fromFileStats,
  fromMakeDirectory,
  fromReadDirectory,
  fromReadFile,
  fromRemoveFile,
  fromRename,
  fromWriteFile,
} from '../utils/observable';

type SceneConfigWithStats = {
  config: SceneConfig;
  filePath: string;
  stats: fs.Stats;
};

const SCENES_DIR_PATH = path.join(process.cwd(), 'data', 'scenes');

@Injectable()
export class ScenesService {
  constructor() {}

  public findAll(): Observable<
    Result<
      SceneSummary[],
      NodeJS.ErrnoException | ZodError<SceneConfig> | ZodError<SceneSummary>
    >
  > {
    return this.fromSceneConfigWithStats().pipe(
      unwrapResult(),
      map(({ config, filePath, stats }) => ({
        entityCount: config.entities.length,
        filename: filePath.split('/').at(-1) ?? '',
        name: config.name,
        updatedAt: stats.mtime.toISOString(),
      })),
      toDecoded(SceneSummarySchema),
      unwrapResult(),
      toArray(),
      toResult<
        | SceneSummary[]
        | Err<NodeJS.ErrnoException>
        | Err<ZodError<SceneConfig>>
        | Err<ZodError<SceneSummary>>
      >()
    );
  }

  public findOne(
    name: string
  ): Observable<
    Result<
      SceneConfig,
      NotFoundException | NodeJS.ErrnoException | ZodError<SceneConfig>
    >
  > {
    return this.fromSceneConfig().pipe(
      unwrapResult(),
      filter((config) => config.name === name),
      throwIfEmpty(() => new NotFoundException()),
      toResult<
        | SceneConfig
        | Err<NodeJS.ErrnoException>
        | Err<NotFoundException>
        | Err<ZodError<SceneConfig>>
      >()
    );
  }

  public upsert(
    data: SceneConfig
  ): Observable<Result<SceneConfig, NodeJS.ErrnoException>> {
    const filename = `${kebabCase(data.name)}.scene.json`;
    const tmpFilename = `${filename}.${Date.now()}.tmp`;
    const fileData = JSON.stringify(data, null, 2);

    return fromMakeDirectory(SCENES_DIR_PATH, { recursive: true }).pipe(
      unwrapResult(),
      mergeMap(() =>
        fromWriteFile(path.join(SCENES_DIR_PATH, tmpFilename), fileData, {
          encoding: 'utf-8',
        })
      ),
      unwrapResult(),
      mergeMap(() =>
        fromRename(
          path.join(SCENES_DIR_PATH, tmpFilename),
          path.join(SCENES_DIR_PATH, filename)
        )
      ),
      unwrapResult(),
      map(() => data),
      toResult<SceneConfig | Err<NodeJS.ErrnoException>>()
    );
  }

  public remove(
    name: string
  ): Observable<
    Result<
      undefined,
      NotFoundException | NodeJS.ErrnoException | ZodError<SceneConfig>
    >
  > {
    return this.fromSceneConfigWithStats().pipe(
      unwrapResult(),
      filter(({ config }) => config.name === name),
      throwIfEmpty(() => new NotFoundException()),
      mergeMap(({ filePath }) => fromRemoveFile(filePath)),
      toResult()
    );
  }

  private fromSceneConfig(): Observable<
    Result<SceneConfig, NodeJS.ErrnoException | ZodError<SceneConfig>>
  > {
    return this.fromSceneFilePath().pipe(
      unwrapResult(),
      mergeMap((filePath) =>
        fromReadFile(filePath, { encoding: 'utf-8' }).pipe(
          unwrapResult(),
          map((file) => JSON.parse(file)),
          toParsed(SceneConfigSchema),
          unwrapResult()
        )
      ),
      toResult<
        SceneConfig | Err<NodeJS.ErrnoException> | Err<ZodError<SceneConfig>>
      >()
    );
  }

  private fromSceneConfigWithStats(): Observable<
    Result<SceneConfigWithStats, NodeJS.ErrnoException | ZodError<SceneConfig>>
  > {
    return this.fromSceneFilePath().pipe(
      unwrapResult(),
      mergeMap((filePath) =>
        forkJoin({
          config: fromReadFile(filePath, { encoding: 'utf-8' }).pipe(
            unwrapResult(),
            map((file) => JSON.parse(file)),
            toParsed(SceneConfigSchema),
            unwrapResult()
          ),
          filePath: of(filePath),
          stats: fromFileStats(filePath).pipe(unwrapResult()),
        })
      ),
      toResult<
        | SceneConfigWithStats
        | Err<NodeJS.ErrnoException>
        | Err<ZodError<SceneConfig>>
      >()
    );
  }

  private fromSceneFilePath(): Observable<
    Result<string, NodeJS.ErrnoException>
  > {
    return fromReadDirectory(SCENES_DIR_PATH).pipe(
      unwrapResult(),
      mergeMap((entries) => entries),
      filter((entry) => entry.isFile() && entry.name.endsWith('.scene.json')),
      map((entry) => path.join(entry.parentPath, entry.name)),
      toResult<string | Err<NodeJS.ErrnoException>>()
    );
  }
}

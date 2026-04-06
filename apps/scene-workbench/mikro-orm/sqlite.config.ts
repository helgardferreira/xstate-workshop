import path from 'path';

import { SeedManager } from '@mikro-orm/seeder';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { defineConfig } from '@mikro-orm/sqlite';

import { seederFileName } from './utils/seeder-file-name';

export default defineConfig({
  dbName: path.join(process.cwd(), 'scene_workbench.db'),
  /**
   * Enables debug mode to log SQL queries and discovery information.
   */
  debug: true,
  entities: [
    path.join(process.cwd(), 'apps/scene-workbench/dist/src/**/*.entity.js'),
  ],
  entitiesTs: [
    path.join(process.cwd(), 'apps/scene-workbench/src/**/*.entity.ts'),
  ],
  extensions: [SeedManager],
  forceUtcTimezone: true,
  /**
   * For vitest, to get around:
   * ```
   * TypeError: Unknown file extension ".ts" (ERR_UNKNOWN_FILE_EXTENSION)
   * ```
   */
  // dynamicImportProvider: (id) => import(id),
  /**
   * Highlights logged SQL queries.
   */
  highlighter: new SqlHighlighter(),
  schemaGenerator: {
    /**
     * Whether to generate FK constraints.
     */
    createForeignKeyConstraints: true,
    /**
     * Wrap statements with `set foreign_key_checks = 0` or equivalent.
     */
    disableForeignKeys: true,
    /**
     * Allows ignoring some schemas when diffing
     */
    ignoreSchema: [],
  },
  seeder: {
    /**
     * Default seeder class name.
     */
    defaultSeeder: 'SqliteSeeder',
    /**
     * Seeder generation mode.
     */
    emit: 'ts',
    /**
     * Seeder file naming convention.
     */
    fileName: seederFileName,
    /**
     * Path to the folder with seeders.
     */
    path: path.join(
      process.cwd(),
      'apps/scene-workbench/dist/mikro-orm/seeders'
    ),
    /**
     * Path to the folder with TS seeders (if used, you should
     * put path to compiled files in `path`).
     */
    pathTs: path.join(process.cwd(), 'apps/scene-workbench/mikro-orm/seeders'),
  },
});

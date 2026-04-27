import { z } from 'zod';

import { isoDatetimeToDate } from '../utils/codecs/index.js';

// ────────────────────────────────────────────
// Scene summary (for listing endpoints)
// ────────────────────────────────────────────

const SceneSummarySchema = z.object({
  /** Scene name derived from the config's `name` field. */
  name: z.string(),

  /** Filename on disk, e.g. "test-level.scene.json". */
  filename: z.string(),

  /** Number of entities in the scene. */
  entityCount: z.number().int().nonnegative(),

  /** Last modification date of the file. */
  updatedAt: isoDatetimeToDate,
});

type SceneSummary = z.output<typeof SceneSummarySchema>;

export { SceneSummarySchema };

export type { SceneSummary };

import type { GLTF } from 'three/addons';

import type { MODEL_NAMES } from './constants';

type ModelName = (typeof MODEL_NAMES)[number];

type Models = {
  [K in ModelName]: GLTF;
};

export type { ModelName, Models };

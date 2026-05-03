import { EquirectangularReflectionMapping } from 'three';

import { loadModels } from './load-models';
import { type Textures, loadTextures } from './load-textures';
import type { Models } from './types';

export type SceneAssets = {
  models: Models;
  textures: Textures;
};

export async function loadSceneAssets(): Promise<SceneAssets> {
  const models = await loadModels();
  const textures = await loadTextures();
  textures.environmentMap.mapping = EquirectangularReflectionMapping;

  return { models, textures };
}

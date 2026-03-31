import { forkJoin, lastValueFrom } from 'rxjs';
import { type GLTF, GLTFLoader } from 'three/addons';

import { getModelUrl } from '../../../utils';

export type Models = {
  car: GLTF;
};

export async function loadModels(): Promise<Models> {
  const gltfLoader = new GLTFLoader();

  const models = await lastValueFrom(
    forkJoin({
      car: gltfLoader.loadAsync(getModelUrl('car', 'gltf')),
    })
  );

  return models;
}

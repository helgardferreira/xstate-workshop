import { from, lastValueFrom, mergeScan } from 'rxjs';
import { GLTFLoader } from 'three/addons';

import { MODEL_NAMES } from '../constants';
import type { Models } from '../types';

function loadModels(): Promise<Models> {
  const gltfLoader = new GLTFLoader();

  return lastValueFrom(
    from(MODEL_NAMES).pipe(
      mergeScan(async (acc, key) => {
        const model = await gltfLoader.loadAsync(
          new URL(
            `../../assets/models/conveyor-kit/${key}.glb`,
            import.meta.url
          ).href
        );
        acc[key] = model;

        return acc;
      }, {} as Models)
    )
  );
}

export { loadModels };

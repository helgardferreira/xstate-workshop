import { forkJoin, lastValueFrom } from 'rxjs';
import type { DataTexture } from 'three';
import { HDRLoader } from 'three/addons';

import { getTextureUrl } from '../utils';

export type Textures = {
  environmentMap: DataTexture;
};

export function loadTextures(): Promise<Textures> {
  const hdrLoader = new HDRLoader();

  return lastValueFrom(
    forkJoin({
      environmentMap: hdrLoader.loadAsync(
        getTextureUrl('environment-map', ['1', '2k'])
      ),
    })
  );
}

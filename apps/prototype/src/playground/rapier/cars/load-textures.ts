import { forkJoin, lastValueFrom } from 'rxjs';
import { type DataTexture, EquirectangularReflectionMapping } from 'three';
import { HDRLoader } from 'three/addons';

import { getTextureUrl } from '../../../utils';

export type Textures = {
  environmentMap: DataTexture;
};

export async function loadTextures(): Promise<Textures> {
  const hdrLoader = new HDRLoader();

  const textures = await lastValueFrom(
    forkJoin({
      environmentMap: hdrLoader.loadAsync(
        // TODO: replace this with better skybox texture
        getTextureUrl('environment-map', ['1', '2k'])
      ),
    })
  );
  textures.environmentMap.mapping = EquirectangularReflectionMapping;

  return textures;
}

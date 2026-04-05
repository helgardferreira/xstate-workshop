import { camelCase } from 'es-toolkit';
import { from, lastValueFrom, mergeScan } from 'rxjs';
import { type GLTF, GLTFLoader } from 'three/addons';

import type { CamelCase } from '@xstate-workshop/utils';

const modelSlugs = [
  'arrow-basic',
  'arrow',
  'box-large',
  'box-long',
  'box-small',
  'box-wide',
  'conveyor-bars-fence',
  'conveyor-bars-high',
  'conveyor-bars-sides',
  'conveyor-bars-stripe-fence',
  'conveyor-bars-stripe-high',
  'conveyor-bars-stripe-side',
  'conveyor-bars-stripe',
  'conveyor-bars',
  'conveyor-long-sides',
  'conveyor-long-stripe-sides',
  'conveyor-long-stripe',
  'conveyor-long',
  'conveyor-sides',
  'conveyor-stripe-sides',
  'conveyor-stripe',
  'conveyor',
  'cover-bar',
  'cover-corner',
  'cover-hopper',
  'cover-stripe-bar',
  'cover-stripe-corner',
  'cover-stripe-hopper',
  'cover-stripe-top',
  'cover-stripe-window',
  'cover-stripe',
  'cover-top',
  'cover-window',
  'cover',
  'door-wide-closed',
  'door-wide-half',
  'door-wide-open',
  'door',
  'floor-large',
  'floor',
  'robot-arm-a',
  'robot-arm-b',
  'scanner-high',
  'scanner-low',
  'structure-corner-inner',
  'structure-corner-outer',
  'structure-doorway-wide',
  'structure-doorway',
  'structure-high',
  'structure-medium',
  'structure-short',
  'structure-tall',
  'structure-wall',
  'structure-window-wide',
  'structure-window',
  'structure-yellow-high',
  'structure-yellow-medium',
  'structure-yellow-short',
  'structure-yellow-tall',
  'top-large',
  'top',
] as const;

type ModelsKeys = (typeof modelSlugs)[number] extends `${infer T}`
  ? T extends `${infer U}`
    ? CamelCase<U>
    : never
  : never;

export type Models = {
  [K in ModelsKeys]: GLTF;
};

export function loadModels(): Promise<Models> {
  const gltfLoader = new GLTFLoader();

  return lastValueFrom(
    from(modelSlugs).pipe(
      mergeScan(async (acc, slug) => {
        const key = camelCase(slug) as keyof Models;
        const model = await gltfLoader.loadAsync(
          new URL(`../assets/models/conveyor-kit/${slug}.glb`, import.meta.url)
            .href
        );
        acc[key] = model;

        return acc;
      }, {} as Models)
    )
  );
}

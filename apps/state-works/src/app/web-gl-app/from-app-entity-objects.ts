import { filter, toArray } from 'rxjs';
import type { Object3D } from 'three';

import { fromObject3dTraverse } from '../../utils';
import { AppEntityUserDataSchema } from '../schemas';

export function fromAppEntityObjects(object: Object3D) {
  return fromObject3dTraverse(object).pipe(
    filter(
      (previous) => AppEntityUserDataSchema.safeParse(previous.userData).success
    ),
    toArray()
  );
}

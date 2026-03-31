import { type Observable, expand, from } from 'rxjs';
import type { Object3D } from 'three';

export const fromObject3dTraverse = (object: Object3D): Observable<Object3D> =>
  from([object]).pipe(expand((object) => object.children));

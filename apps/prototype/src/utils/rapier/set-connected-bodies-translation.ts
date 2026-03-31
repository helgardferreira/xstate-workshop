import type * as RapierNS from '@dimforge/rapier3d';
import { Vector3, type Vector3Like } from 'three';

import { getConnectedBodies } from './get-connected-bodies';

const offsetVector = new Vector3();
const vector = new Vector3();

export function setConnectedBodiesTranslation(
  world: RapierNS.World,
  root: RapierNS.RigidBody,
  position: Vector3Like
) {
  const bodies = getConnectedBodies(world, root);

  offsetVector.subVectors(position, root.translation());

  bodies.forEach((body) => {
    vector.addVectors(body.translation(), offsetVector);

    body.setTranslation(vector, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  });
}

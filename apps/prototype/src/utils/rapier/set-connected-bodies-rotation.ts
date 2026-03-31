import type * as RapierNS from '@dimforge/rapier3d';
import { Quaternion, type QuaternionLike, Vector3 } from 'three';

import { getConnectedBodies } from './get-connected-bodies';

const offsetQuaternion = new Quaternion();
const rootQuaternion = new Quaternion();
const quaternion = new Quaternion();
const offsetVector = new Vector3();
const rootVector = new Vector3();
const vector = new Vector3();

export function setConnectedBodiesRotation(
  world: RapierNS.World,
  root: RapierNS.RigidBody,
  rotation: QuaternionLike
) {
  const bodies = getConnectedBodies(world, root);

  rootQuaternion.copy(root.rotation());
  rootVector.copy(root.translation());

  /*
   * Offset rotation = rotation * inverse(root rotation)
   */
  offsetQuaternion.copy(rotation).multiply(rootQuaternion.invert());

  bodies.forEach((body) => {
    /*
     * New rotation = root offset rotation * body rotation
     */
    quaternion.copy(body.rotation()).premultiply(offsetQuaternion);

    /*
     * Offset position = body position - root position (rotated by the root offset rotation)
     */
    offsetVector
      .subVectors(body.translation(), rootVector)
      .applyQuaternion(offsetQuaternion);

    /*
     * New position = root position + offset position
     */
    vector.addVectors(rootVector, offsetVector);

    body.setRotation(quaternion, true);
    body.setTranslation(vector, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  });
}

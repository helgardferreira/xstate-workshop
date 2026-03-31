import {
  type Object3D,
  Quaternion,
  type QuaternionLike,
  Vector3,
  type Vector3Like,
} from 'three';

import { setWorldPosition } from './set-world-position';
import { setWorldQuaternion } from './set-world-quaternion';

type SetWorldFromOptions = {
  offsetPosition?: Vector3Like;
  offsetRotation?: QuaternionLike;
};

const offsetQuaternion = new Quaternion();
const quaternion = new Quaternion();
const offsetVector = new Vector3();
const vector = new Vector3();

export function setWorldFrom(
  object: Object3D,
  translation: Vector3Like,
  rotation: QuaternionLike,
  options?: SetWorldFromOptions
) {
  const {
    offsetPosition = { x: 0, y: 0, z: 0 },
    offsetRotation = { w: 1, x: 0, y: 0, z: 0 },
  } = options ?? {};

  offsetVector.copy(offsetPosition);
  offsetQuaternion.copy(offsetRotation);

  quaternion.copy(rotation).multiply(offsetQuaternion).normalize();
  vector.copy(translation).sub(offsetVector.applyQuaternion(quaternion));

  setWorldQuaternion(object, quaternion);
  setWorldPosition(object, vector);
}

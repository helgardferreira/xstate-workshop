import { Object3D, type QuaternionLike, type Vector3 } from 'three';

export function addScaledQuaternion(
  position: Vector3,
  rotation: QuaternionLike,
  distance: number
) {
  const direction = Object3D.DEFAULT_UP.clone()
    .applyQuaternion(rotation)
    .normalize();

  return position.clone().addScaledVector(direction, distance);
}

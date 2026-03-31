import type { Object3D, Vector3 } from 'three';

/**
 * Sets an Object3D’s `position` so that its origin ends up at the given
 * __world-space__ position.
 *
 * Three.js stores `object.position` in __parent-local space__, not world space.
 * This helper converts the desired world position into the object’s parent
 * space and writes the result to `object.position`.
 *
 * @param object The object whose local `position` will be updated.
 * @param vector The target position in world space.
 */
export function setWorldPosition(object: Object3D, vector: Vector3) {
  const parent = object.parent;

  if (!parent) {
    object.position.copy(vector);
    return;
  }

  parent.updateWorldMatrix(true, false);

  object.position.copy(parent.worldToLocal(vector.clone()));
}

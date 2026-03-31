import {
  Matrix4,
  type Object3D,
  Quaternion,
  type QuaternionLike,
  Vector3,
} from 'three';

const parentWorldQuaternion = new Quaternion();
const localQuaternion = new Quaternion();
const quaternion = new Quaternion();

const matrix = new Matrix4();
const parentMatrixInverted = new Matrix4();
const worldPosition = new Vector3();
const worldScale = new Vector3();

/**
 * Sets an Object3D's rotation to match a desired world-space quaternion.
 *
 * `setWorldQuaternion` will perform either one of the following implementations
 * depending on the value of `nonUniformScale`:
 *
 * - When `nonUniformScale = false` (default):
 *   - Assumes no problematic non-uniform scaling in ancestors. Uses quaternion
 *     math: `localQuaternion` = `inverse(parentWorldQuaternion)` * `rotation`
 *
 * - When `nonUniformScale = true`:
 *   - Handles non-uniform scaling (and other matrix quirks) in ancestors by
 *     solving using matrices and decomposing.
 *
 * @param object The object to update.
 * @param rotation Desired rotation in world space.
 * @param nonUniformScale When true, uses the matrix/decompose approach.
 */
export function setWorldQuaternion(
  object: Object3D,
  rotation: QuaternionLike,
  nonUniformScale = false
): Quaternion {
  quaternion.copy(rotation);
  const parent = object.parent;

  if (nonUniformScale) {
    object.updateWorldMatrix(true, false);

    object.getWorldPosition(worldPosition);
    object.getWorldScale(worldScale);

    /*
     * Set `matrix` to the transformation composed of translation (`worldPosition`),
     * rotation (`rotation`), and scale (`worldScale`).
     */
    matrix.compose(worldPosition, quaternion, worldScale);

    /*
     * If `object` has no parent then we just set `object.quaternion` to
     * `rotation`.
     */
    if (!parent) {
      matrix.decompose(object.position, object.quaternion, object.scale);

      return object.quaternion;
    }

    parent.updateWorldMatrix(true, false);
    parentMatrixInverted.copy(parent.matrixWorld).invert();

    /*
     * Multiply `matrix`, on the left side, by the inverted parent matrix
     * (`parentMatrixInverted`) and then update the `object` with the correct
     * rotational data.
     */
    matrix.premultiply(parentMatrixInverted);
    matrix.decompose(object.position, object.quaternion, object.scale);

    return object.quaternion;
  }

  /*
   * If `object` has no parent then we just set `object.quaternion` to
   * the provided `rotation`.
   */
  if (!parent) {
    return object.quaternion.copy(quaternion);
  }

  parent.updateWorldMatrix(true, false);
  parent.getWorldQuaternion(parentWorldQuaternion);

  /*
   * Set the new value of the local quaternion to the inverse of
   * `parentWorldQuaternion` multiplied by the provided `rotation`.
   */
  localQuaternion.copy(parentWorldQuaternion).invert().multiply(quaternion);

  return object.quaternion.copy(localQuaternion);
}

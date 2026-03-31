type UnpackedCollisionGroupMasks = {
  /**
   * A 16-bit bitmask of groups this collider belongs to.
   */
  membershipMask: number;
  /**
   * A 16-bit bitmask of groups this collider is allowed to collide with.
   */
  filterMask: number;
};

/**
 * Unpacks a 32-bit collision group value into membership and filter masks.
 *
 * @param packed Combined collision groups.
 * @returns Object containing `membershipMask` and `filterMask`.
 * @example
 * ```ts
 * const { membershipMask, filterMask } = unpackCollisionGroupMasks(0x00020001);
 * // membershipMask: 0x0002, filterMask: 0x0001
 * ```
 */
export function unpackCollisionGroupMasks(
  packed: number
): UnpackedCollisionGroupMasks {
  return {
    membershipMask: (packed >> 16) & 0xffff,
    filterMask: packed & 0xffff,
  };
}

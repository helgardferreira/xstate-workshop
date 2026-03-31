/**
 * Pack Rapier collision group membership + filter masks into the 32-bit integer
 * format expected by `Collider.setCollisionGroups(...)` /
 * `ColliderDesc.setCollisionGroups(...)`.
 *
 * Rapier encodes collision groups as:
 *   - upper 16 bits: "membership" mask (which groups this collider belongs to)
 *   - lower 16 bits: "filter" mask (which groups this collider is allowed to
 *     collide with)
 *
 * This helper shifts the membership mask into the upper 16 bits and ORs in the filter.
 *
 * @param membershipMask A 16-bit bitmask of groups this collider belongs to.
 * @param filterMask A 16-bit bitmask of groups this collider is allowed to collide with.
 * @returns A 32-bit packed collision-groups value usable with Rapier collider APIs.
 *
 * @example
 * ```ts
 * const WORLD = createCollisionGroupMask(0);
 * const FAN_BODY = createCollisionGroupMask(1);
 * const FAN_BLADES = createCollisionGroupMask(2);
 *
 * // Fan body belongs to FAN_BODY and collides only with WORLD
 * const bodyGroups = packCollisionGroupMasks(FAN_BODY, WORLD);
 *
 * // Fan blades belong to FAN_BLADES and collides only with WORLD
 * const bladesGroups = packCollisionGroupMasks(FAN_BLADES, WORLD);
 *
 * // Result: body and blades ignore each other, but both collide with the world.
 * bodyCollider.setCollisionGroups(bodyGroups);
 * bladesCollider.setCollisionGroups(bladesGroups);
 * ```
 */
export function packCollisionGroupMasks(
  membershipMask: number,
  filterMask: number
): number {
  return (membershipMask << 16) | filterMask;
}

/**
 * Create a single collision-group bitmask for Rapier's 16-bit group system.
 *
 * Rapier collision groups are expressed as bitmasks. Each group occupies one
 * bit (0..15). This helper returns a mask with only the given group's bit
 * enabled.
 *
 * @param groupIndex The group bit index (0..15). For example:
 *   - 0 -> 0b1
 *   - 1 -> 0b10
 *   - 2 -> 0b100.
 * @returns A 16-bit bitmask with only `groupIndex` enabled.
 *
 * @example
 * ```ts
 * const WORLD = createCollisionGroupMask(0); // 1
 * const PLAYER = createCollisionGroupMask(1); // 2
 * const ENEMIES = createCollisionGroupMask(2); // 4
 * const playerAndWorld = PLAYER | WORLD; // combine masks with bitwise OR
 * ```
 */
export function createCollisionGroupMask(groupIndex: number): number {
  return 1 << groupIndex;
}

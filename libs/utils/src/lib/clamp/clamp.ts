/**
 * Clamps a numeric value between the provided min and max values.
 *
 * @param value The value to clamp
 * @param min The minimum possible value
 * @param max The maximum possible value
 * @returns A number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(Math.min(value, max), min);
}

/**
 * Linearly interpolates between min and max using a normalized value.
 *
 * @param value Normalized value (usually in the range 0–1)
 * @param min Minimum value of the range
 * @param max Maximum value of the range
 */
export function lerp(value: number, min: number, max: number): number {
  return min + value * (max - min);
}

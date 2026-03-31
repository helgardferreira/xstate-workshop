/**
 * Normalizes a value within a range to a 0–1 scale.
 *
 * @param value The value to normalize
 * @param min The minimum of the range
 * @param max The maximum of the range
 * @returns A number between 0 and 1 (can be <0 or >1 if value is outside the range)
 */
export function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min);
}

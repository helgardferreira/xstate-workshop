/**
 * smootherstep is a polynomial “ease” function that remaps a parameter `value`
 * in [0, 1] to another value in [0, 1], but with very flat ends.
 *
 * @param value Normalized value (in the range [0, 1])
 * @returns
 */
export function smootherstep(value: number): number {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

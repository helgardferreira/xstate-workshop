export function calculateCylinderMass(
  density: number,
  height: number,
  radius: number
): number {
  const volume = Math.PI * radius * radius * height;

  return density * volume;
}

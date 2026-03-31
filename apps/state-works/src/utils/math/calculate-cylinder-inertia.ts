type CylinderInertia = {
  /**
   * Inertia around the cylinder's main axis (axial):
   *
   * ```
   * (1/2) × m × r²
   * ```
   */
  axial: number;
  /**
   * Inertia around axes perpendicular to cylinder (transverse):
   *
   * ```
   * (m / 12) × (3r² + h²)
   * ```
   */
  transverse: number;
};

/**
 * Calculates the principal angular inertia for a solid cylinder oriented along
 * the Y-axis.
 *
 * Uses standard moment of inertia formulas for a uniform solid cylinder:
 * - Axial inertia (Y-axis):
 * ```
 * I = (1/2) × m × r²
 * ```
 * - Transverse inertia (X/Z-axes):
 * ```
 * I = (1/12) × m × (3r² + h²)
 * ```
 *
 * @param mass Mass of the cylinder
 * @param height Height of the cylinder
 * @param radius Radius of the cylinder
 */
export function calculateCylinderInertia(
  mass: number,
  height: number,
  radius: number
): CylinderInertia {
  const axial = 0.5 * mass * radius * radius;
  const transverse = (1 / 12) * mass * (3 * radius * radius + height * height);

  return { axial, transverse };
}

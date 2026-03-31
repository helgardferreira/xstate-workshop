import type * as RapierNS from '@dimforge/rapier3d';
import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  LineBasicMaterial,
  LineSegments,
} from 'three';

export type CreatePhysicsWorldHelperOptions = {
  maxVertices?: number;
};

export type PhysicsWorldHelper = {
  lines: LineSegments<BufferGeometry, LineBasicMaterial>;
  update: () => void;
};

// TODO: refactor this
//       - reimplement to class that extends from `Object3D` (use `ImpulseHelper` as a reference)
//       - implement correct disposal mechanism
export function createPhysicsWorldHelper(
  world: RapierNS.World,
  options?: CreatePhysicsWorldHelperOptions
): PhysicsWorldHelper {
  const { maxVertices = 100_000 } = options ?? {};

  const maxVerticesLength = maxVertices * 3;

  const geometry = new BufferGeometry();
  const lines = new LineSegments(
    geometry,
    new LineBasicMaterial({ vertexColors: true })
  );

  const colorArray = new Float32Array(maxVerticesLength);
  const positionArray = new Float32Array(maxVerticesLength);

  const colorAttribute = new BufferAttribute(colorArray, 3);
  const positionAttribute = new BufferAttribute(positionArray, 3);

  colorAttribute.setUsage(DynamicDrawUsage);
  positionAttribute.setUsage(DynamicDrawUsage);

  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('color', colorAttribute);

  function update() {
    if (lines.visible === false) return;

    const { vertices, colors } = world.debugRender();

    if (
      vertices.length > maxVerticesLength ||
      colors.length > maxVerticesLength
    ) {
      const clampedVerticesLength = Math.min(
        vertices.length,
        maxVerticesLength
      );
      const clampedColorsLength = Math.min(colors.length, maxVerticesLength);

      positionArray.set(vertices.subarray(0, clampedVerticesLength));
      colorArray.set(colors.subarray(0, clampedColorsLength));

      positionAttribute.needsUpdate = true;
      colorAttribute.needsUpdate = true;

      geometry.setDrawRange(0, clampedVerticesLength / 3);
      return;
    }

    positionArray.set(vertices);
    colorArray.set(colors);

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;

    geometry.setDrawRange(0, vertices.length / 3);
  }

  return {
    lines,
    update,
  };
}

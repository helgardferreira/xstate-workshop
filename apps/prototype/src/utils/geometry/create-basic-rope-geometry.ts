import { CurvePath, LineCurve3, TubeGeometry, type Vector3 } from 'three';

export type CreateBasicRopeGeometryOptions = {
  closed?: boolean;
  points: Vector3[];
  radialSegments?: number;
  radius?: number;
  tubularSegments?: number;
};

// TODO: rename this to `createBasicAnchorGeometry`
export const createBasicRopeGeometry = ({
  closed = false,
  points,
  radialSegments = 64,
  radius = 0.125,
  tubularSegments = 64,
}: CreateBasicRopeGeometryOptions): TubeGeometry => {
  const path = new CurvePath<Vector3>();

  for (let i = 0; i < points.length; i += 1) {
    const v1 = points.at(i);
    const v2 = points.at(i + 1);

    if (v1 === undefined || v2 === undefined) break;

    path.add(new LineCurve3(v1, v2));
  }

  return new TubeGeometry(
    path,
    tubularSegments,
    radius,
    radialSegments,
    closed
  );
};

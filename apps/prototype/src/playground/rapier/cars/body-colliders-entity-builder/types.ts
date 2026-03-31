import type { Object3D, Quaternion, Vector3 } from 'three';

export type Component = {
  object: Object3D;
};

export type Components = Record<string, Component>;

export type ComponentWithOffsets<T extends Component> = T & {
  offsetPosition?: Vector3;
  offsetRotation?: Quaternion;
};

export type ComponentsWithOffsets<T extends Components = Components> = {
  [P in keyof T]: ComponentWithOffsets<T[P]>;
};

import type { Object3D } from 'three';

export type Component = {
  object: Object3D;
};

export type Components = Record<string, Component>;

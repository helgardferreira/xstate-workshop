import { createCollisionGroupMask } from '../../../utils';

export enum CarSide {
  Left,
  Right,
}

export enum FloorType {
  AsphaltDry,
  AsphaltWet,
  Concrete,
  Dirt,
  Grass,
  Ice,
  Sand,
  Snow,
}

export const WORLD_COLLISION_GROUP_MASK = createCollisionGroupMask(0);
export const CAR_BODY_COLLISION_GROUP_MASK = createCollisionGroupMask(1);
export const CAR_WHEEL_COLLISION_GROUP_MASK = createCollisionGroupMask(2);
export const CAR_WINDOW_COLLISION_GROUP_MASK = createCollisionGroupMask(3);

export const FLOOR_COLLIDER_HEIGHT = 0.1;

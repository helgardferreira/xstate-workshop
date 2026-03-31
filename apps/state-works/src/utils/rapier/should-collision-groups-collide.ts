import { unpackCollisionGroupMasks } from './unpack-collision-group-masks';

export function shouldCollisionGroupsCollide(
  interactionGroups1: number,
  interactionGroups2: number
): boolean {
  const { membershipMask: membershipMask1, filterMask: filterMask1 } =
    unpackCollisionGroupMasks(interactionGroups1);
  const { membershipMask: membershipMask2, filterMask: filterMask2 } =
    unpackCollisionGroupMasks(interactionGroups2);

  const condition1 = (membershipMask1 & filterMask2) !== 0;
  const condition2 = (membershipMask2 & filterMask1) !== 0;

  return condition1 && condition2;
}

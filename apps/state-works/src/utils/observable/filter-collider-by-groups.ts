import type * as RapierNS from '@dimforge/rapier3d';
import { type MonoTypeOperatorFunction, filter } from 'rxjs';

import { shouldCollisionGroupsCollide } from '../rapier/should-collision-groups-collide';

export function filterColliderByGroups(
  collider1: RapierNS.Collider,
  shouldCollide = true
): MonoTypeOperatorFunction<RapierNS.Collider> {
  return (source) =>
    source.pipe(
      filter(
        (collider2) =>
          shouldCollide ===
          shouldCollisionGroupsCollide(
            collider1.collisionGroups(),
            collider2.collisionGroups()
          )
      )
    );
}

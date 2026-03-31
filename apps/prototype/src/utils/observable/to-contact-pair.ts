import type * as RapierNS from '@dimforge/rapier3d';
import { type OperatorFunction, concatMap } from 'rxjs';

import { type ContactPair, fromContactPair } from './from-contact-pair';

export function toContactPair(
  world: RapierNS.World,
  collider1: RapierNS.Collider
): OperatorFunction<RapierNS.Collider, ContactPair> {
  return (source) =>
    source.pipe(
      concatMap((collider2) => fromContactPair(world, collider1, collider2))
    );
}

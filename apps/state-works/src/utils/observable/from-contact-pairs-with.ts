import type * as RapierNS from '@dimforge/rapier3d';
import { Observable } from 'rxjs';

export function fromContactPairsWith(
  world: RapierNS.World,
  collider1: RapierNS.Collider
): Observable<RapierNS.Collider> {
  return new Observable((subscriber) => {
    world.contactPairsWith(collider1, (collider2) =>
      subscriber.next(collider2)
    );

    subscriber.complete();
  });
}

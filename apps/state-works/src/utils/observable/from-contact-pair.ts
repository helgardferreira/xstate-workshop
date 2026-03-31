import type * as RapierNS from '@dimforge/rapier3d';
import { Observable } from 'rxjs';
import type { Vector3Like } from 'three';

export type ManifoldContact = {
  contactDist: number;
  impulse: number;
  localPoint1: Vector3Like | null;
  localPoint2: Vector3Like | null;
};
export type ManifoldSolverContact = {
  dist: number;
  friction: number;
  point: Vector3Like;
  restitution: number;
  tangentVelocity: Vector3Like;
};

export type ContactPair = {
  collider1: RapierNS.Collider;
  collider2: RapierNS.Collider;
  contacts: ManifoldContact[];
  flipped: boolean;
  normal: Vector3Like;
  solverContacts: ManifoldSolverContact[];
};

export function fromContactPair(
  world: RapierNS.World,
  collider1: RapierNS.Collider,
  collider2: RapierNS.Collider
): Observable<ContactPair> {
  return new Observable((subscriber) => {
    world.contactPair(collider1, collider2, (manifold, flipped) => {
      const contacts: ManifoldContact[] = [];
      const normal = manifold.normal();
      const solverContacts: ManifoldSolverContact[] = [];

      for (let i = 0; i < manifold.numContacts(); i++) {
        const contactDist = manifold.contactDist(i);
        const impulse = manifold.contactImpulse(i);
        const localPoint1 = manifold.localContactPoint1(i);
        const localPoint2 = manifold.localContactPoint2(i);

        contacts.push({
          contactDist,
          impulse,
          localPoint1: localPoint1 ? { ...localPoint1 } : null,
          localPoint2: localPoint2 ? { ...localPoint2 } : null,
        });
      }

      for (let i = 0; i < manifold.numSolverContacts(); i++) {
        const dist = manifold.solverContactDist(i);
        const friction = manifold.solverContactFriction(i);
        const point = manifold.solverContactPoint(i);
        const restitution = manifold.solverContactRestitution(i);
        const tangentVelocity = manifold.solverContactTangentVelocity(i);

        solverContacts.push({
          dist,
          friction,
          point: { ...point },
          restitution,
          tangentVelocity: { ...tangentVelocity },
        });
      }

      subscriber.next({
        collider1,
        collider2,
        contacts,
        flipped,
        normal: { ...normal },
        solverContacts,
      });
    });

    subscriber.complete();
  });
}

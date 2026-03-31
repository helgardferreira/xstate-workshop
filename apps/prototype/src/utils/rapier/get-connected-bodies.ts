import type * as RapierNS from '@dimforge/rapier3d';

export function getConnectedBodies(
  world: RapierNS.World,
  root: RapierNS.RigidBody
): Set<RapierNS.RigidBody> {
  const bodies = new Set<RapierNS.RigidBody>([root]);
  const queue: RapierNS.RigidBody[] = [root];

  while (queue.length > 0) {
    const currentBody = queue.shift() as RapierNS.RigidBody;

    world.impulseJoints.forEach((joint) => {
      const body1 = joint.body1();
      const body2 = joint.body2();

      if (body1.handle === currentBody.handle && !bodies.has(body2)) {
        bodies.add(body2);
        queue.push(body2);
      } else if (body2.handle === currentBody.handle && !bodies.has(body1)) {
        bodies.add(body1);
        queue.push(body1);
      }
    });
  }

  return bodies;
}

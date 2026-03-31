import type * as RapierNS from '@dimforge/rapier3d';

import { setWorldFrom } from '../../../../utils';

import type { Components, ComponentsWithOffsets } from './types';

export class BodyCollidersEntity<TComponents extends Components = Components> {
  constructor(
    private readonly world: RapierNS.World,
    private readonly components: ComponentsWithOffsets<TComponents>,
    public readonly body: RapierNS.RigidBody,
    public readonly colliders: RapierNS.Collider[]
  ) {}

  public dispose(): void {
    this.world.removeRigidBody(this.body);
  }

  public update(): void {
    const translation = this.body.translation();
    const rotation = this.body.rotation();

    for (const component of Object.values(this.components)) {
      setWorldFrom(component.object, translation, rotation, {
        offsetPosition: component.offsetPosition,
        offsetRotation: component.offsetRotation,
      });
    }
  }
}

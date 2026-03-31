import type * as RapierNS from '@dimforge/rapier3d';

export class BodyEntity {
  constructor(
    private readonly world: RapierNS.World,
    public readonly body: RapierNS.RigidBody
  ) {}

  public dispose(): void {
    this.world.removeRigidBody(this.body);
  }
}

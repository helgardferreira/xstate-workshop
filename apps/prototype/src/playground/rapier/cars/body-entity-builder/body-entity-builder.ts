import type * as RapierNS from '@dimforge/rapier3d';

import { BodyEntity } from './body-entity';
import type { Components } from './types';

interface EntityBuildable {
  build(): BodyEntity;
}

// TODO: reimplement `body` and field as getter method for better WASM memory safety
export abstract class BodyEntityBuilder<
  TComponents extends Components = Components,
> implements EntityBuildable {
  protected body: RapierNS.RigidBody | null = null;

  constructor(
    protected readonly Rapier: typeof RapierNS,
    protected readonly world: RapierNS.World,
    protected readonly components: TComponents
  ) {}

  protected abstract onCreateRigidBody(): RapierNS.RigidBody;

  public createRigidBody(): EntityBuildable {
    this.body = this.onCreateRigidBody();
    return this;
  }

  public build(): BodyEntity {
    if (!this.body) {
      throw new Error('createRigidBody() must be called before build()');
    }

    return new BodyEntity(this.world, this.body);
  }
}

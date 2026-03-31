import type * as RapierNS from '@dimforge/rapier3d';

import { BodyCollidersEntity } from './body-colliders-entity';
import type { Components, ComponentsWithOffsets } from './types';

interface EntityWithBody<TComponents extends Components> {
  createColliders(): EntityBuildable<TComponents>;
}

interface EntityBuildable<TComponents extends Components> {
  computeOffsets(): EntityBuildable<TComponents>;
  build(): BodyCollidersEntity<TComponents>;
}

// TODO: reimplement `body` and `colliders` fields as getter methods for better WASM memory safety
export abstract class BodyCollidersEntityBuilder<
  TComponents extends Components = Components,
>
  implements EntityWithBody<TComponents>, EntityBuildable<TComponents>
{
  protected body: RapierNS.RigidBody | null = null;
  protected colliders: RapierNS.Collider[] | null = null;

  constructor(
    protected readonly Rapier: typeof RapierNS,
    protected readonly world: RapierNS.World,
    protected readonly components: ComponentsWithOffsets<TComponents>
  ) {}

  protected abstract onCreateRigidBody(): RapierNS.RigidBody;
  protected abstract onCreateColliders(
    body: RapierNS.RigidBody
  ): RapierNS.Collider[];
  protected onComputeOffsets(_body: RapierNS.RigidBody): void {}

  public createRigidBody(): EntityWithBody<TComponents> {
    this.body = this.onCreateRigidBody();
    return this;
  }

  public createColliders(): EntityBuildable<TComponents> {
    if (!this.body) {
      throw new Error(
        'createRigidBody() must be called before createColliders()'
      );
    }
    this.colliders = this.onCreateColliders(this.body);
    return this;
  }

  public computeOffsets(): EntityBuildable<TComponents> {
    if (!this.body) {
      throw new Error(
        'createRigidBody() must be called before computeOffsets()'
      );
    }
    this.onComputeOffsets(this.body);
    return this;
  }

  public build(): BodyCollidersEntity<TComponents> {
    if (!this.body || !this.colliders) {
      throw new Error(
        'createRigidBody() and createColliders() must be called before build()'
      );
    }

    return new BodyCollidersEntity(
      this.world,
      this.components,
      this.body,
      this.colliders
    );
  }
}
